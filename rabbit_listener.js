#!/usr/bin/env node

amqp = require('amqplib');

// Setup the rabbit connection

var rabbitConn = null;
var channel = null;
var exchange = 'rethinkdb';
var queue = null;

// Create the rabbit connection
amqp.connect('amqp://localhost:5672').then(function(conn){
    rabbitConn = conn;
    // Create the rabbit channel
    return rabbitConn.createChannel();
}).then(function(ch){
    channel = ch;
    // Create the exchange (or do nothing if it exists)
    return channel.assertExchange(exchange, 'topic', {durable: false});
}).then(function(){
    // Create the queue
    return channel.assertQueue('', {exclusive: true});
}).then(function(q){
    queue = q.queue;
    // Bind the queue to all topics about 'mytable'
    return channel.bindQueue(queue, exchange, 'mytable.*');
}).then(function(){
    console.log('Started listening...');
    channel.consume(queue, function(msg){
        // Handle each message as it comes in from RabbitMQ
        var change = JSON.parse(msg.content);
        var tablename = msg.fields.routingKey.split('.');
        var changeType = msg.fields.routingKey.split('.');
        console.log(tablename, '-> RabbitMQ -(',
                    msg.fields.routingKey, ')-> Listener');
        console.log(JSON.stringify(change, undefined, 2));
        console.log(new Array(81).join('=') + '\n')
    })
})
