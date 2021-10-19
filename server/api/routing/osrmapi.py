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

OSRM_URI = os.environ['OSRM_URI']

def match(coordinates):
    """Submits map match request to our osrm api

    coordinates: a list of {lat, lng} dicts
    """
    coord_str = requests.utils.quote(
        ';'.join([f'{c["lng"]},{c["lat"]}' for c in coordinates]))
    print("Match API coordinate string: {}".format(coord_str))
    # We don't include timestamps because they aren't really needed
    payload = {
        "geometries": "geojson",
        "gaps": "ignore",
        "overview": "full",
        "tidy": "true"}
    MATCH_URI = f'{OSRM_URI}/match/v1/car/{coord_str}'
    return s.post(MATCH_URI, params=payload)


def get_match_distance(res):
    """
    """
    # convert to mileage
    if 'matchings' in res:
        distances = [m['distance'] for m in res['matchings']]
        total_distance = sum(distances)
        mileage = total_distance * 0.0006213712
        return mileage
    return 0

def get_match_geometry(res):
    if 'matchings' in res:
        geometries = [m['geometry']['coordinates'] for m in res['matchings']]
        geometries = list(itertools.chain(*geometries))

        def bounding_box(points):
            x_coordinates, y_coordinates = zip(*points)
            return [min(x_coordinates), min(y_coordinates), max(x_coordinates), max(y_coordinates)]

        return (geometries, bounding_box(geometries))
    return False
