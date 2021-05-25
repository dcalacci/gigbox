import graphene
import pendulum
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField
from geoalchemy2.shape import to_shape
from api.routing.mapmatch import match
from dateutil import parser, relativedelta
from datetime import datetime
from graphql_relay.node.node import from_global_id
from graphql import GraphQLError
import itertools

import numpy as np
from flask import g

# import numpy as np
from api.controllers.auth.decorators import login_required
from api.graphql.object import QuestionNode, AnswerNode, SurveyNode, User, Location, WeeklySummary, ShiftNode, JobNode, Trips, Route, BoundingBox, Screenshot, FilterableAuthConnectionField, FilterableConnField, JobConnection, ShiftConnection
from api.models import User as UserModel, Shift as ShiftModel, Job as JobModel, Location as LocationModel, Screenshot as ScreenshotModel, Geometry_WKT

from api.routing.mapmatch import get_shift_distance, get_shift_geometry


# A good way of hacking together role authorization would be this, from here:
# https://github.com/graphql-python/graphene-sqlalchemy/issues/137#issuecomment-582727580
# Instead, we just use the SQLAlchemyConnectionField as an interface, and add a filter for user_id
# class AuthorizedConnectionField(SQLAlchemyConnectionField):

#     def __init__(self, type, *args, **kwargs):
#         # fields = {name: field.type() for name, field in input_type._meta.fields.items()}
#         # kwargs.update(fields)
#         super().__init__(type, *args, **kwargs)

#     @classmethod
#     @login_required
#     def get_query(cls, model, info, sort=None, **args):
#         query = super().get_query(model, info, sort=sort, **args)
#         query = query.filter_by(user_id=str(g.user))
#         omitted = ('first', 'last', 'hasPreviousPage',
#                    'hasNextPage', 'startCursor', 'endCursor')
#         for name, val in args.items():
#             if name in omitted:
#                 continue
#             col = getattr(model, name, None)
#             if col:
#                 query = query.filter(col == val)
#         return query


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    getTrips = graphene.Field(Trips)
    getActiveShift = graphene.Field(ShiftNode)
    getWeeklySummary = graphene.Field(WeeklySummary)
    getUserInfo = graphene.Field(User)
    getShiftScreenshots = graphene.Field(
        graphene.List(Screenshot), shiftId=graphene.ID())
    allShifts = FilterableAuthConnectionField(ShiftNode.connection)
    allJobs = FilterableAuthConnectionField(JobNode.connection)
    allSurveys = FilterableAuthConnectionField(SurveyNode.connection)
    allAnswers = FilterableAuthConnectionField(AnswerNode.connection)
    allQuestions = FilterableAuthConnectionField(QuestionNode.connection)

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
    def resolve_getUserInfo(self, info):
        userId = str(g.user)
        return UserModel.query.filter_by(id=userId).first()

    @login_required
    def resolve_getShiftScreenshots(self, info, shiftId):
        userId = str(g.user)
        shiftId = from_global_id(shiftId)[1]
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
        today = pendulum.now()
        dt_weekago = today.start_of('week')
        # dt_weekago = datetime.now() + relativedelta.relativedelta(weeks=-1)

        shiftQuery = ShiftNode.get_query(info=info)
        shifts = (shiftQuery
                  .filter(ShiftModel.user_id == userId)
                  .filter(
                      ShiftModel.start_time > dt_weekago))
        n_shifts = shifts.count()
        distances = [shift.road_snapped_miles for shift in shifts]
        distance_miles = sum(distances)

        jobs = list(itertools.chain(*[shift.jobs for shift in shifts]))

        n_jobs = len(jobs)

        total_pay = sum(
            [job.total_pay for job in jobs if job.total_pay and job.total_pay != 0])
        total_tips = sum([job.tip for job in jobs if job.tip and job.tip != 0])

        mean_pay = np.mean(
            [job.total_pay for job in jobs if job.total_pay and job.total_pay != 0])
        mean_tip = np.mean(
            [job.tip for job in jobs if job.tip and job.tip != 0])

        print("returning weekly summary...", mean_tip or 0.)

        return WeeklySummary(
            miles=distance_miles,
            num_shifts=n_shifts,
            num_jobs=n_jobs,
            # make sure we return 0 if mean pay or tip is NaN
            mean_pay=mean_pay if not np.isnan(mean_pay) else 0.,
            mean_tips=mean_tip if not np.isnan(mean_tip) else 0.,
            total_pay=total_pay,
            total_tips=total_tips)

    @login_required
    def resolve_getTrips(self, info, objectId):
        shift_id = from_global_id(objectId)[1]
        shift = ShiftNode.get_query(info=info).get(shift_id)
        distance = get_shift_distance(shift, info)
        return Trips(miles=distance)
