import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField
from dateutil import parser, relativedelta
from datetime import datetime
from graphql import GraphQLError
from flask import g

from api.controllers.auth.decorators import login_required
from api.graphql.object import User, Shift, Location, WeeklySummary
from api.models import User as UserModel, Shift as ShiftModel, Location as LocationModel


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    allShifts = SQLAlchemyConnectionField(Shift, sort=Shift.sort_argument())
    print("Allshift field args:", allShifts.args)

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

    getWeeklySummary = graphene.Field(WeeklySummary)

    @login_required
    def resolve_getWeeklySummary(self, info):
        userId = str(g.user)
        print("Getting weekly summary for user:", userId)
        dt_weekago = datetime.now() + relativedelta.relativedelta(weeks=-1)

        shiftQuery = Shift.get_query(info=info)
        n_shifts = (shiftQuery
                    .filter(ShiftModel.user_id == userId)
                    .filter(
                        ShiftModel.start_time > dt_weekago).count())

        locQuery = Location.get_query(info=info)
        n_locs = (locQuery
                  # TODO: add user_id to location points. needed for things like mileage.
                  # .filter()
                  .filter(LocationModel.timestamp > dt_weekago).count())

        return WeeklySummary(miles=n_locs, num_shifts=n_shifts)
