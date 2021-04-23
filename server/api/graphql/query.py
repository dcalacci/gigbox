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
from api.graphql.object import User, Shift, Location, WeeklySummary, Trips, Route, BoundingBox, Screenshot
from api.models import User as UserModel, Shift as ShiftModel, Location as LocationModel, Screenshot as ScreenshotModel, Geometry_WKT
from api.routing.mapmatch import get_shift_distance, get_shift_geometry


# A good way of hacking together role authorization would be this, from here:
# https://github.com/graphql-python/graphene-sqlalchemy/issues/137#issuecomment-582727580
# Instead, we just use the SQLAlchemyConnectionField as an interface, and add a filter for user_id
class AuthorizedConnectionField(SQLAlchemyConnectionField):

    def __init__(self, type, *args, **kwargs):
        # fields = {name: field.type() for name, field in input_type._meta.fields.items()}
        # kwargs.update(fields)
        super().__init__(type, *args, **kwargs)

    @classmethod
    @login_required
    def get_query(cls, model, info, sort=None, **args):
        query = super().get_query(model, info, sort=sort, **args)
        query = query.filter_by(user_id=str(g.user))
        omitted = ('first', 'last', 'hasPreviousPage',
                   'hasNextPage', 'startCursor', 'endCursor')
        for name, val in args.items():
            if name in omitted:
                continue
            col = getattr(model, name, None)
            if col:
                query = query.filter(col == val)
        return query


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    getTrips = graphene.Field(Trips)
    getActiveShift = graphene.Field(Shift)
    getWeeklySummary = graphene.Field(WeeklySummary)
    getShiftScreenshots = graphene.Field(graphene.List(Screenshot), shiftId=graphene.ID())
    allShifts = AuthorizedConnectionField(Shift, sort=Shift.sort_argument())

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

    @login_required
    def resolve_getShiftScreenshots(self, info, shiftId):
        userId = str(g.user)
        shiftId= from_global_id(shiftId)[1]
        return ScreenshotModel.query.filter_by(
            user_id=userId,
            shift_id=shiftId)

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
        distances = [shift.road_snapped_miles for shift in shifts]

        # distances = [get_shift_distance(shift, info) for shift in shifts]
        distance_miles = sum(distances)
        return WeeklySummary(miles=distance_miles, num_shifts=n_shifts)

    @login_required
    def resolve_getTrips(self, info, objectId):
        shift_id = from_global_id(objectId)[1]
        shift = Shift.get_query(info=info).get(shift_id)
        distance = get_shift_distance(shift, info)
        return Trips(miles=distance)
