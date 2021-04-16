import graphene
from graphene import relay, Field, UUID, String
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField
from graphene_file_upload.scalars import Upload
from datetime import datetime
from dateutil import relativedelta
import base64
from api.models import (
    User as UserModel,
    Shift as ShiftModel,
    Location as LocationModel,
    Employer as EmployerModel,
    Screenshot as ScreenshotModel,
    Geometry_WKT,
    EmployerNames,
)

# This wrapper needed (for now) to enable us to use the same enum class
# in several different DB objects with sqlalchemy and graphene together.
# see: https://github.com/graphql-python/graphene-sqlalchemy/issues/211#issuecomment-501508507
from functools import lru_cache
graphene.Enum.from_enum = lru_cache(maxsize=None)(graphene.Enum.from_enum)


class User(SQLAlchemyObjectType):
    class Meta:
        model = UserModel
        # interfaces = (relay.Node,)


class Shift(SQLAlchemyObjectType):
    class Meta:
        model = ShiftModel
        # interfaces = (graphene.Node, relay.Node)
        interfaces = [graphene.Node]
        # interfaces = (relay.Node,)

    # resolve locations for this shift
    locations = graphene.List(lambda: Location)
    employers = graphene.List(lambda: Employer)

    def resolve_locations(self, info):
        query = Location.get_query(info=info)
        query = query.filter(LocationModel.shift_id == self.id)
        return query.all()

    def resolve_employers(self, info):
        query = Employer.get_query(info=info)
        query = query.filter(EmployerModel.shift_id == self.id)
        return query.all()


class Screenshot(SQLAlchemyObjectType):
    class Meta:
        model = ScreenshotModel


class Employer(SQLAlchemyObjectType):
    class Meta:
        model = EmployerModel


class Location(SQLAlchemyObjectType):
    class Meta:
        model = LocationModel

    geom = Field(Geometry_WKT)
    # We might want instead of WKT to change it to JSON. We can use a simple thing like
    # below, or change the class:
    # resolver to serialize points to json
    # def resolve_geom(root, info):
    #     shp = to_shape(root.geom)
    #     return {"lat": shp.y,
    #             "lng": shp.x}
    timestamp = ORMField(model_attr="timestamp")
    accuracy = ORMField(model_attr="accuracy")


class Screenshot(SQLAlchemyObjectType):
    class Meta:
        model = ScreenshotModel


class WeeklySummary(graphene.ObjectType):
    # earnings = graphene.Float()
    # expenses = graphene.Float()
    miles = graphene.Float()
    # num_jobs = graphene.Int()
    num_shifts = graphene.Int()


class BoundingBox(graphene.ObjectType):
    min_lat = graphene.Float()
    min_lng = graphene.Float()
    max_lat = graphene.Float()
    max_lng = graphene.Float()


class Route(graphene.ObjectType):
    geometry = graphene.String()
    bounding_box = graphene.Field(BoundingBox)


class Trips(graphene.ObjectType):
    miles = graphene.Float()


# INPUTS
class EmployerInput(graphene.InputObjectType):
    name = graphene.Enum.from_enum(EmployerNames)


class LocationInput(graphene.InputObjectType):
    lat = graphene.Float()
    lng = graphene.Float()
    timestamp = graphene.Float()
    accuracy = graphene.Float()
