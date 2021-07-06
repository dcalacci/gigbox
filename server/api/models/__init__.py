from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from geoalchemy2 import func, Geometry
import graphene_sqlalchemy as gsqa
import graphene
import enum

from config import get_environment_config

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


class EmployerNames(enum.Enum):
    DOORDASH = "DOORDASH"
    INSTACART = "INSTACART"
    SHIPT = "SHIPT"
    GRUBHUB = "GRUBHUB"
    UBEREATS = "UBEREATS"

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(engine)
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



from .shift import Shift
from .user import User
from .job import Job
from .consent import Consent
from .screenshot import Screenshot
from .location import Location
from .survey import RangeOptions, Question, Survey, Answer, QuestionTypeEnum

