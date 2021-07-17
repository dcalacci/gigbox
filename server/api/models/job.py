from . import db, EmployerNames
from uuid import uuid4
from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.sql import func  # for datetimes
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import backref
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely import geometry

from .user import User
from .shift import Shift

class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    date_created = db.Column(DateTime, default=func.now())
    date_modified = db.Column(DateTime, onupdate=func.now())
    user_id = db.Column(db.String, ForeignKey(User.id, ondelete='CASCADE'))
    shift_id = db.Column(UUID(as_uuid=True), ForeignKey(
        Shift.id, ondelete='CASCADE'))

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

    def __init__(self, 
            shift_id, 
            user_id, 
            start_location=None, 
            end_location=None, 
            employer=None):

        if start_location is not None:
            self.start_location = from_shape(geometry.Point(start_location['lng'], 
                start_location['lat']))
        if end_location is not None:
            self.end_location = from_shape(geometry.Point(end_location['lng'], 
                end_location['lat']))
        self.shift_id = shift_id
        self.user_id = user_id
        self.employer = employer

    def __repr__(self):
        return (
            f" {self.mileage}mi long Job from {self.start_time} to {self.end_time} for user {self.user_id}"
        )
