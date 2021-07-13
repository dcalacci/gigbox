import pendulum

# https://www.irs.gov/newsroom/irs-issues-standard-mileage-rates-for-2021
IRSMileageDeduction = {
    2021: 0.56
}


def get_mileage_deduction(jobs):
    """Returns the total deduction / cost for miles driven in jobs

    Args:
        jobs ([JobModel]): List of jobs to calculate deduction for

    Returns:
        float: Total deduction for miles tracked in the given list of jobs.
    """
    deduction = sum(
        [job.mileage * IRSMileageDeduction[job.start_time.year] for job in jobs])
    return deduction
