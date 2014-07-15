#!/usr/bin/env node

r = require('rethinkdb');
amqp = require('amqplib');

var rethink_conn = null;
var rabbit_conn = null;
var channel = null;
var exchange = 'rethinkdb';


r.connect({host: 'localhost', port: 28015}).then(function(conn) {
    // Setup RethinkDB connection
    rethink_conn = conn;
    return conn;
}).finally(function createDB(){
    // Ensure database exists for this example
    return r.dbCreate('change_example').run(rethink_conn);
}).finally(function createTable(){
    // Ensure table exists for this example
    return r.db('change_example').tableCreate('mytable').run(rethink_conn)
}
// ignore db/table exists error
).catch(r.Error.RqlRuntimeError, function(){}
).then(function(){
    // Setup rabbit connection
    return amqp.connect('amqp://localhost:5672');
}).then(function(conn){
    rabbit_conn = conn;
    // Setup rabbit channel
    return rabbit_conn.createChannel();
}).then(function(ch){
    channel = ch;
    // Setup rabbit exchange
    return channel.assertExchange(exchange, 'topic', {durable: false});
}).then(function(){
    // Listen for changes on our table
    return r.db('change_example').table('mytable').changes().run(rethink_conn);
}).then(function(change_cursor){
    // Feed changes into rabbit
    change_cursor.each(function(error, change){
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
