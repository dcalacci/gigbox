import os
import random
import cv2
import pytesseract
import numpy as np
import json
import base64
import binascii
import graphene
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
)
from graphql_relay.node.node import from_global_id
from shapely import geometry
from geoalchemy2.shape import to_shape
from datetime import datetime
from dateutil import parser
from flask import g, current_app
from PIL import Image
from graphene_file_upload.scalars import Upload
from geoalchemy2.shape import from_shape
from api.controllers.auth.decorators import login_required
from api.graphql.object import (
    User,
    ShiftNode,
    Location,
    LocationInput,
    EmployerInput,
    Screenshot,
    JobNode
)
from api.models import (
    User as UserModel,
    Shift as ShiftModel,
    Location as LocationModel,
    Screenshot as ScreenshotModel,
    Job as JobModel,
    Consent as ConsentModel,
    Geometry_WKT,
    EmployerNames,
    db
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
    # https://github.com/graphql-python/graphene/issues/769#issuecomment-397596754
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
        shift_id = String(required=True, description="ID of the shift to end")

    @login_required
    def mutate(self, info, shift_id):
        shift_id = from_global_id(shift_id)[1]
        end_time = datetime.now()
        shift = (
            db.session.query(ShiftModel).filter_by(
                id=shift_id, user_id=g.user).first()
        )

        if (end_time - shift.start_time).seconds < 5*60:
            shift.end_time = end_time
            shift.active = False
            shift = endAnyActiveJobs(shift, info)
            db.session.delete(shift)
            db.session.commit()
            raise ShiftInvalidError(
                "Shift not tracked - it was under 5 minutes.")

        # calculate final mileage for this shift
        shift = updateShiftMileageAndGeometry(shift, info)

        if (shift.road_snapped_miles is None or shift.road_snapped_miles < 1):
            shift.end_time = end_time
            shift.active = False
            shift = endAnyActiveJobs(shift, info)
            db.session.delete(shift)
            db.session.commit()
            raise ShiftInvalidError(
                "Shift not tracked - it was under 1 mile long.")

        shift = endAnyActiveJobs(shift, info)
        shift.end_time = end_time
        shift.active = False
        db.session.add(shift)
        db.session.commit()

        return EndShift(shift=shift)


def updateShiftMileageAndGeometry(shift, info):
    """adds mileage and geometry to a shift object using one call to our mapmatch api"""
    locs = sorted(shift.locations, key=lambda l: l.timestamp)
    match_obj = get_route_distance_and_geometry(locs)
    if 'geom_obj' not in match_obj or not match_obj['geom_obj']:
        current_app.logger.error(f'Failed to match a route to shift...')
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


def endAnyActiveJobs(shift, info):
    for j in shift.jobs:
        if (j.end_time is None):
            print("Found an active job. Ending...")
            j.end_time = datetime.now()
            j.end_location = shift.locations[-1].geom
    return shift


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
        shift_id = from_global_id(shift_id)[1]
        # ensure the user owns this shift
        shift = ShiftModel.query.filter_by(id=shift_id, user_id=g.user).first()
        # TODO: throw a helpful error.
        for l in locations:
            shift.locations.append(
                LocationModel(
                    # turn it into seconds
                    datetime.fromtimestamp(float(l.timestamp) / 1000),
                    l.lng,
                    l.lat,
                    shift_id,
                )
            )

        active_job = JobModel.query.filter_by(
            user_id=g.user,
            end_time=None,
            shift_id=shift_id).first()
        # Every 5 locations added, update the distance on the shift by doing
        # map matching
        n_locations = len(shift.locations)
        if n_locations % 5 == 0 and n_locations > 2:
            current_app.logger.info(
                "Updating mileage & calculated route on shift...")
            shift = updateShiftMileageAndGeometry(shift, info)

            if (active_job):
                # update job mileage and geometry, too. Seems cheap to do (just one more api match call)
                active_job = get_job_mileage_and_geometry(
                    info, active_job, shift)
                db.session.add(active_job)
        db.session.add(shift)
        db.session.commit()

        return AddLocationsToShift(location=shift.locations[-1], ok=True)


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
            img_filename = os.path.join('/opt/images',
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
        shift_id = ID(
            required=True, description="ID of the shift to make a job in")

        start_location = LocationInput()
        employer = String()

    @login_required
    def mutate(self, info, shift_id, start_location, employer):
        print("creating job...")
        shift_id = from_global_id(shift_id)[1]
        shift = ShiftModel.query.filter_by(id=shift_id, user_id=g.user).first()

        employer = EmployerNames.INSTACART
        job = JobModel(
            shift_id=shift.id,
            lng=start_location.lng,
            lat=start_location.lat,
            user_id=shift.user_id,
            employer=employer
        )
        shift.jobs.append(job)

        db.session.add(shift)
        db.session.commit()
        return CreateJob(job=job, ok=True)


def get_job_mileage_and_geometry(info, job, shift=None):
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
        locs = sorted(job_locations, key=lambda l: l.timestamp)
        match_obj = get_route_distance_and_geometry(locs)

        if 'geom_obj' not in match_obj or not match_obj['geom_obj']:
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
        current_app.logger.info('adding matched geometry to job:')
        job.snapped_geometry = matched
        job.mileage = match_obj['distance']
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
        return SetJobTip(job, True)


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

        img_filename = os.path.join('/opt/signatures',
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


class Mutation(ObjectType):
    """Mutations which can be performed by this API."""

    # Person mutation
    createUser = CreateUser.Field()
    createShift = CreateShift.Field()
    endShift = EndShift.Field()
    createJob = CreateJob.Field()
    setJobTotalPay = SetJobTotalPay.Field()
    setJobTip = SetJobTip.Field()
    setJobMileage = SetJobMileage.Field()
    endJob = EndJob.Field()
    setShiftEmployers = SetShiftEmployers.Field()
    addLocationsToShift = AddLocationsToShift.Field()
    addScreenshotToShift = AddScreenshotToShift.Field()
    submitConsent = SubmitConsent.Field()
    submitIntroSurvey = SubmitIntroSurvey.Field()
    updateDataSharingConsent = UpdateDataSharingConsent.Field()
    updateInterviewConsent = UpdateInterviewConsent.Field()
    unenrollAndDelete = UnenrollAndDelete.Field()
