import requests
from requests.exceptions import ConnectionError
from flask import current_app
from api.graphql.object import Location
from api.models import Location as LocationModel
from geoalchemy2.shape import to_shape
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
import itertools

# retry and backoff a 0.1, 0.2, ... 0.5 on retry
s = requests.Session()
retries = Retry(total=5,
                backoff_factor=0.1,
                status_forcelist=[ 500, 502, 503, 504 ])

s.mount('http://', HTTPAdapter(max_retries=retries))

OSRM_URI = "http://osrm:5000"

def match(coordinates):
    coord_str = requests.utils.quote(
        ';'.join([f'{c["lng"]},{c["lat"]}' for c in coordinates]))
    # timestamp_str = requests.utils.quote(';'.join([f'{int(c["timestamp"].timestamp())}' for c in
    #                                                coordinates]))
    payload = {  # 'timestamps': timestamp_str,
        "geometries": "geojson",
        "tidy": "true"}
    MATCH_URI = f'{OSRM_URI}/match/v1/car/{coord_str}'
    return s.post(MATCH_URI, params=payload)


def get_match_for_locations(locations):
    coords = [{'lat': to_shape(s.geom).y,
               'lng': to_shape(s.geom).x
               # 'timestamp': s.timestamp ## remove -- not needed for mileage and route matching
               } for s in locations]

    return match(coords).json()


def get_match_distance(res):
    """gets route distance from a list of Location objects
    """
    if 'matchings' in res:
        distances = [m['distance'] for m in res['matchings']]
        geometries = [m['geometry']['coordinates'] for m in res['matchings']]
        total_distance = sum(distances)
        mileage = total_distance * 0.0006213712
        return mileage
    return 0


def get_match_geometry(res):
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


def get_route_distance_and_geometry(locations):
    try:
        res = get_match_for_locations(locations)
    except ConnectionError as e:
        return {'status': 'error',
                'message': 'Connection error.'}

    if res['code'] == 'TooBig':
        return {'status': 'error',
                'message': 'trace too large'}
    elif 'matchings' not in res:
        return {'status': 'error',
                'message': 'failed to match route'}
    else:
        distance = get_match_distance(res)
        geom_obj = get_match_geometry(res)
        return {"status": "ok",
                "distance": distance,
                "geom_obj": geom_obj}


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
