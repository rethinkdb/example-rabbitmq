#!/usr/bin/env node

r = require('rethinkdb');
amqp = require('amqplib');

var rethinkConn = null;
var rabbitConn = null;
var channel = null;
var exchange = 'rethinkdb';


r.connect({host: 'localhost', port: 28015}).then(function(conn) {
    // Setup RethinkDB connection
    rethinkConn = conn;
}).finally(function createDB(){
    // Ensure database exists for this example
    return r.dbCreate('change_example').run(rethinkConn);
}).finally(function createTable(){
    // Ensure table exists for this example
    return r.db('change_example').tableCreate('mytable').run(rethinkConn)
}
// ignore db/table exists error
).catch(r.Error.RqlRuntimeError, function(){}
).then(function(){
    // Setup rabbit connection
    return amqp.connect('amqp://localhost:5672');
}).then(function(conn){
    rabbitConn = conn;
    // Setup rabbit channel
    return rabbitConn.createChannel();
}).then(function(ch){
    channel = ch;
    // Setup rabbit exchange
    return channel.assertExchange(exchange, 'topic', {durable: false});
}).then(function(){
    // Listen for changes on our table
    return r.db('change_example').table('mytable').changes().run(rethinkConn);
}).then(function(changeCursor){
    // Feed changes into rabbit
    changeCursor.each(function(error, change){
        var routingKey = 'mytable.' + typeOfChange(change);
        console.log('RethinkDB -(', routingKey, ')-> RabbitMQ')
        channel.publish(
            exchange, routingKey, new Buffer(JSON.stringify(change)));
    })
})

function typeOfChange(change) {
    // Determines whether the change is a create, delete or update
    if(change.old_val === null){
        return 'create';
    } else if(change.new_val === null){
        return 'delete';
    } else {
        return 'update';
    }
    return 'something'
}
