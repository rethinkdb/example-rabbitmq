# Example RethinkDB integration with RabbitMQ #

This repo gives example code that can be used to connect RethinDB
change feeds into RabbitMQ topic exchanges. The idea being that you
can use RabbitMQ's publish/subscribe features to listen to changes on
your RethinkDB tables in real-time.

This repo contains an example integration for Python, Ruby, and
Javascript (NodeJS).

## Set up RethinkDB and RabbitMQ

First install RethinkDB. These examples assume the server will be
listening on localhost on the default port 28015.

## Installation

Each script has two dependencies, the RethinkDB client and a library
for interacting with RabbitMQ in that language. For Python that's
[pika](http://pika.readthedocs.org), for Ruby it's
[Bunny](http://rubybunny.info), and for JavaScript it's
[amqplib](http://www.squaremobius.net/amqp.node) (also known as
amqp.node).

```bash
$ git clone http://github.com/rethinkdb/example-rabbitmq
$ cd example-rabbitmq
$ pip install -r requirements.txt
# or
$ bundler install
# or
$ npm install .
```

## Rabbit feeder

The feeder script listens to changes to a RethinkDB table and inserts
them into a RabbitMQ exchange as it's notified about them. Due to
RethinkDB's [changefeeds](http://rethinkdb.com/docs/changefeeds),
there's no need to poll for table changes, the entire system is
push/pull.

```bash
$ ./rabbit_feeder.py
# or
$ ./rabbit_feeder.rb
# or
$ ./rabbit_feeder.js
```

## Rabbit listener

The listener script simply connects to the RabbitMQ instance and binds
a queue to the `rethinkdb` exchange (created by the feeder script). It
then prints out the changes coming through and what topic it received
the message on. You'll want to run the listener in another window from
the feeder:

```bash
$ ./rabbit_listener.py
# or
$ ./rabbit_listener.rb
# or
$ ./rabbit_listener.js
```

## Change generator

This repo also contains a python script for generating random changes
in the table the feeder scripts are subscribed to. This script isn't a
part of the integration itself, but is useful for seeing changes
happen in real-time. Again, you'll want to run the generator in a
different window from the feeder and the listener.

```bash
$ ./change_generator.py
```
