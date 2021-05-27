from . import db, EmployerNames
from uuid import uuid4
from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.sql import func  # for datetimes
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import backref
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely import geometry

from .shift import Shift

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