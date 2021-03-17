# Models
import os
from rethinkdb import RethinkDB
from uuid import uuid4
from flask import current_app
from datetime import datetime

from api.controllers.errors import ValidationError, DatabaseProcessError

from flask import current_app

r = RethinkDB()

#TODO: database should be from config
conn = r.connect(db='gigbox')
# conn = r.connect(db=current_app.config['DATABASE_NAME'])

def initialize_db(app):
    with app.app_context():
        conn.use(current_app.config['DATABASE_NAME'])
        print("Connection: {}".format(conn))

class RethinkDBModel(object):
    
    @classmethod
    def find(cls, id): 
        return r.table(cls._table).get(id).run(conn)
       
    @classmethod
    def filter(cls, predicate):
        return list(r.table(cls._table).filter(predicate).run(conn))

    @classmethod
    def update(cls, id, fields):
        status = r.table(cls._table).get(id).update(fields).run(conn)
        if status['errors']:
            raise DatabaseProcessError("Could not complete the update action")
        return True

    @classmethod
    def delete(cls, id):
        status = r.table(cls._table).get(id).delete().run(conn)
        if status['errors']:
            raise DatabaseProcessError("Could not complete the delete action")
        return True


class User(RethinkDBModel):
    _table = 'users'

    @classmethod
    def create(cls, **kwargs):
        id = kwargs.get("id")
        user_docs = list(r.table(cls._table).filter({'id': id}).run(conn))
        if len(user_docs):
            raise ValidationError("User already exists!")
        doc = {
            'id': id,
            'date_created': r.now(),
            'date_modified': r.now()
        }
        r.table(cls._table).insert(doc).run(conn)


class Shift(RethinkDBModel):
    _table = 'shifts'

    @classmethod
    def create(cls, **kwargs):
        start_time = kwargs.get("start_time")
        end_time = kwargs.get("end_time")
        user_id = kwargs.get("user_id")
        locations = kwargs.get("locations")

        docs = list(r.table('users').filter({'id': user_id}).run(conn))
        if not len(docs):
            raise ValidationError("Could not find the specified user")
        # TODO: ensure start time is earlier than end time

        doc = {
            'id': uuid4().hex,
            'date_created': r.now(),
            'date_modified': r.now(),
            'start_time': start_time,
            'end_time': end_time,
            'locations': locations,
            'user_id': user_id
        }
        r.table(cls._table).insert(doc).run(conn)

class Location(RethinkDBModel):
    _table = 'locations'

    @classmethod
    def create(cls, **kwargs):
        timestamp = kwargs.get("timestamp")
        lng = kwargs.get("lng")
        lat = kwargs.get("lat")
        shift_id = kwargs.get("shift_id")
        job_id = kwargs.get("job_id")
        user_id = kwargs.get("user_id")

        doc = {
            'id': uuid4().hex,
            'timestamp': timestamp,
            'point': r.point(lng, lat),
            'shift_id': shift_id,
            'job_id': job_id,
            'user_id': user_id
        }
