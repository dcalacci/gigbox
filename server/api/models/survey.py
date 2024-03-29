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
from sqlalchemy import create_engine, Table
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.event import listens_for
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely import geometry
from uuid import uuid4
from config import get_environment_config
import enum
import os
from . import User
from . import db

config = get_environment_config()
Base = declarative_base()

class QuestionTypeEnum(enum.Enum):
    TEXT = "TEXT"
    NUMBER = "NUMBER"
    CHECKBOX = "CHECKBOX"
    MULTISELECT = "MULTISELECT"
    RANGE = "RANGE"
    SELECT = "SELECT"


class RangeOptions(db.Model):
    __tablename__ = "survey_range_options"
    id = Column(Integer, primary_key=True)
    start_val = db.Column(db.Float)
    end_val = db.Column(db.Float)
    increment = db.Column(db.Float)
    unit = db.Column(db.String)


class Survey(db.Model):
    __tablename__ = "survey_survey"
    id = db.Column(Integer, primary_key=True)
    # don't deliver this survey until at least this date
    start_date = db.Column(DateTime, nullable=False)
    # if it's after this date, don't make this survey available
    end_date = db.Column(DateTime, nullable=True)
    # minimum number of days to wait until survey is delivered to a user
    days_after_install = db.Column(Integer, nullable=True)
    # title of survey
    title = db.Column(String, nullable=False)
    description = db.Column(String, nullable=True)
    # list of questions in this survey
    questions = relationship("Question", back_populates="survey")



class Question(db.Model):
    __tablename__ = "survey_questions"
    id = Column(Integer, primary_key=True)
    # question text to be displayed
    question_text = db.Column(String, nullable=False)
    question_type = db.Column(db.Enum(QuestionTypeEnum,
                                      create_constraint=False, native_enum=False, create_type=False))
    select_options = db.Column(ARRAY(String), nullable=True)
    range_options_id = db.Column(Integer, ForeignKey('survey_range_options.id'), nullable=True)
    range_options = db.relationship(RangeOptions)
    survey_id = db.Column(Integer, ForeignKey(Survey.id))
    survey = db.relationship("Survey", back_populates="questions")
    # List of answers. We enforce authorization -- users can only access answer's theyve authored --
    # in our graphql API
    answers = db.relationship("Answer", back_populates="question")

    def __init__(self, select_opts=None):
        self.select_options = select_opts
    # backref to 'surveys' here


# A user has many answers, which then direct to a question
class Answer(db.Model):
    __tablename__ = "survey_answer"
    id = Column(Integer, primary_key=True)
    user_id = db.Column(String, ForeignKey(User.id))
    user = db.relationship('User', back_populates='survey_answers')
    question_id = db.Column(Integer, ForeignKey(Question.id))
    question = db.relationship(Question, back_populates='answers')
    date = db.Column(DateTime)
    answer_text = db.Column(db.String, nullable=True)
    answer_numeric = db.Column(db.Float, nullable=True)
    answer_options = db.Column(db.ARRAY(db.String), nullable=True)
    answer_yn = db.Column(Boolean, nullable=True)
