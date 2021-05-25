from . import db, EmployerNames
from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func  # for datetimes



class User(db.Model):

    __tablename__ = "users"
    # id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    id = db.Column(db.String, primary_key=True, unique=True, index=True)
    uid = db.Column(db.String, unique=True, index=True)
    shifts = db.relationship("Shift")
    date_created = db.Column(DateTime, server_default=func.now())
    consent = db.relationship('Consent', uselist=False, back_populates='user')
    survey_answers = db.relationship("Answer", back_populates="user")
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
