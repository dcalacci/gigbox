
import graphene
import pendulum
import itertools

from flask import g

import numpy as np
from api.controllers.auth.decorators import login_required
from api.models import Job as JobModel
from api.graphql.object import JobNode

from .object import NetPay

class StatsQuery(graphene.ObjectType):
    getNetPay = graphene.Field(NetPay)

    @login_required
    def resolve_getNetPay(self, info, start_date=pendulum.now().start_of('week'), end_date=pendulum.now()):
        """Returns net pay for a given time period, from start_date to end_date.

        TODO: Test. To test, need to add pay and tip to jobs in fixtures, then test date range calculation.

        Args:
            info ([type]): [description]
            start_date (date, optional): DateTime specifying start date. Defaults to start of current week.
            end_date (date, optional): DateTime specifying end date. Defaults to now.
        """
        from .utils import get_mileage_deduction
        userId = str(g.user)
        jobs = (JobNode.get_query(info=info)
                .filter(JobModel.user_id == userId)
                .filter(JobModel.start_time > start_date)
                .filter(JobModel.end_time <= end_date)
                )
        deduction = get_mileage_deduction(jobs)
        tip = sum(filter(None, [j.tip for j in jobs]))
        pay = sum(filter(None, [j.total_pay for j in jobs]))

        return NetPay(
            mileage_deduction = deduction,
            tip = tip,
            pay = pay,
            start_date = start_date,
            end_date = end_date
        )