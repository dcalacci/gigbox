# Models
from flask_sqlalchemy import SQLAlchemy
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime, Integer, Boolean, String, ForeignKey
from sqlalchemy.orm import backref, relationship
from sqlalchemy.sql import func  # for datetimes
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely import geometry
from uuid import uuid4

from .base import Base


# using uuids like https://stackoverflow.com/questions/183042/how-can-i-use-uuids-in-sqlalchemy

class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    shifts = relationship('Shift')
    date_created = Column(DateTime, server_default=func.now())

    def __init__(self, uid):
        self.id = uid

    def __repr__(self):
        return f"{self.uid}"


class Shift(Base):
    __tablename__ = 'shifts'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    active = Column(Boolean, nullable=False)
    date_modified = Column(DateTime, onupdate=func.now())
    date_created = Column(DateTime, default=func.now())
    # if this shift is deleted, delete its related location data
    locations = relationship("Location",
                             backref=backref('shift',
                                             cascade='all, delete'))

    def __repr__(self):
        return f"Shift from {self.start_time} to {self.end_time} for user {self.user_id}"


class Location(Base):
    __tablename__ = 'locations'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    geom = Column(Geometry('POINT'), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    shift_id = Column(UUID(as_uuid=True), ForeignKey(Shift.id))

    def __init__(self, timestamp, lng, lat, shift_id):
        self.timestamp = timestamp
        self.shift_id = shift_id
        self.geom = from_shape(geometry.Point(lng, lat))
