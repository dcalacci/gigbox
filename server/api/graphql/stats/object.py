from graphene import Float, ObjectType, DateTime, List


class DayStats(ObjectType):
    date = DateTime()
    base_pay = Float()
    tip = Float()
    expenses = Float()
    mileage = Float()
    active_time = Float()
    clocked_in_time = Float()
    hourly_pay = Float()
    hourly_pay_active = Float()

class DailyStats(ObjectType):
    n_days = Float()
    data = List(DayStats)

class NetPay(ObjectType):
    """Net Pay Graphql Object. 
    mileage_deduction: Float, indicating total amount deductible from mileage traveled. 
        This is also equivalent to expenses.
    tip: Total tip
    pay: Total pay, excluding tip
    start_date: start date for the computation
    end_date: end date for the computation
    """
    mileage_deduction = Float()
    tip = Float()
    pay = Float()
    start_date = DateTime()
    end_date = DateTime()
    clocked_in_time = Float()
    job_time = Float()



class DailyHours(ObjectType):
    date = DateTime()
    hrs = Float()


class WorkingTime(ObjectType):
    """Working Time Graphql Object

    Args:
        ObjectType ([type]): [description]
    """
    clocked_in_time = Float()
    job_time = Float()
    shift_hours_daily = List(lambda: DailyHours)
    job_hours_daily = List(lambda: DailyHours)
    start_date = DateTime()
    end_date = DateTime()
