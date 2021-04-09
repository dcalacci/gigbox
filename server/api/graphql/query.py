import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField
from geoalchemy2.shape import to_shape
from api.routing.mapmatch import match
from dateutil import parser, relativedelta
from datetime import datetime
from graphql import GraphQLError
from flask import g

# import numpy as np
from api.controllers.auth.decorators import login_required
from api.graphql.object import User, Shift, Location, WeeklySummary
from api.models import User as UserModel, Shift as ShiftModel, Location as LocationModel


def get_shift_distance(shift, info):
    locs = Location.get_query(info=info).filter(
        LocationModel.shift_id == shift.id).order_by(LocationModel.timestamp.asc())
    # current_app.logger.info("Found locs...")
    coords = [{'lat': to_shape(s.geom).y,
               'lng': to_shape(s.geom).x,
               'timestamp': s.timestamp} for s in locs]

    res = match(coords).json()
    # print("matchings:", res.json()['matchings'])
    # print("tracepoints:", res.json()['tracepoints'])
    # res_json = json.loads(res)
    if 'matchings' in res:
        total_distance = res['matchings'][0]['distance']
        return total_distance
    return 0


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
        return ShiftModel.query.filter_by(active=True, user_id=userId).first()

    getWeeklySummary = graphene.Field(WeeklySummary)

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
