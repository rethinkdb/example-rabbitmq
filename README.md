# Integrating RethinkDB with RabbitMQ #

Example code for connecting RethinkDB change feeds into RabbitMQ topic
exchanges.

This repo contains an example integration for Python, Ruby, and
JavaScript (NodeJS).

## Prerequisites

First, [install RethinkDB](http://rethinkdb.com/docs/install/). If you
haven't already, you may want to have a look at the
[quickstart guide](http://rethinkdb.com/docs/quickstart) as well.

You'll also want to
[install RabbitMQ](https://www.rabbitmq.com/download.html) for your
platform.

Finally, we recommend trying these out inside a
[virtualenv](virtualenv.readthedocs.com) if you're using Python, and
an [rvm gemset](https://rvm.io/) if you're using Ruby.

## Dependencies

Each script has two dependencies, the RethinkDB client and a library
for interacting with RabbitMQ in that language. For Python that's
[pika](http://pika.readthedocs.org), for Ruby it's
[Bunny](http://rubybunny.info), and for JavaScript it's
[amqplib](http://www.squaremobius.net/amqp.node) (also known as
amqp.node).

```bash
$ git clone http://github.com/rethinkdb/example-rabbitmq
$ cd example-rabbitmq/python
$ pip install -r requirements.txt
# or
$ cd example-rabbitmq/ruby
$ bundler install
# or
$ cd example-rabbitmq/javascript
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
$ cd .. # back to top level
$ ./change_generator.py
```
