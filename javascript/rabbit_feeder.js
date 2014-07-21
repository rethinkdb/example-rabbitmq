#!/usr/bin/env node

var r = require('rethinkdb');
var amqp = require('amqplib');

var rethinkConn;
var rabbitConn;
var channel;
var exchange = 'rethinkdb';


r.connect({host: 'localhost', port: 28015}).then(function(conn) {
    // Setup RethinkDB connection
    rethinkConn = conn;
}).catch(r.Error.RqlDriverError, function(err){
    console.log(err.message);
    process.exit(1);
}).then(function createDB(){
    // Ensure database exists for this example
    return r.dbCreate('change_example').run(rethinkConn);
}).finally(function createTable(){
    // Ensure table exists for this example
    return r.db('change_example').tableCreate('mytable').run(rethinkConn);
}).catch(r.Error.RqlRuntimeError, function(){
    // We ignore db/table exists errors here because amqplib uses a
    // different promise library from rethinkdb, and the error doesn't
    // propagate correctly from one to the other.
}).then(function(){
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
    changeCursor.each(function(err, change){
        if(err){
            // The table may have been deleted, or possibly connection issues
            console.log('A problem reading from RethinkDB cursor:');
            console.log(err.msg);
            process.exit(1);
        }
        var routingKey = 'mytable.' + typeOfChange(change);
        console.log('RethinkDB -(', routingKey, ')-> RabbitMQ')
        channel.publish(
            exchange, routingKey, new Buffer(JSON.stringify(change)));
    });
}).catch(function(err){
    console.log(err.message);
    process.exit(1);
});

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
