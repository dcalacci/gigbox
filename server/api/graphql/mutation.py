from graphene import Mutation, Float, DateTime, Field, String, Boolean, List, ID, ObjectType
from graphql_relay.node.node import from_global_id
from shapely import geometry
from geoalchemy2.shape import to_shape
from datetime import datetime
from dateutil import parser
from flask import g, current_app
import json
import base64
from api import db
from api.controllers.auth.decorators import login_required
from api.graphql.object import User, Shift, Location, LocationInput, EmployerInput
from api.models import User as UserModel, Shift as ShiftModel, Location as LocationModel, Employer as EmployerModel, Geometry_WKT, _convert_geometry
from api.routing.mapmatch import match

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
    shift = Field(lambda: Shift,
                  description="Shift that was created")

    # For optional fields in graphene mutations, see:
    # https://github.com/graphql-python/graphene/issues/769#issuecomment-397596754
    class Arguments:
        start_time = String(required=False)
        end_time = String(required=False)
        active = Boolean(required=True)
        locations = List(LocationInput, required=False)

    @login_required
    def mutate(self, info, active, **kwargs):
        end_time = kwargs.get('end_time', None)
        start_time = kwargs.get('start_time', None)
        locations = kwargs.get('locations', [])
        if start_time:
            start_time = parser.parse(start_time)
        shift = ShiftModel(start_time=start_time,
                           end_time=end_time,
                           user_id=g.user,
                           active=active)
        for l in locations:
            shift.locations.append(Location(l.timestamp, l.lng, l.lat))
        db.session.add(shift)
        db.session.commit()
        return CreateShift(shift=shift)


class EndShift(Mutation):
    """Ends a shift"""
    shift = Field(lambda: Shift,
                  description="Shift that is being ended")

    class Arguments:
        shift_id = String(required=True, description="ID of the shift to end")

    @login_required
    def mutate(self, info, shift_id):
        print("SHIFT ID:", shift_id)
        shift_id = from_global_id(shift_id)[1]
        end_time = datetime.now()
        shift = db.session.query(ShiftModel).filter_by(
            id=shift_id, user_id=g.user).first()
        shift.end_time = end_time
        shift.active = False
        db.session.add(shift)
        db.session.commit()

        # locs = db.session.query(LocationModel).filter_by(
        #     shift_id=shift_id).order_by(LocationModel.timestamp.asc())
        # current_app.logger.info("Found locs...")
        # coords = [{'lat': to_shape(s.geom).y,
        #            'lng': to_shape(s.geom).x,
        #            'timestamp': s.timestamp} for s in locs]
        # res = match(coords).json()
        # print("matchings:", res.json()['matchings'])
        # print("tracepoints:", res.json()['tracepoints'])
        # # res_json = json.loads(res)
        # total_distance = res['matchings']['distance']

        return EndShift(shift=shift)


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

    @ login_required
    def mutate(self, info, shift_id, locations):
        shift_id = from_global_id(shift_id)[1]
        # ensure the user owns this shift
        shift = ShiftModel.query.filter_by(id=shift_id, user_id=g.user).first()
        # TODO: throw a helpful error.
        for l in locations:
            shift.locations.append(LocationModel(
                datetime.fromtimestamp(float(l.timestamp)/1000), l.lng, l.lat, shift_id))
        db.session.add(shift)
        db.session.commit()
        return AddLocationsToShift(location=shift.locations[-1], ok=True)


class SetShiftEmployers(Mutation):
    shift = Field(lambda: Shift,
                  description="Shift to update")

    class Arguments:
        shift_id = ID(
            required=True,
            description="ID of the shift to set employers for")
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
