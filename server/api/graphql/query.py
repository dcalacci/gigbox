import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField
from geoalchemy2.shape import to_shape
from api.routing.mapmatch import match
from dateutil import parser, relativedelta
from datetime import datetime
from graphql_relay.node.node import from_global_id
from graphql import GraphQLError
from flask import g

# import numpy as np
from api.controllers.auth.decorators import login_required
from api.graphql.object import User, Shift, Location, WeeklySummary, Trips
from api.models import User as UserModel, Shift as ShiftModel, Location as LocationModel
from api.routing.mapmatch import get_shift_distance


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    getTrips = graphene.Field(Trips)
    getActiveShift = graphene.Field(Shift)
    getWeeklySummary = graphene.Field(WeeklySummary)
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

    @login_required
    def resolve_getActiveShift(self, info):
        userId = str(g.user)
        return ShiftModel.query.filter_by(active=True, user_id=userId).first()

    @login_required
    def resolve_getWeeklySummary(self, info):
        userId = str(g.user)
        dt_weekago = datetime.now() + relativedelta.relativedelta(weeks=-1)

        shiftQuery = Shift.get_query(info=info)
        shifts = (shiftQuery
                  .filter(ShiftModel.user_id == userId)
                  .filter(
                      ShiftModel.start_time > dt_weekago))
        n_shifts = shifts.count()

        distances = [get_shift_distance(shift, info) for shift in shifts]
        distance_miles = sum(distances) * 0.0006213712

        locQuery = Location.get_query(info=info)
        shift_ids = [shift.id for shift in shifts]
        n_locs = (locQuery
                  .filter(LocationModel.shift_id.in_(shift_ids))).count()

        return WeeklySummary(miles=distance_miles, num_shifts=n_shifts)

    @login_required
    def resolve_getTrips(self, info, shiftId):
        shift_id = from_global_id(shift_id)[1]
        shift = Shift.get_query(info=info).get(shift_id)
        distance = get_shift_distance(shift, info)
        return Trips(miles=distance)
