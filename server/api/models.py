# Models
import graphene_sqlalchemy as gsqa
from geoalchemy2.types import Geometry
from geoalchemy2 import func
import graphene
from flask_sqlalchemy import SQLAlchemy
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from sqlalchemy import Column, DateTime, Integer, Boolean, String, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import backref, relationship
from sqlalchemy.sql import func  # for datetimes
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.event import listens_for
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely import geometry
from uuid import uuid4
import enum
import os

db = SQLAlchemy()

# using uuids like https://stackoverflow.com/questions/183042/how-can-i-use-uuids-in-sqlalchemy
# using db.Model to enable flask-sqlalchemy magic:
# https://stackoverflow.com/questions/22698478/what-is-the-difference-between-the-declarative-base-and-db-model

# enable postgis with
# https://morphocode.com/how-to-install-postgis-on-mac-os-x/


# For converting geometry to WKT, see:
# https://github.com/graphql-python/graphene-sqlalchemy/issues/140
# and for types generally, see:
# https://github.com/graphql-python/graphene-sqlalchemy/issues/53
# I found that I had to add it here for our database migrations to work properly.
db_uri = "postgresql://" + os.environ["DB_USERNAME"] + ":" \
    + os.environ["DB_PASSWORD"] + "@" \
    + os.environ["DB_HOST"] + ":" \
    + os.environ["DB_PORT"] + "/" \
    + os.environ["DB_DATABASE"]
engine = create_engine(db_uri)

# have to import scalar from engine, not db....


class Geometry_WKT(graphene.Scalar):
    '''Geometry WKT custom type.'''
    name = "Geometry WKT"

    @staticmethod
    def serialize(geom):
        return engine.scalar(geom.ST_AsText())

    @staticmethod
    def parse_literal(node):
        if isinstance(node, gsqa.language.ast.StringValue):
            return engine.scalar(func.ST_GeomFromText(node.value))

    @staticmethod
    def parse_value(value):
        return engine.scalar(func.ST_GeomFromText(value))


@gsqa.converter.convert_sqlalchemy_type.register(Geometry)
def _convert_geometry(thetype, column, registry=None):
    return Geometry_WKT(description=gsqa.converter.get_column_doc(column),
                        required=not(gsqa.converter.is_column_nullable(column)))


class User(db.Model):

    __tablename__ = 'users'
    # id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    id = db.Column(db.String, primary_key=True, unique=True, index=True)
    uid = db.Column(db.String, unique=True, index=True)
    shifts = db.relationship('Shift')
    date_created = db.Column(DateTime, server_default=func.now())

    def __init__(self, id):
        self.id = id
        self.uid = id

    def __repr__(self):
        return f"{self.id}"


class Shift(db.Model):
    __tablename__ = 'shifts'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    start_time = db.Column(DateTime, default=func.now())
    end_time = db.Column(DateTime, nullable=True)
    user_id = db.Column(db.String, ForeignKey(User.id))
    active = db.Column(Boolean, nullable=False)
    date_modified = db.Column(DateTime, onupdate=func.now())
    date_created = db.Column(DateTime, default=func.now())
    # if this shift is deleted, delete its related location data
    locations = db.relationship("Location",
                                backref=backref('shift',
                                                cascade='all, delete'))
    employers = db.relationship("Employer",
                                backref=backref('shift', cascade="all, delete"))

    __table_args__ = (Index('index', "id", "start_time"), )

    # I looked for a way to enforce the idea that only one shift per user ID could
    # be active at a time, but didn't figure out a way to enforce it in sqlalchemy...
    # CREATE UNIQUE INDEX "user_email" ON emails(user_id) WHERE is_active=true
    # index_shiftconstraint = db.Index("user_id", unique=True)

    def __repr__(self):
        return f"Shift from {self.start_time} to {self.end_time} for user {self.user_id}"


class EmployerNames(enum.Enum):
    DOORDASH = "DoorDash"
    INSTACART = "Instacart"
    SHIPT = "Shipt"
    GRUBHUB = "GrubHub"
    UBEREATS = "UberEats"


class Employer(db.Model):
    __tablename__ = "employers"
    id = db.Column(db.Integer, primary_key=True)
    shift_id = db.Column(UUID(as_uuid=True), ForeignKey(Shift.id))
    name = db.Column(db.Enum(EmployerNames))

    def __init__(self, name, shift_id):
        self.name = name
        self.shift_id = shift_id


# This isn't needed yet -- for a future feature
# @listens_for(Employer.__table__, 'after_create')
# def insert_initial_values(*args, **kwargs):
#     print("Adding employer data...")
#     db.session.add(Employer(name=EmployerNames.DOORDASH))
#     db.session.add(Employer(name=EmployerNames.INSTACART))
#     db.session.add(Employer(name=EmployerNames.SHIPT))
#     db.session.add(Employer(name=EmployerNames.UBEREATS))
#     db.session.add(Employer(name=EmployerNames.GRUBHUB))
#     db.session.commit()


class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    geom = db.Column(Geometry('POINT'))
    accuracy = db.Column(db.Float)
    timestamp = db.Column(DateTime, nullable=False)
    shift_id = db.Column(UUID(as_uuid=True), ForeignKey(Shift.id))

    def __init__(self, timestamp, lng, lat, shift_id):
        self.timestamp = timestamp
        self.shift_id = shift_id
        self.geom = from_shape(geometry.Point(lng, lat))
