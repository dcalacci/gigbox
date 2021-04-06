import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField
from flask import g

from api.graphql.object import User, Shift, Location
from api.models import User as UserModel, Shift as ShiftModel


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    # shifts = graphene.relay.Node.Field(Shift)
    # shiftList = SQLAlchemyConnectionField(Shift)

    # locations = graphene.relay.Node.Field(Location)
    # locationList = SQLAlchemyConnectionField(Location)

    # users = graphene.relay.Node.Field(User)
    # userList = SQLAlchemyConnectionField(User)

    getActiveShift = graphene.Field(Shift)

    def resolve_getActiveShift(self, info):
        userId = str(g.user)
        print("Getting shift for user:", userId)
        return ShiftModel.query.filter_by(active=True, user_id=userId).first()

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
