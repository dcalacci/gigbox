import requests


OSRM_URI = "http://osrm:5000"


def match(coordinates):
    coord_str = requests.utils.quote(
        ';'.join([f'{c["lng"]},{c["lat"]}' for c in coordinates]))
    timestamp_str = requests.utils.quote(';'.join([f'{int(c["timestamp"].timestamp())}' for c in
                                                   coordinates]))
    payload = {'timestamps': timestamp_str}
    MATCH_URI = f'{OSRM_URI}/match/v1/car/{coord_str}'
    return requests.post(MATCH_URI, params=payload)
