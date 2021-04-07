from graphene import Mutation, Float, DateTime, Field, String, Boolean, List, ID, ObjectType
from shapely import geometry
from datetime import datetime
from dateutil import parser
from flask import g
import base64
from api import db
from api.graphql.object import User, Shift, Location, LocationInput
from api.models import User as UserModel, Shift as ShiftModel, Location as LocationModel

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

    def mutate(self, info, active, **kwargs):
        user_id = g.user
        end_time = kwargs.get('end_time', None)
        start_time = kwargs.get('start_time', None)
        locations = kwargs.get('locations', [])
        if start_time:
            start_time = parser.parse(start_time)
        shift = ShiftModel(start_time=start_time,
                           end_time=end_time,
                           user_id=user_id,
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

    def mutate(self, info, shift_id):
        end_time = datetime.utcnow()
        shift = db.session.query(ShiftModel).get(shift_id)
        shift.end_time = end_time
        shift.active = False
        db.session.add(shift)
        db.session.commit()
        return EndShift(shift=shift)


class AddLocationsToShift(Mutation):
    """Adds a list of locations to a given shift"""
    shift = Field(lambda: Shift,
                  description="Shift that was updated")

    class Arguments:
        shift_id = ID(
            required=True, description="ID of the shift to add locations to")
        # locationinput should be lat,lng,timestamp
        locations = List(LocationInput)

    def mutate(self, info, shift_id, locations):

        shift = ShiftModel.query.filter_by(id=shift_id).first()
        # ensure the user owns this shift
        assert shift.user_id == g.user
        # TODO: throw a helpful error.
        for l in locations:
            shift.locations.append(LocationModel(
                datetime.fromtimestamp(float(l.timestamp)/1000), l.lng, l.lat, shift_id))
        db.session.add(shift)
        db.session.commit()
        return AddLocationsToShift(shift=shift)


class Mutation(ObjectType):
    """Mutations which can be performed by this API."""
    # Person mutation
    createUser = CreateUser.Field()
    createShift = CreateShift.Field()
    endShift = EndShift.Field()
    addLocationsToShift = AddLocationsToShift.Field()