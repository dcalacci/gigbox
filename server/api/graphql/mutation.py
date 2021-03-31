from graphene import Mutation, Float, DateTime, Field, String, Boolean, List, ID, ObjectType
from shapely import geometry
from datetime import datetime
from api.graphql.object import User, Shift, Location, LocationInput
from api.database.model import User as UserModel, Shift as ShiftModel, Location as LocationModel
from api.database.base import db_session


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

        db_session.add(user)
        db_session.commit()
        return CreateUser(user=user)


class CreateShift(Mutation):
    """Creates a shift"""
    shift = Field(lambda: Shift,
                  description="Shift that was created")

    # For optional fields in graphene mutations, see:
    # https://github.com/graphql-python/graphene/issues/769#issuecomment-397596754
    class Arguments:
        start_time = String(required=True)
        end_time = String(required=False)
        active = Boolean(required=True)
        locations = List(LocationInput)

    def mutate(self, info, start_time, active, locations, **kwargs):
        end_time = kwargs.get('end_time', None)
        shift = Shift(start_time=start_time,
                      end_time=end_time,
                      active=active)
        for l in locations:
            shift.locations.append(Location(l.timestamp, l.lng, l.lat))
        db_session.add(shift)
        db_session.commit()
        return CreateShift(shift=shift)


class EndShift(Mutation):
    """Ends a shift"""
    shift = Field(lambda: Shift,
                  description="Shift that is being ended")

    class Arguments:
        shift_id = ID(required=True, description="ID of the shift to end")

    def mutate(self, info, shift_id):
        end_time = datetime.utcnow()
        shift = db_session.query(ShiftModel).get(id=shift_id)
        shift.end_time = end_time
        db_session.add(shift)
        db_session.commit()
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
        shift = db_session.query(ShiftModel).get(id=shift_id)
        for l in locations:
            shift.locations.append(Location(l.timestamp, l.lng, l.lat))
        db_session.add(shift)
        db_session.commit()
        return AddLocationsToShift(shift=shift)


class Mutation(ObjectType):
    """Mutations which can be performed by this API."""
    # Person mutation
    createUser = CreateUser.Field()
    createShift = CreateShift.Field()
    endShift = EndShift.Field()
    addLocationsToShift = AddLocationsToShift.Field()
