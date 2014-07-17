#!/usr/bin/env ruby

# Listens for changes on a rethinkdb table and sends them over a
# RabbitMQ topic exchange.
#
# The topic will be <tablename>.<type_of_change> where
# type_of_change is create, delete or update.

require 'bunny'
require 'rethinkdb'
include RethinkDB::Shortcuts
require 'json'

# Setup RethinkDB connection
rethink_conn = r.connect(:host => 'localhost', :port => 28015)

# Ensure correct database and table exist for this example
begin
  r.db_create("change_example").run(rethink_conn)
rescue RethinkDB::RqlRuntimeError
end

begin
  r.db("change_example").table_create("mytable").run(rethink_conn)
rescue RethinkDB::RqlRuntimeError
end

# Setup rabbit connection and exchange
rabbit_conn = Bunny.new(:host => 'localhost', :port => 5672).start
channel = rabbit_conn.create_channel
exchange = channel.topic("rethinkdb")

# Determines whether the change is a create, delete or update
def type_of_change(change)
  if change['old_val'].nil?
    :create
  elsif change['new_val'].nil?
    :delete
  else
    :update
  end
end

# Start feeding...
table_changes = r.db('change_example').table('mytable').changes()

begin
  table_changes.run(rethink_conn).each do |change|
    routing_key = "mytable.#{type_of_change change}"
    puts "RethinkDB -( #{routing_key} )-> RabbitMQ"
    exchange.publish(change.to_json, :routing_key => routing_key)
  end
rescue RethinkDB::RqlRuntimeError => e
  # Table may have been dropped, connection failed etc
  puts e.message
end
