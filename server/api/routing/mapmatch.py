import requests

from flask import current_app
from api.graphql.object import Location
from api.models import Location as LocationModel
from geoalchemy2.shape import to_shape

OSRM_URI = "http://osrm:5000"


def match(coordinates):
    coord_str = requests.utils.quote(
        ';'.join([f'{c["lng"]},{c["lat"]}' for c in coordinates]))
    timestamp_str = requests.utils.quote(';'.join([f'{int(c["timestamp"].timestamp())}' for c in
                                                   coordinates]))
    payload = {'timestamps': timestamp_str}
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
    # res_json = json.loads(res)
    if 'matchings' in res:
        total_distance = res['matchings'][0]['distance']
        return total_distance
    return 0
