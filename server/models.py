# Models
from flask_sqlalchemy import SQLAlchemy
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry 
from geoalchemy2.shape import to_shape
from uuid import uuid4

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.String(80), unique=True, index=True, nullable=False)
    shifts = db.relationship('Shift', uselist=True, backref='user')

    def __init__(self, uid):
      self.uid= uid

    def __repr__(self):
        return '' % self.id

class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    geom = db.Column(Geometry('POINT'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    shift_id = db.Column(db.Integer, db.ForeignKey('shifts.shift_id'))

class Shift(db.Model):
    __tablename__ = 'shifts'

    shift_id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    locations = db.relationship('Location', uselist=True, backref='shift')
