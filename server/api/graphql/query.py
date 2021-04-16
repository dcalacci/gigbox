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
from api.graphql.object import User, Shift, Location, WeeklySummary, Trips, Route, BoundingBox
from api.models import User as UserModel, Shift as ShiftModel, Location as LocationModel, Geometry_WKT
from api.routing.mapmatch import get_shift_distance, get_shift_geometry


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    getTrips = graphene.Field(Trips)
    getActiveShift = graphene.Field(Shift)
    getRouteLine = graphene.Field(Route, objectId=graphene.ID())
    getWeeklySummary = graphene.Field(WeeklySummary)
    allShifts = SQLAlchemyConnectionField(Shift, sort=Shift.sort_argument())

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
        distances = [shift.road_snapped_miles for shift in shifts]

        # distances = [get_shift_distance(shift, info) for shift in shifts]
        distance_miles = sum(distances)
        return WeeklySummary(miles=distance_miles, num_shifts=n_shifts)

    @login_required
    def resolve_getRouteLine(self, info, objectId):
        # TODO: do an if statement here if we ever have more than just shifts
        # with routes. we can tell what kind it is from the global ID
        shift_id = from_global_id(objectId)[1]
        shift = Shift.get_query(info=info).get(shift_id)
        res = get_shift_geometry(shift, info)
        if not res:
            return None
        else:
            (geometry, bb) = res
            print("got geometry:", geometry, bb)
            return Route(geometry=geometry,
                         bounding_box=BoundingBox(
                             min_lat=bb[1],
                             min_lng=bb[0],
                             max_lat=bb[3],
                             max_lng=bb[2],
                         ))

    @login_required
    def resolve_getTrips(self, info, objectId):
        shift_id = from_global_id(objectId)[1]
        shift = Shift.get_query(info=info).get(shift_id)
        distance = get_shift_distance(shift, info)
        return Trips(miles=distance)
