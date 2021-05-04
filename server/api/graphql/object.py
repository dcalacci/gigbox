import graphene
from graphene import relay, Field, UUID, String
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField
from graphene_file_upload.scalars import Upload
from geoalchemy2.shape import to_shape
from datetime import datetime
from dateutil import relativedelta
import base64
from api.models import (
    User as UserModel,
    Shift as ShiftModel,
    Location as LocationModel,
    Screenshot as ScreenshotModel,
    Job as JobModel,
    Geometry_WKT,
    EmployerNames,
)

# This wrapper needed (for now) to enable us to use the same enum class
# in several different DB objects with sqlalchemy and graphene together.
# see: https://github.com/graphql-python/graphene-sqlalchemy/issues/211#issuecomment-501508507
from functools import lru_cache
graphene.Enum.from_enum = lru_cache(maxsize=None)(graphene.Enum.from_enum)


def resolve_geom(geom):
    shp = to_shape(geom)
    return {"lat": shp.y,
            "lng": shp.x}


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

    def resolve_locations(self, info):
        query = Location.get_query(info=info)
        query = query.filter(LocationModel.shift_id == self.id)
        return query.all()


class Job(SQLAlchemyObjectType):
    class Meta:
        model = JobModel

    start_location = Field(Geometry_WKT)
    end_location = Field(Geometry_WKT)

    # we don't need this because of our Geometry_WKT serializer.
    # although if we wanted parse-able 
    # def resolve_start_location(self, info):
    #     return resolve_geom(self.start_location)

    # def resolve_end_location(self, info):
    #     return resolve_geom(self.start_location)


class Screenshot(SQLAlchemyObjectType):
    class Meta:
        model = ScreenshotModel


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
