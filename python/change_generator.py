#!/usr/bin/env python2
'''This script generates random changes on the table. It's not
necessary to understand to use the other scripts, but running this is
a convenient way to make sure your change feed is constantly cranking
things out.
'''

import rethinkdb as r
import random
import time
import string

class ChangeGenerator(object):

    def __init__(self):
        self.conn = r.connect()
        self.absorb(r.db_create('change_example'))
        self.absorb(r.db('change_example').table_create('mytable'))
        self.table = r.db('change_example').table('mytable')

    def absorb(self, query):
        '''Ignore already created errors'''
        try:
            return query.run(self.conn)
        except r.RqlRuntimeError:
            pass

    @staticmethod
    def random_doc():
        return {
            random.choice(string.ascii_lowercase):
            random.choice(string.ascii_uppercase)
            for _ in xrange(random.randint(0, 3))
        }

    def create(self):
        print 'Creating a random doc...'
        self.table.insert(self.random_doc()).run(self.conn)

    def delete(self):
        print 'Deleting a random doc...'
        self.table.sample(1).delete().run(self.conn)

    def update(self):
        print 'Updating a random doc...'
        self.table.sample(1).update(self.random_doc()).run(self.conn)

    def create_changes(self):
        while True:
            getattr(self, random.choice(['create', 'update', 'delete']))()
            time.sleep(random.randint(2, 4))


if __name__ == '__main__':
    ChangeGenerator().create_changes()
