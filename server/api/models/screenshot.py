from . import db, EmployerNames
from uuid import uuid4
from sqlalchemy import DateTime, ForeignKey 
from sqlalchemy.sql import func  # for datetimes
from sqlalchemy.dialects.postgresql import UUID
from .user import User
from .shift import Shift
from .job import Job

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
