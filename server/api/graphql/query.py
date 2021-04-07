import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField
from dateutil import parser
from graphql import GraphQLError
from flask import g

from api.controllers.auth.decorators import login_required
from api.graphql.object import User, Shift, Location
from api.models import User as UserModel, Shift as ShiftModel


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    allShifts = SQLAlchemyConnectionField(Shift)

    shifts = graphene.List(Shift,
                           cursor=graphene.Int(),
                           n=graphene.Int(),
                           after=graphene.DateTime(),
                           before=graphene.DateTime())

    # doing pagination as in https://www.howtographql.com/graphql-python/8-pagination/
    @login_required
    def resolve_shifts(self, info,  cursor=None, n=None, after=None, before=None):
        qs = ShiftModel.query

        if after:
            qs = qs.filter(ShiftModel.start_time > after)

        if before:
            qs = qs.filter(ShiftModel.start_time < before)

        if cursor:
            qs = qs[cursor:]

        if n:
            qs = qs[:n]
        return qs
        # return {"shifts": qs,
        #         "nextCursor": cursor + n}

    # userList = SQLAlchemyConnectionField(User)

    getActiveShift = graphene.Field(Shift)

    @login_required
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
