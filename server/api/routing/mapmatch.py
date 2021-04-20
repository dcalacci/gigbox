import requests

from flask import current_app
from api.graphql.object import Location
from api.models import Location as LocationModel
from geoalchemy2.shape import to_shape
import itertools

OSRM_URI = "http://osrm:5000"


def match(coordinates):
    coord_str = requests.utils.quote(
        ';'.join([f'{c["lng"]},{c["lat"]}' for c in coordinates]))
    timestamp_str = requests.utils.quote(';'.join([f'{int(c["timestamp"].timestamp())}' for c in
                                                   coordinates]))
    payload = {'timestamps': timestamp_str,
               "geometries": "geojson"}
    MATCH_URI = f'{OSRM_URI}/match/v1/car/{coord_str}'
    return requests.post(MATCH_URI, params=payload)


def get_shift_distance(shift, info):
    locs = Location.get_query(info=info).filter(
        LocationModel.shift_id == shift.id).order_by(LocationModel.timestamp.asc())
    current_app.logger.info("Retrieving locations for shift ")
    # current_app.logger.info("Found locs...")
    coords = [{'lat': to_shape(s.geom).y,
               'lng': to_shape(s.geom).x,
               'timestamp': s.timestamp} for s in locs]

    res = match(coords).json()
    # print("matchings:", res.json()['matchings'])
    # print("tracepoints:", res.json()['tracepoints'])
    print("RESULT:", res)
    # res_json = json.loads(res)
    if 'matchings' in res:
        distances = [m['distance'] for m in res['matchings']]
        geometries = [m['geometry']['coordinates'] for m in res['matchings']]
        total_distance = sum(distances)
        return total_distance
    return 0


def get_shift_geometry(shift, info):
    print("Shift locations:", shift.locations)
    locs = sorted(shift.locations, key=lambda l: l.timestamp)

    # locs = Location.get_query(info=info).filter(
    #     LocationModel.shift_id == shift.id).order_by(LocationModel.timestamp.asc())
    if len(locs) == 0:
        return False
    current_app.logger.info(
        "Retrieving locations for shift {}".format(shift.id))
    # current_app.logger.info("Found locs...")
    coords = [{'lat': to_shape(s.geom).y,
               'lng': to_shape(s.geom).x,
               'timestamp': s.timestamp} for s in locs]

    res = match(coords).json()
    # print("matchings:", res.json()['matchings'])
    # print("tracepoints:", res.json()['tracepoints'])
    # res_json = json.loads(res)
    print("Match result:", res)
    if 'matchings' in res:
        geometries = [m['geometry']['coordinates'] for m in res['matchings']]

        geometries = list(itertools.chain(*geometries))

        def bounding_box(points):
            x_coordinates, y_coordinates = zip(*points)
            return [min(x_coordinates), min(y_coordinates), max(x_coordinates), max(y_coordinates)]

        return (geometries, bounding_box(geometries))
    return False
