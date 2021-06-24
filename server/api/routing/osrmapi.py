import requests
from requests.exceptions import ConnectionError
from flask import current_app
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
import os
import itertools

# retry and backoff a 0.1, 0.2, ... 0.5 on retry
s = requests.Session()
retries = Retry(total=5,
                backoff_factor=0.1,
                status_forcelist=[ 500, 502, 503, 504 ])

s.mount('http://', HTTPAdapter(max_retries=retries))

# OSRM_URI = "http://osrm:5000"
OSRM_URI = os.environ['OSRM_URI']

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


