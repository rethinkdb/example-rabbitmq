#!/usr/bin/env python2
'''Listens for changes on a rethinkdb table and sends them over a
RabbitMQ topic exchange.

The topic will be <tablename>.<type_of_change> where type_of_change is
create, delete or update.'''

import pika
import rethinkdb as r
import json

# Setup RethinkDB connection
rethink_conn = r.connect(host='localhost', port=28015)

# Ensure correct database and table exist for this example
try:
    r.db_create('change_example').run(rethink_conn)
except r.RqlRuntimeError:
    pass

try:
    r.db('change_example').table_create('mytable').run(rethink_conn)
except r.RqlRuntimeError:
    pass

# Setup rabbit connection and exchange
rabbit_conn = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost', port=5672)
)
exchange = 'rethinkdb'
channel = rabbit_conn.channel()
channel.exchange_declare(exchange, exchange_type='topic', durable=False)
    

def type_of_change(change):
    '''Determines whether the change is a create, delete or update'''
    if change['old_val'] is None:
        return 'create'
    elif change['new_val'] is None:
        return 'delete'
    else:
        return 'update'

# Start feeding...
table_changes = r.db('change_example').table('mytable').changes()

for change in table_changes.run(rethink_conn):
    routing_key = 'mytable.' + type_of_change(change)
    print 'RethinkDB -(', routing_key, ')-> RabbitMQ'
    channel.basic_publish(exchange, routing_key, json.dumps(change))
