import graphene
from graphene import relay, Field, UUID, String
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField
import base64
from api.models import User as UserModel, Shift as ShiftModel, Location as LocationModel, Geometry_WKT


class User(SQLAlchemyObjectType):
    class Meta:
        model = UserModel
        interfaces = (relay.Node,)


class Shift(SQLAlchemyObjectType):
    class Meta:
        model = ShiftModel
        interfaces = (relay.Node,)

    # resolve locations for this shift
    locations = graphene.List(lambda: Location)

    def resolve_locations(self, info):
        query = Location.get_query(info=info)
        query = query.filter(LocationModel.shift_id == self.id)
        return query.all()


class Location(SQLAlchemyObjectType):
    class Meta:
        model = LocationModel
        interfaces = (relay.Node,)

    geom = Field(Geometry_WKT)
    # We might want instead of WKT to change it to JSON. We can use a simple thing like
    # below, or change the class:
    # resolver to serialize points to json
    # def resolve_geom(root, info):
    #     shp = to_shape(root.geom)
    #     return {"lat": shp.y,
    #             "lng": shp.x}
    timestamp = ORMField(model_attr='timestamp')


class LocationInput(graphene.InputObjectType):
    lat = graphene.Float()
    lng = graphene.Float()
    timestamp = graphene.String()
