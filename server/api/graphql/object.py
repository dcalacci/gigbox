import graphene
from graphene import relay, Field, UUID, String
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField
from datetime import datetime
from dateutil import relativedelta
import base64
from api.models import User as UserModel, Shift as ShiftModel, Location as LocationModel, Employer as EmployerModel, Geometry_WKT, EmployerNames


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


class Employer(SQLAlchemyObjectType):
    class Meta:
        model = EmployerModel


class Location(SQLAlchemyObjectType):
    class Meta:
        model = LocationModel
        # interfaces = (relay.Node,)

    geom = Field(Geometry_WKT)
    # We might want instead of WKT to change it to JSON. We can use a simple thing like
    # below, or change the class:
    # resolver to serialize points to json
    # def resolve_geom(root, info):
    #     shp = to_shape(root.geom)
    #     return {"lat": shp.y,
    #             "lng": shp.x}
    timestamp = ORMField(model_attr='timestamp')


class WeeklySummary(graphene.ObjectType):
    # earnings = graphene.Float()
    # expenses = graphene.Float()
    miles = graphene.Float()
    # num_jobs = graphene.Int()
    num_shifts = graphene.Int()

#     def resolve_num_shifts(self, info):
#         dt_weekago = datetime.now() + relativedelta(weeks=-1)
#         query = Shift.get_query(info=info)
#         return query.filter(Shift.start_time > dt_weekago).count()

#     def resolve_miles(self, info):
#         dt_weekago = datetime.now() + relativedelta(weeks=-1)
#         query = Location.get_query(info=info)
#         return query.filter(Location.timestamp > dt_weekago).count()


# INPUTS
class EmployerInput(graphene.InputObjectType):
    name = graphene.Enum.from_enum(EmployerNames)


class LocationInput(graphene.InputObjectType):
    lat = graphene.Float()
    lng = graphene.Float()
    timestamp = graphene.Float()
