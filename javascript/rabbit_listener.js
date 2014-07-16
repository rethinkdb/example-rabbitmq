#!/usr/bin/env node

amqp = require('amqplib');

// Setup the rabbit connection

var rabbit_conn = null;
var channel = null;
var exchange = 'rethinkdb';
var queue = null;

// Create the rabbit connection
amqp.connect('amqp://localhost:5672').then(function(conn){
    rabbit_conn = conn;
    // Create the rabbit channel
    return rabbit_conn.createChannel();
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
        change = JSON.parse(msg.content);
        console.log('RabbitMQ -(', msg.fields.routingKey, ')-> Listener');
        switch (msg.fields.routingKey.split('.')[1]){
            case 'create':
              console.log(JSON.stringify(change.new_val, undefined, 2));
              break;
            case 'delete':
              console.log(JSON.stringify(change.old_val, undefined, 2));
             break;
            case 'update':
              console.log('Old value:');
              console.log(JSON.stringify(change.old_val, undefined, 2));
              console.log('New value:');
              console.log(JSON.stringify(change.new_val, undefined, 2));
            break;
        }
        console.log(new Array(81).join('=') + '\n')

    })
})
