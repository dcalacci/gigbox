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
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.event import listens_for
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely import geometry
from uuid import uuid4
from config import get_environment_config
import enum
import os


config = get_environment_config()

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
engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
# have to import scalar from engine, not db....


class Geometry_WKT(graphene.Scalar):
    """Geometry WKT custom type."""

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
    return Geometry_WKT(
        description=gsqa.converter.get_column_doc(column),
        required=not (gsqa.converter.is_column_nullable(column)),
    )


class EmployerNames(enum.Enum):
    DOORDASH = "DOORDASH"
    INSTACART = "INSTACART"
    SHIPT = "SHIPT"
    GRUBHUB = "GRUBHUB"
    UBEREATS = "UBEREATS"


class User(db.Model):

    __tablename__ = "users"
    # id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    id = db.Column(db.String, primary_key=True, unique=True, index=True)
    uid = db.Column(db.String, unique=True, index=True)
    shifts = db.relationship("Shift")
    date_created = db.Column(DateTime, server_default=func.now())
    consent = db.relationship('Consent', uselist=False, back_populates='user')
    phone=db.Column(String, nullable=True)
    email=db.Column(String, nullable=True)
    name=db.Column(String, nullable=True)
    employers = Column(ARRAY(db.Enum(EmployerNames,
                                     create_constraint=False, native_enum=False)))




    def __init__(self, id):
        self.id = id
        self.uid = id

    def __repr__(self):
        return f"{self.id}"

class Consent(db.Model):
    __tableName__ = 'consent'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = db.Column(db.String, ForeignKey(User.id, ondelete='CASCADE'))
    user = db.relationship('User', back_populates='consent')
    date_modified=db.Column(DateTime, onupdate=func.now())
    date_created=db.Column(DateTime, default=func.now())
    data_sharing=db.Column(Boolean, nullable=True)
    interview=db.Column(Boolean, nullable=True)
    consented=db.Column(Boolean, default=False)
    signature_filename = db.Column(db.String)
    signature_encoded = db.Column(db.String)



class Shift(db.Model):
    __tablename__ = "shifts"
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    start_time = db.Column(DateTime, default=func.now())
    end_time = db.Column(DateTime, nullable=True)
    # ondelete='CASCADE' ensures that if we delete a user through both session.delete() and filter().delete()
    # their shifts are deleted
    user_id = db.Column(db.String, ForeignKey(User.id, ondelete='CASCADE'))
    active = db.Column(Boolean, nullable=False)
    date_modified = db.Column(DateTime, onupdate=func.now())
    date_created = db.Column(DateTime, default=func.now())
    # if this shift is deleted, delete its related location data
    screenshots = db.relationship("Screenshot",
                                  backref=backref("shift", cascade='all, delete', passive_deletes=True))
    road_snapped_miles = db.Column(db.Float, default=0)
    # passive_deletes also means that when we delete a shift, the location and employer records
    # are deleted correctly, regardless of whether we use session.delete() or filter().delete()

    # we store as JSONB because that's what we get back from the map match API, and because it's
    # easier to pass around.
    snapped_geometry = db.Column(JSONB)
    employers = Column(ARRAY(db.Enum(EmployerNames,
                                     create_constraint=False, native_enum=False)))

    locations = db.relationship(
        "Location", backref=backref("shift", cascade="all, delete", passive_deletes=True)
    )
    jobs = db.relationship(
        'Job', backref=backref("shift", cascade="all, delete", passive_deletes=True))

    __table_args__ = (Index("index", "id", "start_time"),)

    # I looked for a way to enforce the idea that only one shift per user ID could
    # be active at a time, but didn't figure out a way to enforce it in sqlalchemy...
    # an example:
    # CREATE UNIQUE INDEX "user_email" ON emails(user_id) WHERE is_active=true
    # index_shiftconstraint = db.Index("user_id", unique=True)

    def __repr__(self):
        return (
            f"Shift from {self.start_time} to {self.end_time} for user {self.user_id}"
        )


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    date_created = db.Column(DateTime, default=func.now())
    date_modified = db.Column(DateTime, onupdate=func.now())
    user_id = db.Column(db.String, ForeignKey(User.id, ondelete='CASCADE'))
    shift_id = db.Column(UUID(as_uuid=True), ForeignKey(
        Shift.id, ondelete='CASCADE'))

    # screenshots -- maybe should make this more flexible (more screenshots)
    # start_screenshot = db.Column(
    #     UUID(as_uuid=True), ForeignKey(Screenshot.id), nullable=True)
    # end_screenshot = db.Column(
    #     UUID(as_uuid=True), ForeignKey(Screenshot.id), nullable=True)

    screenshots = db.relationship(
        'Screenshot', backref=backref('job', uselist=True))

    # locations
    start_location = db.Column(Geometry("POINT"))
    end_location = db.Column(Geometry("POINT"))

    # start and end times
    start_time = db.Column(DateTime, default=func.now())
    end_time = db.Column(DateTime)

    mileage = db.Column(db.Float, nullable=True)
    snapped_geometry = db.Column(JSONB)

    # info from trip screenshots / manual entry
    estimated_mileage = db.Column(db.Float, nullable=True)
    total_pay = db.Column(db.Float, nullable=True)
    tip = db.Column(db.Float, nullable=True)
    employer = db.Column(db.Enum(EmployerNames), nullable=True)

    def __init__(self, lng, lat, shift_id, user_id, employer):
        self.start_location = from_shape(geometry.Point(lng, lat))
        self.shift_id = shift_id
        self.user_id = user_id
        self.employer = employer

class Screenshot(db.Model):
    __tablename__ = "screenshots"
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    date_created = db.Column(DateTime, default=func.now())
    shift_id = db.Column(UUID(as_uuid=True), ForeignKey(
        Shift.id, ondelete='CASCADE'))
    job_id = db.Column(UUID(as_uuid=True), ForeignKey(
        Job.id, ondelete="CASCADE"))
    timestamp = db.Column(db.String)
    on_device_uri = db.Column(db.String)
    img_filename = db.Column(db.String)
    user_id = db.Column(db.String, ForeignKey(User.id, ondelete='CASCADE'), )
    employer = db.Column(db.Enum(EmployerNames))



class Location(db.Model):
    __tablename__ = "locations"
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    geom = db.Column(Geometry("POINT"))
    accuracy = db.Column(db.Float)
    timestamp = db.Column(DateTime, nullable=False)
    shift_id = db.Column(UUID(as_uuid=True), ForeignKey(
        Shift.id, ondelete='CASCADE'))

    def __init__(self, timestamp, lng, lat, shift_id):
        self.timestamp = timestamp
        self.shift_id = shift_id
        self.geom = from_shape(geometry.Point(lng, lat))
