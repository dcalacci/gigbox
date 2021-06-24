from flask import current_app
from api.graphql.object import Location
from api.models import Location as LocationModel
from geoalchemy2.shape import to_shape
from .osrmapi import get_match_for_locations, get_match_distance, get_match_geometry, match

def get_match_for_locations(locations):
    coords = [{'lat': to_shape(s.geom).y,
               'lng': to_shape(s.geom).x
               # 'timestamp': s.timestamp ## remove -- not needed for mileage and route matching
               } for s in locations]

    return match(coords).json()


def get_shift_distance(shift, info):
    locs = Location.get_query(info=info).filter(
        LocationModel.shift_id == shift.id).order_by(LocationModel.timestamp.asc())
    current_app.logger.info("Retrieving locations for shift ")
    # current_app.logger.info("Found locs...")
    res = get_match_for_locations(locs)
    return get_match_distance(res)


def get_shift_geometry(shift, info):
    # print("Shift locations:", shift.locations)
    current_app.logger.info("Retrieving shift geometry...")
    locs = sorted(shift.locations, key=lambda l: l.timestamp)

    # locs = Location.get_query(info=info).filter(
    #     LocationModel.shift_id == shift.id).order_by(LocationModel.timestamp.asc())
    if len(locs) == 0:
        return False
    current_app.logger.info(
        "Retrieving locations for shift {}".format(shift.id))
    # current_app.logger.info("Found locs...")
    res = get_match_for_locations(locs)
    return get_match_geometry(res)
    return False
