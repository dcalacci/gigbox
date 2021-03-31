import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from api.database.model import User as UserModel, Shift as ShiftModel, Location as LocationModel


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


class LocationInput(graphene.InputObjectType):
    lat = graphene.Float()
    lng = graphene.Float()
    timestamp = graphene.DateTime()
