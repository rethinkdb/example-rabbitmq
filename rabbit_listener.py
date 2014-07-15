#!/usr/bin/env python2

import pika
import json

# Setup the rabbit connection and queue
rabbit_conn = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost', port=5672),
)
exchange = 'rethinkdb'
channel = rabbit_conn.channel()
channel.exchange_declare(exchange=exchange, type='topic', durable=False)
queue = channel.queue_declare(exclusive=True).method.queue

# Bind to all changes on the 'mytable' topic
channel.queue_bind(queue, exchange, routing_key='mytable.*')

# Listen for changes and print them out
print 'Started listening...'

for method, properties, payload in channel.consume(queue):
    change = json.loads(payload)
    change_typ = method.routing_key.split('.')[1]
    print 'RabbitMQ -(', method.routing_key, ')-> Listener'
    if change_typ == 'create':
        print json.dumps(change['new_val'], indent=True, sort_keys=True)
    elif change_typ == 'delete':
        print json.dumps(change['old_val'], indent=True, sort_keys=True)
    else:
        print 'Old value:'
        print json.dumps(change['old_val'], indent=True, sort_keys=True)
        print 'New value:'
        print json.dumps(change['new_val'], indent=True, sort_keys=True)
    print '='*80, '\n'
    
