
import graphene
from geoalchemy2.shape import to_shape
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from models import User, Location, Shift

class UserObject(SQLAlchemyObjectType):
    class Meta:
        model = User
        interfaces = (graphene.relay.Node, )

class LocationObject(SQLAlchemyObjectType):
    class Meta:
        model = Location
        interfaces = (graphene.relay.Node, )

    # resolver to serialize points to json
    def resolve_geom(root, info):
        shp = to_shape(root.geom)
        return {"lat": shp.y,
                "lng": shp.x}

class ShiftObject(SQLAlchemyObjectType):
    class Meta:
        model = Shift
        interfaces = (graphene.relay.Node, )

class Query(graphene.ObjectType):
    node = graphene.relay.Node.Field()
    all_shifts = SQLAlchemyConnectionField(ShiftObject)

schema = graphene.Schema(query=Query)

