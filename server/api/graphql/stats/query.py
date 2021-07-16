
import graphene
import pendulum
import itertools

from flask import g

import numpy as np
from api.controllers.auth.decorators import login_required
from api.models import Job as JobModel, Shift as ShiftModel
from api.graphql.object import JobNode, ShiftNode

from .object import NetPay, WorkingTime


def get_jobs(info, start_date, end_date):
    userId = str(g.user)
    jobQuery = (JobNode.get_query(info=info)
                .filter(JobModel.user_id == userId)
                .filter(JobModel.end_time <= end_date)
                )
    if start_date:
        jobQuery = jobQuery.filter(JobModel.start_time > start_date)

    return jobQuery.all()


def get_shifts(info, start_date, end_date):
    userId = str(g.user)
    shiftQuery = (ShiftNode.get_query(info=info)
                  .filter(ShiftModel.user_id == userId)
                  .filter(ShiftModel.end_time <= end_date)
                  )
    if start_date:
        shiftQuery = shiftQuery.filter(ShiftModel.start_time > start_date)

    return shiftQuery.all()


class StatsQuery(graphene.ObjectType):
    getNetPay = graphene.Field(
        NetPay, start_date=graphene.DateTime(), end_date=graphene.DateTime())
    getWorkingTime = graphene.Field(
        WorkingTime, start_date=graphene.DateTime(), end_date=graphene.DateTime())

    @login_required
    def resolve_getNetPay(self, info, start_date=None, end_date=pendulum.now()):
        """Returns net pay for a given time period, from start_date to end_date.

        TODO: Test. To test, need to add pay and tip to jobs in fixtures, then test date range calculation.

        Args:
            info ([type]): [description]
            start_date (date, optional): DateTime specifying start date. Defaults to start of current week.
            end_date (date, optional): DateTime specifying end date. Defaults to now.
        """
        from .utils import get_mileage_deduction
        jobs = get_jobs(info, start_date, end_date)
        deduction = get_mileage_deduction(jobs)
        tip = sum(filter(None, [j.tip for j in jobs]))
        pay = sum(filter(None, [j.total_pay for j in jobs]))

        return NetPay(
            mileage_deduction=deduction,
            tip=tip,
            pay=pay,
            start_date=start_date,
            end_date=end_date
        )

    @login_required
    def resolve_getWorkingTime(self, info, start_date=None, end_date=pendulum.now()):
        """Returns 'working time' for a given date range, broken into waiting time and driving time.

        Args:
            info ([type]): [description]
            start_date ([type], optional): start date of range. Defaults to None.
            end_date ([type], optional): [description]. Defaults to pendulum.now().
        """
        import pandas as pd
        jobs = get_jobs(info, start_date, end_date)
        shifts = get_shifts(info, start_date, end_date)

        total_shift_time = [
            (s.end_time - s.start_time).seconds / 360 for s in shifts]
        total_job_time = [
            (j.end_time - j.start_time).seconds / 360 for j in jobs]

        shift_dicts = [{'start_time': s.start_time, 'end_time': s.end_time,
                        'mileage': s.road_snapped_miles} for s in shifts]
        df = pd.DataFrame(shift_dicts)
        df['hrs'] = [d.seconds / 360 for d in (df.end_time - df.start_time)]
        df['date'] = df['start_time'].dt.date
        agged = df.groupby('date').agg(
            {'mileage': sum, 'hrs': lambda h: min(sum(h), 24)}).reset_index()
        hours_by_day = agged[['date', 'hrs']].to_dict(orient='records')

        return WorkingTime(
            clocked_in_time=sum(total_shift_time),
            job_time=sum(total_job_time),
            shift_hours_daily=hours_by_day
        )
