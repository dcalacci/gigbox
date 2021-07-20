
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


def _agg_mileage_by_day(records):
    """Aggregate mileage by day

    Args:
        records ([{start_time: datetime, end_time: datetime, mileage: Float}]): Records of shifts or jobs + mileage

    Returns:
        [{day: datetime (date), hrs: Float (hours)}]: Daily record of aggregate hours, or [] if no records.
    """
    import pandas as pd
    df = pd.DataFrame(records)
    if len(df) == 0:
        return []
    df['hrs'] = [d.seconds / 3600 for d in (df.end_time - df.start_time)]
    df['date'] = df['start_time'].dt.date
    agged = df.groupby('date').agg(
        {'mileage': sum, 'hrs': lambda h: min(sum(h), 24)}).reset_index()
    shift_hours_by_day = agged[['date', 'hrs']].to_dict(orient='records')
    return shift_hours_by_day


def _get_shift_hours_daily(shifts):
    """Returns a list of records detailing the date and number of hours "clocked in" to a shift.

    Args:
        shifts (List(Shift)): List of shifts to calculate for 

    Returns:
        [{date: Datetime, hrs: Float}]: Records for each day the user clocked in detailing total # of hours clocked
    """
    shift_dicts = [{'start_time': s.start_time, 'end_time': s.end_time,
                    'mileage': s.road_snapped_miles} for s in shifts]
    return _agg_mileage_by_day(shift_dicts)


def _get_job_hours_daily(jobs):
    """Returns a list of records detailing the date and number of hours tracked for jobs

    Args:
        shifts (List(Job)): List of jobs to calculate for 

    Returns:
        [{date: Datetime, hrs: Float}]: Records for each day the user worked, detailing total # of hours spent on a job.
    """
    job_dicts = [{'start_time': j.start_time, 'end_time': j.end_time,
                  'mileage': j.mileage} for j in jobs]
    return _agg_mileage_by_day(job_dicts)


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

        Returns:
            clocked_in_time: total time clocked in to shifts
            job_time: total time on tracked jobs
            shift_hours_daily: a list of dicts, in the form {date, hrs}, detailing the date and number of hours "clocked in", respectively.
        """
        import pandas as pd
        print("Getting working time from ", start_date, end_date)
        jobs = get_jobs(info, start_date, end_date)
        shifts = get_shifts(info, start_date, end_date)
        total_shift_time = [
            (s.end_time - s.start_time).seconds / 3600 for s in shifts] if len(shifts) > 0 else [0]

        total_job_time = [
            (j.end_time - j.start_time).seconds / 3600 for j in jobs] if len(jobs) > 0 else [0]
        
        return WorkingTime(
            clocked_in_time=sum(total_shift_time),
            job_time=sum(total_job_time),
            shift_hours_daily=_get_shift_hours_daily(shifts),
            job_hours_daily=_get_job_hours_daily(jobs),
            start_date=start_date,
            end_date=end_date)
