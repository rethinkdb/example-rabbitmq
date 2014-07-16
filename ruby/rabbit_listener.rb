#!/usr/bin/env ruby

require 'bunny'
require 'json'


# Setup the rabbit connection and queue
rabbit_conn = Bunny.new(:host => 'localhost', :port => 5672).start
channel = rabbit_conn.create_channel
exchange = channel.topic("rethinkdb", :durable => false)
queue = channel.queue('', :exclusive => true)

# Bind to all changes on the 'mytable' topic
queue.bind(exchange, :routing_key => 'mytable.*')

# Listen for changes and print them out
puts 'Started listening...'

queue.subscribe(:block => true) do |delivery_info, metadata, payload|
  change = JSON.parse(payload)
  puts "RabbitMQ -( #{delivery_info.routing_key} )-> Listener"

  case delivery_info.routing_key.split('.')[1]
  when 'create'
    puts JSON.pretty_generate(change['new_val'])
  when 'delete'
    puts JSON.pretty_generate(change['old_val'])
  when 'update'
    puts "Old value:"
    puts JSON.pretty_generate(change['old_val'])
    puts "New value:"
    puts JSON.pretty_generate(change['new_val'])
  end
  puts "="*80, "\n"
end
