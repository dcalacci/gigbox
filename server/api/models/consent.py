from . import db
from uuid import uuid4
from sqlalchemy import DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func  # for datetimes

from .user import User

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
