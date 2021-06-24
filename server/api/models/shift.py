from . import db, EmployerNames
from uuid import uuid4
from sqlalchemy import DateTime, Boolean, ForeignKey, Index
from sqlalchemy.sql import func  # for datetimes
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import backref
from .user import User

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
    employers = db.Column(ARRAY(db.Enum(EmployerNames,
                                     create_constraint=False, native_enum=False)))

    locations = db.relationship(
        "Location", backref=backref("shift", cascade="all, delete", passive_deletes=True)
    )
    jobs = db.relationship(
        'Job', backref=backref("shift", cascade="all, delete", passive_deletes=True))

    __table_args__ = (Index("index", "id", "start_time"),)

    def __repr__(self):
        return (
            f"Shift from {self.start_time} to {self.end_time} for user {self.user_id}"
        )
