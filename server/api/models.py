# Models
import os
from rethinkdb import RethinkDB
from uuid import uuid4
from flask import current_app, g
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
        status = r.table(cls._table).get(id).update(fields, return_changes=True).run(conn)
        if status['errors']:
            raise DatabaseProcessError("Could not complete the update action")
        return status

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
        startTime = kwargs.get("startTime")
        endTime = kwargs.get("endTime")
        userId = kwargs.get("userId")
        locations = kwargs.get("locations")
        active = kwargs.get("active")
        employers = kwargs.get("employers")

        docs = list(r.table('users').filter({'id': userId}).run(conn))
        if not len(docs):
            raise ValidationError("Could not find the specified user: {}".format(userId))
        # TODO: ensure start time is earlier than end time

        doc = {
            'id': uuid4().hex,
            'dateCreated': r.now().to_iso8601().run(conn),
            'dateModified': r.now().to_iso8601().run(conn),
            'startTime': startTime,
            'endTime': endTime,
            'locations': locations,
            'active': active,
            'userId': userId,
            'employers': employers
        }
        r.table(cls._table).insert(doc).run(conn)
        return doc

class Location(RethinkDBModel):
    _table = 'locations'

    @classmethod
    def create(cls, **kwargs):
        timestamp = kwargs.get("timestamp")
        lng = kwargs.get("lng")
        lat = kwargs.get("lat")
        shiftId = kwargs.get("shift_id")
        job_id = kwargs.get("job_id")
        user_id = kwargs.get("user_id")

        doc = {
            'id': uuid4().hex,
            'timestamp': timestamp,
            'point': r.point(lng, lat),
            'shiftId': shift_id,
            'jobId': job_id,
            'userId': user_id
        }
