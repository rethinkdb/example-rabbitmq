#!/usr/bin/env python2

import pika
import json

# Setup the rabbit connection and queue
rabbit_conn = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost', port=5672),
)
exchange = 'rethinkdb'
channel = rabbit_conn.channel()
channel.exchange_declare(exchange, exchange_type='topic', durable=False)
queue = channel.queue_declare(exclusive=True).method.queue

# Bind to all changes on the 'mytable' topic
channel.queue_bind(queue, exchange, routing_key='mytable.*')

# Listen for changes and print them out
print 'Started listening...'

for method, properties, payload in channel.consume(queue):
    change = json.loads(payload)
    tablename = method.routing_key.split('.')[0]
    print tablename, ' -> RabbitMQ -(', method.routing_key, ')-> Listener'
    print json.dumps(change, indent=True, sort_keys=True)
    print '='*80, '\n'
