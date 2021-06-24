from flask import current_app
from api.graphql.object import Location
from api.models import Location as LocationModel
from geoalchemy2.shape import to_shape
from .osrmapi import get_match_for_locations, get_match_distance, get_match_geometry, match

def get_trajectory(locations):
    from geoalchemy2.shape import to_shape
    import numpy as np
    """locations: Location model objects"""
    records = []
    for l in locations:
        coords = to_shape(l.geom)
        records.append([coords.y, coords.x, int(l.timestamp.timestamp())])
    records = sorted(records, key=lambda r: r[2])
    return np.array(records)

def locs_to_df(locs):
    """ Returns a trajectory dataframe that represents the trajectory created from an array
    of Location databse objects.
    """
    import pandas as pd
    import numpy as np
    traj = get_trajectory(locs)

    data = pd.DataFrame(np.vstack((traj.T)).T)
    data.columns = ['lat', 'lng', 'time']
    data.time = data.time.astype('datetime64[s]')
    return data

def clean_trajectory(locs):
    """ Returns a trajectory dataframe from an array of Location database objects that has
    been compressed and filtered.
    """
    import skmob
    from skmob.preprocessing import compression, filtering, detection
    data = locs_to_df(locs)

    # filter and compress our location dataset
    tdf = skmob.TrajDataFrame(data, datetime='time')
    ftdf = filtering.filter(tdf, include_loops=True, speed_kmh=20)
    ctdf = compression.compress(ftdf, spatial_radius_km=0.1)
    return ctdf

def get_match_for_locations(locations):
    # I put clean_trajectory here because it's cheap to store more 
    # location data and processing it is not too expensive.
    traj_df = clean_trajectory(locations)
    coords = traj_df[['lat', 'lng']].to_dict(orient='records')
    res = match(coords).json()
    return res

###############

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

