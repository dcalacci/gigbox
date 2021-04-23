import os
import random
import cv2
import pytesseract
import numpy as np
import json
import base64
import binascii
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
from api import db
from api.controllers.auth.decorators import login_required
from api.graphql.object import (
    User,
    Shift,
    Location,
    LocationInput,
    EmployerInput,
    Employer,
    Screenshot
)
from api.models import (
    User as UserModel,
    Shift as ShiftModel,
    Location as LocationModel,
    Employer as EmployerModel,
    Screenshot as ScreenshotModel,
    Geometry_WKT,
    _convert_geometry,
    EmployerNames,
)
from api.utils import generate_filename
from api.routing.mapmatch import get_shift_distance, get_shift_geometry
from api.screenshots.parser import predict_app, image_to_df, parse_image
from flask import current_app

# we use a traditional REST endpoint to create JWT tokens and for first login
# So, honestly, unsure if we need a Createuser mutation. We will only ever create
# users from the server anyway.

# All requests are associated with a token.
# TODO: How can we augment each mutation with a JWT token to make sure they are authorized?
# Check out get_jwt_identity here: https://dev.to/curiouspaul1/graphql-by-example-with-graphene-flask-and-fauna-jio


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

    shift = Field(lambda: Shift, description="Shift that was created")

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

    shift = Field(lambda: Shift, description="Shift that is being ended")

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

        # calculate final mileage for this shift
        shift = updateShiftMileage(shift, info)
        shift = addRouteLineToShift(shift, info)
        shift.end_time = end_time
        shift.active = False
        db.session.add(shift)
        db.session.commit()

        return EndShift(shift=shift)


def addRouteLineToShift(shift, info):
    match_result = get_shift_geometry(shift, info)
    if not match_result:
        # TODO: raise error
        current_app.logger.error(f'Failed to match a route to shift...')

    bb = match_result[1]
    bounding_box = {'minLat': bb[1],
                    'minLng': bb[0],
                    'maxLat': bb[3],
                    'maxLng': bb[2]}
    matched = {'geometries': match_result[0], 'bounding_box': bounding_box}
    current_app.logger.info('adding matched geometry to shift:')
    print(matched)
    shift.snapped_geometry = matched
    current_app.logger.info(f'matched route added to shift...')
    return shift


def updateShiftMileage(shift, info):
    meters = get_shift_distance(shift, info)
    mileage = meters * 0.0006213712
    shift.road_snapped_miles = mileage
    current_app.logger.info(f"mileage: {mileage}")
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
        # Every 5 locations added, update the distance on the shift by doing
        # map matching
        n_locations = len(shift.locations)
        if n_locations % 5 == 0:
            current_app.logger.info(
                "Updating mileage & calculated route on shift...")
            shift = updateShiftMileage(shift, info)
            shift = addRouteLineToShift(shift, info)
        db.session.add(shift)
        db.session.commit()
        return AddLocationsToShift(location=shift.locations[-1], ok=True)


class AddScreenshotToShift(Mutation):
    class Arguments:
        shift_id = ID(required=True)
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
    shift_id = Field(lambda: ID)
    screenshot = Field(lambda: Screenshot,
                       description="Screenshot that was created.")

    @login_required
    def mutate(self, info, shift_id, asset, device_uri, timestamp, **kwargs):
        shift_id = from_global_id(shift_id)[1]
        # Decode base64 image
        decoded = base64.decodebytes(bytes(asset, 'utf-8'))
        f_array = np.asarray(bytearray(decoded))
        # Write image to disk
        image = cv2.imdecode(f_array, 0)
        # gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        text = parse_image(image)
        app = predict_app(text)

        # IMAGE_DIR = current_app.config.IMAGE_DIR
        if app:
            img_filename = os.path.join('/opt/images',
                                        generate_filename(shift_id))
            print("IMAGE FILENAME:", img_filename)
            cv2.imwrite(img_filename, image)
            print("Wrote to file...")
            screenshot = ScreenshotModel(
                shift_id=shift_id,
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
                shift_id=shift_id,
                screenshot=screenshot
            )
        else:
            print("Not an app screenshot. Not saving...")
            return AddScreenshotToShift(
                success=False,
                isApp=False,
            )


class SetShiftEmployers(Mutation):
    shift = Field(lambda: Shift, description="Shift to update")

    class Arguments:
        shift_id = ID(
            required=True, description="ID of the shift to set employers for")
        employers = List(EmployerInput)

    def mutate(self, info, shift_id, employers):
        shift_id = from_global_id(shift_id)[1]
        shift = db.session.get(shift_id)
        assert shift.user_id == g.user
        for e in employers:
            shift.employers.append(EmployerModel(
                name=e.name, shift_id=shift.id))
        db.session.add(shift)
        db.session.commit()
        return SetShiftEmployers()


class Mutation(ObjectType):
    """Mutations which can be performed by this API."""

    # Person mutation
    createUser = CreateUser.Field()
    createShift = CreateShift.Field()
    endShift = EndShift.Field()
    addLocationsToShift = AddLocationsToShift.Field()
    addScreenshotToShift = AddScreenshotToShift.Field()
