from graphene import Float, ObjectType, DateTime, List


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
