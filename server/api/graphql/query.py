import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField

from api.graphql.object import User, Shift, Location
from api.models import User as UserModel


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    shifts = graphene.relay.Node.Field(Shift)
    shiftList = SQLAlchemyConnectionField(Shift)

    locations = graphene.relay.Node.Field(Location)
    locationList = SQLAlchemyConnectionField(Location)

    users = graphene.relay.Node.Field(User)
    userList = SQLAlchemyConnectionField(User)

    # getShifts = graphene.List(lambda: Shift,
    #                           uid=graphene.String,
    #                           include_locations=graphene.Boolean,
    #                           after_time=graphene.DateTime)

    # def resolve_getShifts(
    #         self, info, uid, include_locations, after_time
    # ):
    #     # TODO: add UID to context in flask graphql API route
    #     uid = info.context['uid']
    #     query = Shift.get_query(info=info)
