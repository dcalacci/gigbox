from api.models.survey import QuestionTypeEnum
import os
import random
import cv2
import pytesseract
import numpy as np
import json
import base64
import binascii
import graphene
from shutil import copy
from sqlalchemy import inspect, and_
from graphene import (
    Mutation,
    Float,
    DateTime,
    Field,
    String,
    Boolean,
    List,
    ID,
    ObjectType,
    Enum
)
from graphql_relay.node.node import from_global_id
from shapely import geometry
from geoalchemy2.shape import to_shape
from datetime import datetime
from dateutil import parser
from flask import g, current_app, url_for
from PIL import Image
from graphene_file_upload.scalars import Upload
from geoalchemy2.shape import from_shape
from api.controllers.auth.decorators import login_required
from api.graphql.object import (
    User,
    JobNode,
    ShiftNode,
    Location,
    LocationInput,
    AnswerInput,
    EmployerInput,
    Screenshot,
    JobNode,
    SurveyNode,
    AnswerNode,
    resolve_geom
)
from api.models import (
    User as UserModel,
    Shift as ShiftModel,
    Location as LocationModel,
    Screenshot as ScreenshotModel,
    Job as JobModel,
    Consent as ConsentModel,
    Answer as AnswerModel,
    Question as QuestionModel,
    Geometry_WKT,
    EmployerNames,
    db,
    Session
)
from api.utils import generate_filename
from api.routing.mapmatch import get_route_distance_and_geometry
from api.screenshots.parser import predict_app, image_to_df, parse_image
from flask import current_app
from api.controllers.errors import ShiftInvalidError, JobInvalidError

# we use a traditional REST endpoint to create JWT tokens and for first login
# So, honestly, unsure if we need a Createuser mutation. We will only ever create
# users from the server anyway.

# All requests are associated with a token.

from config import get_environment_config

c = get_environment_config()


class CreateUser(Mutation):
    """Mutation to create a user. must be given a UID"""

    user = Field(lambda: User, description="User created by this mutation")

    class Arguments:
        uid = String(required=True)

    def mutate(self, info, uid):
        user = UserModel(uid=uid)

        db.session.add(user)
        db.session.commit()
        return CreateUser(user=user)


class CreateShift(Mutation):
    """Creates a shift"""

    shift = Field(lambda: ShiftNode, description="Shift that was created")

    # For optional fields in graphene mutations, see:
    class Arguments:
        start_time = String(required=False)
        end_time = String(required=False)
        active = Boolean(required=True)
        locations = List(LocationInput, required=False)

    @login_required
    def mutate(self, info, active, **kwargs):
        end_time = kwargs.get("end_time", None)
        start_time = kwargs.get("start_time", None)
        locations = kwargs.get("locations", [])
        if start_time:
            start_time = parser.parse(start_time)
        shift = ShiftModel(
            start_time=start_time, end_time=end_time, user_id=g.user, active=active
        )
        for l in locations:
            shift.locations.append(Location(l.timestamp, l.lng, l.lat))
        db.session.add(shift)
        db.session.commit()
        return CreateShift(shift=shift)


class EndShift(Mutation):
    """Ends a shift"""

    shift = Field(lambda: ShiftNode, description="Shift that is being ended")

    class Arguments:
        shift_id = ID(required=True, description="ID of the shift to end")

    @login_required
    def mutate(self, info, shift_id):
        shift_id = from_global_id(shift_id)[1]
        end_time = datetime.now()
        shift = (
            db.session.query(ShiftModel).filter_by(
                id=shift_id, user_id=g.user).first()
        )

        if (end_time - shift.start_time).seconds < c.MIN_SHIFT_DURATION:
            shift.end_time = end_time
            shift.active = False
            db.session.delete(shift)
            db.session.commit()
            raise ShiftInvalidError(
                "Shift not tracked - it was under 5 minutes.")
        else:
            # calculate final mileage for this shift and create jobs
            if (len(shift.locations) > 10):
                shift = updateShiftMileageAndGeometry(shift, info)
                createJobsFromLocations(shift, shift.locations, info)

            shift.end_time = end_time
            shift.active = False
            db.session.add(shift)
            db.session.commit()

            return EndShift(shift=shift)


class ExtractJobsFromShift(Mutation):
    """Extract trips from a shift.

    If the trips / jobs already exist, they are not created.

    We test if a trip / job already exists by comparing the times. 
    We can only have one trip during a certain time period. 
    If one already exists, it takes precedence. 
    """

    jobs = Field(lambda: List(JobNode), description="Jobs added")

    class Arguments:
        shift_id = ID(
            required=True, description="ID of the shift to extract jobs from")

    @login_required
    def mutate(self, info, shift_id):
        shift_id = from_global_id(shift_id)[1]
        shift = (db.session.query(ShiftModel).filter_by(
            id=shift_id, user_id=g.user).first())
        jobs = extractJobsFromLocations(shift, shift.locations, info)

        # don't add any that overlap with existing jobs
        added = []
        overlaps = [list(JobModel.query.filter(and_(
            JobModel.shift_id == shift.id,
            JobModel.start_time <= j.end_time,
            JobModel.end_time >= j.start_time))) for j in jobs]
        for n, j in enumerate(jobs):
            if not overlaps[n]:
                db.session.add(j)
                added.append(j)
            else:
                print("overlap:", [(j.start_time, j.end_time)
                                   for j in overlaps[n]])
        db.session.commit()
        return ExtractJobsFromShift(added)


class DeleteShift(Mutation):
    class Arguments:
        id = ID(required=True)

    ok = Field(lambda: Boolean)
    message = Field(lambda: String)

    @login_required
    def mutate(self, info, id):
        shift_id = from_global_id(id)[1]
        shift = ShiftModel.query.filter_by(
            id=shift_id, user_id=g.user).first()
        if not shift:
            return DeleteShift(ok=False, message="Either that shift doesn't exist or you don't have access.")
        else:
            db.session.delete(shift)
            db.session.commit()
            return DeleteShift(ok=True, message="Shift Deleted")


def updateShiftMileageAndGeometry(shift, info):
    """adds mileage and geometry to a shift object using one call to our mapmatch api"""
    locs = sorted(shift.locations, key=lambda l: l.timestamp)
    match_obj = get_route_distance_and_geometry(locs)
    if 'geom_obj' not in match_obj or not match_obj['geom_obj']:
        current_app.logger.error(f'Failed to match a route to shift...')
        current_app.logger.error(match_obj)
        return shift

    distance = match_obj['distance']
    bb = match_obj['geom_obj'][1]
    geometries = match_obj['geom_obj'][0]

    bounding_box = {'minLat': bb[1],
                    'minLng': bb[0],
                    'maxLat': bb[3],
                    'maxLng': bb[2]}
    matched = {'geometries': geometries, 'bounding_box': bounding_box}
    current_app.logger.info('adding matched geometry to shift:')
    shift.snapped_geometry = matched
    shift.road_snapped_miles = match_obj['distance']
    current_app.logger.info(f'matched route added to shift...')
    return shift


def extractJobsFromLocations(shift, locations, info):
    """ Create job objects from a list of locations and a shift 
    """
    from api.routing.mapmatch import get_trips_from_locations, get_match_for_trajectory

    if shift.end_time is not None:
        locs = [l for l in locations if l.timestamp >=
                shift.start_time and l.timestamp <= shift.end_time]
    else:
        locs = [l for l in locations if l.timestamp >= shift.start_time]
    trips = get_trips_from_locations(locs)
    jobs = []

    print("TRIPS:", trips)
    if len(trips) == 0:
        return jobs
    for traj_df, stops, dist in trips:
        job = JobModel(
            start_location={
                'lat': stops['start'].lat, 'lng': stops['start'].lng},
            end_location={'lat': stops['stop'].lat, 'lng': stops['stop'].lng},
            user_id=shift.user_id,
            shift_id=shift.id,
        )

        match_obj = get_route_distance_and_geometry(traj_df)
        bb = match_obj['geom_obj'][1]
        geometries = match_obj['geom_obj'][0]

        bounding_box = {'minLat': bb[1],
                        'minLng': bb[0],
                        'maxLat': bb[3],
                        'maxLng': bb[2]}
        matched = {'geometries': geometries, 'bounding_box': bounding_box}
        job.snapped_geometry = matched
        job.mileage = match_obj['distance']
        job.end_time = stops['stop'].leaving_datetime
        job.start_time = stops['start'].datetime
        jobs.append(job)
    return jobs


def createJobsFromLocations(shift, locations, info):
    jobs = extractJobsFromLocations(shift, locations, info)
    for j in jobs:
        db.session.add(j)
    db.session.commit()


class AddLocationsToShift(Mutation):
    """Adds a list of locations to a given shift"""

    location = Field(lambda: Location,
                     description="latest location added to shift")
    ok = Field(lambda: Boolean)

    class Arguments:
        shift_id = ID(
            required=True, description="ID of the shift to add locations to")
        # locationinput should be lat,lng,timestamp
        locations = List(LocationInput)

    @login_required
    def mutate(self, info, shift_id, locations):
        from api.routing.mapmatch import clean_trajectory
        shift_id = from_global_id(shift_id)[1]
        # ensure the user owns this shift
        shift = ShiftModel.query.filter_by(id=shift_id, user_id=g.user).first()

        for l in locations:
            # turn it into seconds
            time = datetime.fromtimestamp(float(l.timestamp) / 1000)
            # if time is before the start time of this shift, drop it (don't add)
            shift.locations.append(
                LocationModel(
                    time,
                    l.lng,
                    l.lat,
                    shift_id,
                )
            )
        # Every 5 locations added, update the distance on the shift by cleaning locations and map
        # matching.
        n_locations = len(shift.locations)
        if n_locations % 5 == 0 and n_locations > 2:
            current_app.logger.info(
                "Updating mileage & calculated route on shift...")
            shift = updateShiftMileageAndGeometry(shift, info)
        db.session.add(shift)
        db.session.commit()

        # return last location
        return AddLocationsToShift(location=shift.locations[-1], ok=True)


class DeleteImage(Mutation):
    class Arguments:
        id = ID(required=True)

    ok = Field(lambda: Boolean)
    message = Field(lambda: String)

    @login_required
    def mutate(self, info, id):
        screenshot = ScreenshotModel.query.filter_by(
            id=id, user_id=g.user).first()
        if not screenshot:
            return DeleteImage(ok=False, message="Image does not exist or user does not have access.")
        else:
            db.session.delete(screenshot)
            db.session.commit()
            return DeleteImage(ok=True, message="Image Deleted")


class AddScreenshotToShift(Mutation):
    class Arguments:
        object_id = ID(required=True)
        asset = Upload(required=True)
        device_uri = String(required=True)
        timestamp = DateTime(required=True)

    # True if successfully saved and processed image
    success = Field(lambda: Boolean)
    # True if we identify it as an app screenshot
    isApp = Field(lambda: Boolean)
    # employer details if parsed as an app image
    employer = Field(lambda: String)
    data = Field(lambda: String)
    obj_id = Field(lambda: ID)
    screenshot = Field(lambda: Screenshot,
                       description="Screenshot that was created.")

    @login_required
    def mutate(self, info, object_id, asset, device_uri, timestamp, **kwargs):
        obj_type, obj_id = from_global_id(object_id)

        print(obj_type, obj_id)

        if obj_type == 'job':
            job_id = obj_id

        elif obj_type == 'shift':
            shift_id = obj_id

        # Decode base64 image
        decoded = base64.decodebytes(bytes(asset, 'utf-8'))
        f_array = np.asarray(bytearray(decoded))
        # Write image to disk
        image = cv2.imdecode(f_array, 0)
        # gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        text = parse_image(image)
        app = predict_app(text)

        # TODO: if they give us a job, add the screenshot to the job, and parse it.
        if app:
            os.makedirs('/opt/data/images', exist_ok=True)
            img_filename = os.path.join('/opt/data/images',
                                        generate_filename(obj_id))
            print("IMAGE FILENAME:", img_filename)
            cv2.imwrite(img_filename, image)
            print("Wrote to file...")
            if obj_type == 'JobNode':
                job = JobModel.query.filter_by(
                    id=obj_id, user_id=g.user).first()

                print("Found job:", job)
                screenshot = ScreenshotModel(
                    job_id=obj_id,
                    shift_id=job.shift_id,
                    on_device_uri=device_uri,
                    img_filename=img_filename,
                    timestamp=timestamp,
                    user_id=g.user,
                    employer=app
                )
                job.screenshots.append(screenshot)
                db.session.add(screenshot)
                db.session.add(job)
            elif obj_type == 'ShiftNode':
                shift = ShiftModel.query.filter_by(
                    id=obj_id, user_id=g.user).first()

                screenshot = ScreenshotModel(
                    shift_id=obj_id,
                    on_device_uri=device_uri,
                    img_filename=img_filename,
                    timestamp=timestamp,
                    user_id=g.user,
                    employer=app
                )
                db.session.add(screenshot)

            db.session.commit()
            # df = image_to_df(image)
            # TODO: non-app images should be rejected
            return AddScreenshotToShift(
                success=True,
                isApp=True,
                employer="SHIPT",
                data=text,
                obj_id=obj_id,
                screenshot=screenshot
            )
        else:
            print("Not an app screenshot. Not saving...")
            return AddScreenshotToShift(
                success=False,
                isApp=False,
            )


class CreateJob(Mutation):
    job = Field(lambda: JobNode, description='Job that was created')
    ok = Field(lambda: Boolean)

    class Arguments:
        tip = Float()
        totalPay = Float()
        endTime = DateTime()
        startTime = DateTime()
        mileage = Float()
        employer = graphene.Argument(Enum.from_enum(EmployerNames))

    @login_required
    def mutate(self, info, **kwargs):
        print("creating job...", kwargs)
        #shift_id = from_global_id(shift_id)[1]
        # shift = ShiftModel.query.filter_by(user_id=g.user).first()

        job = JobModel(
            shift_id=None,
            user_id=g.user,
            employer=kwargs['employer'],
        )

        job.start_time = kwargs['startTime'],
        job.end_time = kwargs['endTime'],
        job.tip = kwargs['tip'],
        job.total_pay = kwargs['totalPay']
        job.mileage = kwargs['mileage']

        print("Creating job:", job)


        db.session.add(job)
        db.session.commit()
        return CreateJob(job=job, ok=True)


def get_mileage_and_geometry_for_locations(locations):
    """Computes the total mileage and a snapped-to-road geometry for a list of Location objects.
    Uses the OSRM API as configured in mapmatch.py and osrmapi.py.

    Args:
        locations ([Location]): Locations to compute  geometry and distance from

    Returns:
        [dict]: A dict with two keys: 'geometry', and 'distance', which 
        holds a geometry line string snapped to an OpenStreetMap road network, and 
        that line's total mileage, respectively.
    """
    locs = sorted(locations, key=lambda l: l.timestamp)
    match_obj = get_route_distance_and_geometry(locs)

    if ('geom_obj' not in match_obj
            or not match_obj['geom_obj']
            or match_obj['status'] == 'error'):
        current_app.logger.error("Failed to match a route to job...")
        return job

    distance = match_obj['distance']
    bb = match_obj['geom_obj'][1]
    geometries = match_obj['geom_obj'][0]

    bounding_box = {'minLat': bb[1],
                    'minLng': bb[0],
                    'maxLat': bb[3],
                    'maxLng': bb[2]}
    matched = {'geometries': geometries, 'bounding_box': bounding_box}
    return {'geometry': matched, 'distance': match_obj['distance']}


def get_job_mileage_and_geometry(job, shift=None):
    """Compute the mileage and geometry for a given Job object using locations from
    it's associated Shift.

    Args:
        job (Job): Job to compute mileage and geometry for 
        shift (Shift, optional): Shift this job belongs to. Defaults to None. 
        Locations are retrieved from this shift.

    Returns:
        Job: the given Job object with snapped_geometry and distance fields replaced with newly
        computed values.
    """
    # don't need this - the shift id here is UUID
    # shift_id = from_global_id(job.shift_id)[1]
    print("getting mileage and geometry for job:", job, job.shift_id)
    if shift is None:
        shift = ShiftModel.query.get(job.shift_id)
    # shift = db.session.get(job.shift_id)
    # get only locations between job start and end from this shift
    end_time = job.end_time if job.end_time is not None else datetime.utcnow()
    job_locations = [l for l in shift.locations if (
        l.timestamp is not None
        and l.timestamp >= job.start_time
        and l.timestamp <= end_time)]
    if len(job_locations) > 2:
        current_app.logger.info('adding matched geometry to job:')
        res = get_mileage_and_geometry_for_locations(job_locations)
        job.snapped_geometry = res['geometry']
        job.mileage = res['distance']
    return job


class EndJob(Mutation):
    job = Field(lambda: JobNode, description="job to end")
    ok = Field(lambda: Boolean)

    class Arguments:
        job_id = ID(required=True)
        end_location = LocationInput()

    @login_required
    def mutate(self, info, job_id, end_location):

        job_id = from_global_id(job_id)[1]
        job = JobModel.query.filter_by(id=job_id, user_id=g.user).first()
        job.end_time = datetime.now()
        job.end_location = from_shape(
            geometry.Point(end_location.lng, end_location.lat))
        if (job.end_time - job.start_time).seconds < 5 * 60:
            db.session.delete(job)
            db.session.commit()
            raise JobInvalidError("Job not saved - it was under 5 minutes")
        job = get_job_mileage_and_geometry(info, job)
        if (job.mileage is None or job.mileage < 1):
            db.session.delete(job)
            db.session.commit()
            raise JobInvalidError("Job not saved - it was under 1 mile")
        db.session.add(job)
        db.session.commit()
        return EndJob(job=job, ok=True)


class SetJobTotalPay(Mutation):
    job = Field(lambda: JobNode, description="Job to update")
    ok = Field(lambda: Boolean)

    class Arguments:
        job_id = ID(required=True)
        value = Float(required=True)

    @login_required
    def mutate(self, info, job_id, value):
        job_id = from_global_id(job_id)[1]
        job = JobModel.query.filter_by(id=job_id, user_id=g.user).first()
        job.total_pay = value
        db.session.add(job)
        db.session.commit()
        return SetJobTotalPay(job, True)


class SetJobTip(Mutation):
    job = Field(lambda: JobNode, description="Job to update")
    ok = Field(lambda: Boolean)

    class Arguments:
        job_id = ID(required=True)
        value = Float(required=True)

    @login_required
    def mutate(self, info, job_id, value):
        job_id = from_global_id(job_id)[1]
        job = JobModel.query.filter_by(id=job_id, user_id=g.user).first()
        job = JobModel.query.filter_by(id=job_id, user_id=g.user).first()
        job.tip = value
        db.session.add(job)
        db.session.commit()
        return SetJobTip(job, True)


class SetJobMileage(Mutation):
    job = Field(lambda: JobNode, description="Job to update")
    ok = Field(lambda: Boolean)

    class Arguments:
        job_id = ID(required=True)
        value = Float(required=True)

    @login_required
    def mutate(self, info, job_id, value):
        job_id = from_global_id(job_id)[1]
        job = JobModel.query.filter_by(id=job_id, user_id=g.user).first()
        job.mileage = value
        db.session.add(job)
        db.session.commit()
        return SetJobMileage(job, True)


class SetJobEmployer(Mutation):
    job = Field(lambda: JobNode, description="Job to update")
    ok = Field(lambda: Boolean)

    class Arguments:
        job_id = ID(required=True)
        value = graphene.Argument(Enum.from_enum(EmployerNames))

    @login_required
    def mutate(self, info, job_id, value):
        job_id = from_global_id(job_id)[1]
        job = JobModel.query.filter_by(id=job_id, user_id=g.user).first()
        job.employer = value
        db.session.add(job)
        db.session.commit()
        return SetJobEmployer(job, True)


def most_common_employer_or_none(jobs):
    """Returns most common employer 
    from a list of jobs.

    Args:
        jobs ([Job]): List of job model objects

    Returns:
        Enum: most common Employer enum in list, or None if no Job in jobs has an employer set.
    """
    employers = [j.employer for j in jobs if j is not None]
    if len(employers) == 0:
        return None
    else:
        most_common = max(set(employers), key=employers.count)
        return most_common


def get_all_locations_from_jobs(jobs, start_time, end_time):
    """Return a list of Location objects collected from each job in jobs.

    Pulls Location objects from each Job's associated Shift

    Location list is sorted by timestamp.

    Args:
        jobs ([Job]): List of Job objects to pull locations from
        start_time (DateTime): Includes only locations that were recorded after this time
        end_time (DateTime): Includes only locations that were recorded before this time. 

    Returns:
        [Location]: List of Location objects. 
    """
    import itertools
    unique_shift_ids = set([job.shift_id for job in jobs])
    shifts = [ShiftModel.query.get(shift_id) for shift_id in unique_shift_ids]
    all_locations = itertools.chain(*[s.locations for s in shifts])
    sorted_locs = sorted(all_locations, key=lambda l: l.timestamp)
    job_locations = [l for l in sorted_locs if (
        l.timestamp is not None
        and l.timestamp >= start_time
        and l.timestamp <= end_time)]
    # job_loc_shapes = [to_shape(l) for l in job_locations]
    # latLngs = [{'lat': shp.y, 'lng': shp.x} for shp in job_loc_shapes]
    # return latLngs
    return job_locations


class DeleteJob(Mutation):
    ok = Field(lambda: Boolean, description="True if job deleted successfully")
    message = Field(lambda: String, description="Any error or success message")

    class Arguments:
        job_id = graphene.Argument(ID, required=True)

    @login_required
    def mutate(self, info, job_id):
        id = from_global_id(job_id)[1]
        job = JobModel.query.get(id)
        if not job:
            return DeleteJob(ok=False, message="Either that job doesn't exist or you don't have access to it.")
        else:
            db.session.delete(job)
            db.session.commit()
            return DeleteJob(ok=True, message="Job Deleted")


class MergeJobs(Mutation):
    ok = Field(lambda: Boolean, description="True if job merged successfully")
    committed = Field(
        lambda: Boolean, description="True if Job committed to database successfully")
    message = Field(
        lambda: String, description="Associated message. 'success' if operation is successful.")
    mergedJob = Field(
        lambda: JobNode, description="Merged Job (if successful). Null otherwise.")

    class Arguments:
        job_ids = List(ID)
        dry_run = Boolean(required=False)
        total_pay = Float(required=False)
        tip = Float(required=False)
        employer = graphene.Argument(
            graphene.Enum.from_enum(EmployerNames), required=False)

    @login_required
    def mutate(self, info, job_ids, total_pay=None, tip=None, employer=None, dry_run=False):
        """Mutation to merge a list of jobs indicated by job_ids

        Args:
            info (Graphql Context): graphql context info object
            job_ids ([ID]): List of Job IDs, in base64 encoded ID strings, to merge. 
            dry_run (Boolean): Merges as a "dry run" without committing or removing any jobs. 
                used to provide a preview of a merge result
            employer (EmployerNames): Employer for this job. optional.
            tip (Float): Tip for this job. Optional.
            total_pay (Float): Total pay for this job. Optional.

        Returns a dict of the form { 'ok', 'message', 'mergedJob'}, where
        'ok' is true if the operation succeeds, 'message' holds any error message as a string, 
        and 'mergedJob' is None if unsuccessful, and otherwise is the JobNode of the newly created
        merged Job if successful.

        It assigns the given total_pay, tip, and employer for the merged job, unless not given.

        The merged Job adopts the most common Employer from the list of Jobs, and 
        its total_pay and tip fields are the sum of the list of jobs'. A new distance
        and geometry are computed for the job from all jobs given. 

        The list of jobs can be from different shifts.
        """
        job_ids = [from_global_id(id)[1] for id in job_ids]
        jobs = [JobModel.query.get(job_id) for job_id in job_ids]
        jobs = sorted(jobs, key=lambda j: j.start_time)
        start_loc = to_shape(jobs[0].start_location)
        end_loc = to_shape(jobs[-1].end_location)
        newJob = JobModel(
            shift_id=jobs[0].shift_id,
            user_id=g.user,
            employer=(employer or most_common_employer_or_none(jobs)),
            start_location={'lat': start_loc.y, 'lng': start_loc.x},
            end_location={'lat': end_loc.y, 'lng': end_loc.x}
        )
        newJob.start_time = jobs[0].start_time
        newJob.end_time = jobs[-1].end_time
        newJob.total_pay = (total_pay or np.sum(
            [(j.total_pay or 0.) for j in jobs]))
        newJob.tip = (tip or np.sum([(j.tip or 0.) for j in jobs]))

        job_locations = get_all_locations_from_jobs(jobs,
                                                    newJob.start_time,
                                                    newJob.end_time)

        res = get_mileage_and_geometry_for_locations(job_locations)

        newJob.snapped_geometry = res['geometry']
        newJob.mileage = res['distance']

        if dry_run:
            newJob.id = None
            return MergeJobs(ok=True, committed=False, message="(Dry Run) Merged {} trips".format(len(jobs)), mergedJob=newJob)
        try:
            db.session.add(newJob)
            for job in jobs:
                db.session.delete(job)
        except:
            db.session.rollback()
            return MergeJobs(ok=False, committed=False, message="Couldn't merge trips...", mergedJob=None)
        else:
            db.session.commit()
            return MergeJobs(ok=True, committed=True, message="Merged {} trips".format(len(jobs)), mergedJob=newJob)


class SetShiftEmployers(Mutation):
    shift = Field(lambda: ShiftNode, description="Shift to update")

    class Arguments:
        shift_id = ID(
            required=True, description="ID of the shift to set employers for")
        employers = List(graphene.Enum.from_enum(EmployerNames))

    @login_required
    def mutate(self, info, shift_id, employers):
        print("Adding employers to shift:", shift_id, employers)
        shift_id = from_global_id(shift_id)[1]
        shift = ShiftModel.query.filter_by(id=shift_id, user_id=g.user).first()
        assert shift.user_id == g.user
        # TODO: match employer enum to input
        # right now we just assume it's correct
        shift.employers = employers

        print("Adding...", shift.employers)
        db.session.add(shift)
        db.session.commit()
        return SetShiftEmployers(shift)


class SubmitIntroSurvey(Mutation):
    user = Field(lambda: User, description="user who submitted survey")

    class Arguments:
        employers = List(graphene.Enum.from_enum(EmployerNames))

    @login_required
    def mutate(self, info, employers):
        user_id = g.user
        user = UserModel.query.filter_by(id=user_id).first()
        user.employers = employers
        db.session.add(user)
        db.session.commit()
        return SubmitIntroSurvey(user)


class SubmitConsent(Mutation):
    user = Field(lambda: User, description="user that consented")

    class Arguments:
        interview = Boolean(required=True)
        data_sharing = Boolean(required=True)
        phone = String(required=False)
        email = String(required=False)
        name = String(required=True)
        signature = String(required=True)

    @login_required
    def mutate(self, info, interview, data_sharing, phone, email, name, signature, **kwargs):
        user_id = g.user
        encoded_image = signature.split(",")[1]
        # decoded_image = Base64.decode64(encoded_image)
        decoded = base64.decodebytes(bytes(encoded_image, 'utf-8'))
        f_array = np.asarray(bytearray(decoded))
        image = cv2.imdecode(f_array, 0)

        img_filename = os.path.join('/opt/data/signatures',
                                    generate_filename(user_id))
        cv2.imwrite(img_filename, image)
        print("wrote signature to file...")
        consent = ConsentModel(
            user_id=user_id,
            data_sharing=data_sharing,
            interview=interview,
            consented=True,
            signature_encoded=signature,
            signature_filename=img_filename
        )
        user = UserModel.query.filter_by(id=user_id).first()
        if phone:
            user.phone = phone
        if email:
            user.email = email
        user.name = name
        user.consent = consent
        db.session.add(user)
        db.session.commit()
        return SubmitConsent(user)


class UpdateInterviewConsent(Mutation):
    user = Field(lambda: User, description="User to be altered")

    class Arguments:
        interview = Boolean(required=True)

    @login_required
    def mutate(self, info, interview):
        user_id = g.user
        user = UserModel.query.filter_by(id=user_id).first()
        user.consent.interview = interview
        db.session.add(user)
        db.session.commit()
        return UpdateInterviewConsent(user)


class UpdateDataSharingConsent(Mutation):
    user = Field(lambda: User, description="User to be altered")

    class Arguments:
        dataSharing = Boolean(required=True)

    @login_required
    def mutate(self, info, dataSharing):
        user_id = g.user
        user = UserModel.query.filter_by(id=user_id).first()
        user.consent.data_sharing = dataSharing
        db.session.add(user)
        db.session.commit()
        return UpdateInterviewConsent(user)


class UnenrollAndDelete(Mutation):
    ok = Field(lambda: Boolean)

    @login_required
    def mutate(self, info):
        user_id = g.user
        user = UserModel.query.filter_by(id=user_id).first()
        db.session.delete(user)
        db.session.commit()
        return UnenrollAndDelete(True)


class ExportJobs(Mutation):
    file_url = Field(lambda: String)
    message = Field(lambda: String)
    ok = Field(lambda: Boolean)

    class Arguments:
        ids = List(ID, required=True)
        # TODO: maybe select columns?

    @login_required
    def mutate(self, info, ids):
        import csv
        import zipfile
        import shutil
        user_id = g.user

        parsed_ids = [from_global_id(id)[1] for id in ids]
        # job in Ids we're given, with user_id matching for authorization
        records = (JobModel.query
                   .filter_by(user_id=user_id)
                   .filter(JobModel.id.in_(parsed_ids)))

        columns = [column for column in inspect(JobModel).columns
                   if column.name not in ['snapped_geometry', 'user_id']]

        # collect screenshots
        screenshots = ScreenshotModel.query.filter(
            ScreenshotModel.job_id.in_(parsed_ids))

        # copy screenshots to export dir, one subdirectory for each job
        nowstr = datetime.now().strftime("%d-%m-%Y_%H-%M-%S")
        export_dir = f'/opt/data/exports/{user_id}_{nowstr}'
        os.makedirs(export_dir, exist_ok=True)
        for s in screenshots:
            print(str(s.job_id))
            screenshot_export_dir = os.path.join(export_dir, str(s.job_id))
            os.makedirs(screenshot_export_dir, exist_ok=True)
            copy(s.img_filename, screenshot_export_dir)
        outpath = os.path.join(export_dir, 'jobs.csv')
        outfile = open(outpath, 'w')
        outcsv = csv.writer(outfile)
        # header row
        outcsv.writerow([c.name for c in columns])
        for curr in records:
            row = []
            for column in columns:
                a = getattr(curr, column.name)
                if 'location' in column.name:
                    print("a:", a)
                    row.append(resolve_geom(a))
                else:
                    row.append(str(a))
            outcsv.writerow(row)
        outfile.close()
        # create zip file
        zip_path = f"{export_dir}"
        shutil.make_archive(zip_path, 'zip', export_dir)
        # delete original dir, leaving only zip file
        shutil.rmtree(export_dir)
        zip_fname = os.path.basename(f"{zip_path}.zip")
        url = url_for('export_file', fname=zip_fname)
        return ExportJobs(ok=True,
                          message="Export Successful",
                          file_url=url)


class SubmitSurvey(Mutation):
    ok = Field(lambda: Boolean)

    class Arguments:
        survey_id = ID(required=True)
        survey_responses = List(AnswerInput, required=True)

    @login_required
    def mutate(self, info, survey_id, survey_responses):
        user_id = g.user
        user = UserModel.query.filter_by(id=user_id).first()
        answers = []
        for resp in survey_responses:
            question_id = from_global_id(resp['question_id'])[1]
            question = QuestionModel.query.filter_by(id=question_id).first()
            a = AnswerModel()
            a.user_id = user_id
            a.user = user
            a.question = question
            a.date = datetime.now()
            if question.question_type == QuestionTypeEnum.MULTISELECT:
                a.answer_options = resp.selectValue
            elif question.question_type == QuestionTypeEnum.SELECT:
                a.answer_options = resp.selectValue
            elif question.question_type == QuestionTypeEnum.TEXT:
                a.answer_text = resp.textValue
            elif question.question_type == QuestionTypeEnum.TEXT:
                a.answer_text = resp.numericValue
            elif question.question_type == QuestionTypeEnum.CHECKBOX:
                a.answer_yn = resp.ynValue
            elif question.question_type == QuestionTypeEnum.RANGE:
                a.answer_numeric = resp.numericValue
            answers.append(a)
        # add answers, not user to session.
        # when user is added, answer.user is not populated for some reason.
        for answer in answers:
            db.session.add(answer)
        db.session.commit()
        return(SubmitSurvey(ok=True))


class Mutation(ObjectType):
    """Mutations which can be performed by this API."""

    # Person mutation
    createUser = CreateUser.Field()
    createShift = CreateShift.Field()
    endShift = EndShift.Field()
    extractJobsFromShift = ExtractJobsFromShift.Field()
    deleteShift = DeleteShift.Field()
    createJob = CreateJob.Field()
    setJobTotalPay = SetJobTotalPay.Field()
    setJobTip = SetJobTip.Field()
    setJobMileage = SetJobMileage.Field()
    setJobEmployer = SetJobEmployer.Field()
    endJob = EndJob.Field()
    mergeJobs = MergeJobs.Field()
    deleteJob = DeleteJob.Field()
    setShiftEmployers = SetShiftEmployers.Field()
    addLocationsToShift = AddLocationsToShift.Field()
    addScreenshotToShift = AddScreenshotToShift.Field()
    deleteImage = DeleteImage.Field()
    submitConsent = SubmitConsent.Field()
    submitIntroSurvey = SubmitIntroSurvey.Field()
    updateDataSharingConsent = UpdateDataSharingConsent.Field()
    updateInterviewConsent = UpdateInterviewConsent.Field()
    unenrollAndDelete = UnenrollAndDelete.Field()
    submitSurvey = SubmitSurvey.Field()
    exportJobs = ExportJobs.Field()
