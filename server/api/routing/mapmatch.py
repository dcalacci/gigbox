from skmob.core.trajectorydataframe import TrajDataFrame
from api.graphql.object import Location
from api.models import Location as LocationModel
from geoalchemy2.shape import to_shape
from collections import namedtuple
import logging
from .utils import bounding_box, clean_trajectory
from .osrmapi import get_match_distance, get_match_geometry, match, route

MatchResult = namedtuple(
    'MatchResult',
    ['trajectory', 'geometry', 'distance', 'bbox']
)
MatchResult.__doc__ = '''
A matched route result. 

trajectory - a matched trajectory as a TrajDataFrame
geometry - the matched trajectory as a list of x,y coordinates [[x,y], ...]
distance - the total distance of the matched trajectory
bbox - bounding box of matched trajectory
'''

GeometryResult = namedtuple(
    'GeometryResult',
    ['status', 'result', 'message']
)
GeometryResult.__doc__ = '''
A matched geometry result.
status - 'ok' if successful, 'error' otherwise.
result - a MatchResult namedtuple if successful, None otherwise
message - Error message if unsuccessful, 'Success' otherwise
'''

############ Stops and trips

def get_trips_from_locations(locations,
                             min_trip_dist_mi=1.,
                             minutes_for_stop=5,
                             no_data_for_minutes=60):
    """
    Compute a series of "trips" from a list of location objects.

    Each trip is a 2-tuple of a TrajDataFrame and a StopDataFrame, where the 
    TrajDataFrame represents the trajectory itself, and the StopDataFrame represents
    the start and stop locations of that "trip".


    Parameters
    ----------
    locations : list
        list of Location objects to use
    min_trip_dist_mi : float, optional
        Trips shorter than this distance will be merged, by default 1.
    minutes_for_stop : float, optional
        Minimum number of minutes for a stop, by default 10.
    no_data_for_minutes : int, optional
        Number of minutes of no data to consider when calculating stops, by default 60

    Returns
    -------
    list
        list of 2-tuples of the form [(TrajDataFrame, StopDataFrame), ...]
    """
    from skmob.preprocessing import detection
    import pandas as pd
    logging.info("Extracting trips from {} locations".format(len(locations)))
    traj_df = clean_trajectory(locations)

    stop_df = detection.stops(traj_df,
                              min_speed_kmh=20.,
                              stop_radius_factor=0.5,
                              minutes_for_a_stop=minutes_for_stop,
                              spatial_radius_km=0.5,  # 1/2mi
                              no_data_for_minutes=no_data_for_minutes)

    sdf = pd.concat([
        pd.DataFrame(
            traj_df.iloc[0][['lat', 'lng', 'datetime']]).T,
        stop_df,
        pd.DataFrame(
            traj_df.iloc[-1][['lat', 'lng', 'datetime']]).T]).reset_index(drop=True)


    shifted_df = sdf.copy()
    shifted_df.leaving_datetime = sdf.leaving_datetime.shift()
    intervals = shifted_df[['leaving_datetime', 'datetime']].values

    # extract trajectories within intervals
    trajectories = [TrajDataFrame(
        pd.concat([
            # only include stop in beginning if it's not the first
            pd.DataFrame(
                sdf.iloc[n-1][['lat', 'lng', 'datetime']]).T if n > 0 else None,
            # intermediate trajectory
            traj_df.set_index('datetime')[i[0]:i[1]].reset_index(),
            # and the stop that ends this segment
            pd.DataFrame(sdf.iloc[n][['lat', 'lng', 'datetime']]).T]).reset_index(drop=True))
        for n, i in enumerate(intervals)]

    return {'trajectories': trajectories, 'stops': sdf}

###############


def get_match_for_locations(locations):
    """
    Computes a map-match result for a list of Locations

    Parameters
    ----------
    locations : list
        List of Location objects to calculate a map match for

    Returns
    -------
    dict
        Dict response from the OSRM map matching API. 
    """
    # I put clean_trajectory here because it's cheap to store more
    # location data and processing it is not too expensive.
    traj_df = clean_trajectory(locations)
    coords = traj_df[['lat', 'lng']].to_dict(orient='records')
    print("Sending {} coords to match api...".format(len(coords)))
    res = match(coords).json()
    return res


def get_match_for_trajectory(traj_df):
    coords = traj_df[['lat', 'lng']].to_dict(orient='records')
    res = match(coords).json()
    return res


def get_route_for_trajectory(traj_df):
    coords = traj_df[['lat', 'lng']].to_dict(orient='records')
    res = route(coords).json()
    return res


def get_matched_trajectory(trajectory):
    """
    Generates a "matched" version of a trajectory.

    Trajectories that cannot be map-matched with over 50% confidence
    are instead simply routed using shortest-distance routing 
    on OpenStreetMap using the first and last points of the trajectory.

    Parameters
    ----------
    trajectory : TrajDataFrame
        TrajDataFrame to map-match

    Returns
    -------
    MatchResult
        namedtuple containing the following keys:

        trajectory: TrajDataFrame of the matched trajectory
        geometry: Full geometry as [[x,y], ...] of the matched trajectory
        distance: Total distance of the matched trajectory
        bbox: Bounding box of the matched trajectory

    Examples
    --------
    >>> tdf = TrajDataFrame(coordinates)
    >>> match_result = get_matched_trajectory(tdf)

    Notes
    -----
    Sometimes, the map matching service can only match part of a given trajectory. 
    In these cases, we match those parts that have over 50% confidence, and then
    route others.
    """
    import itertools
    import numpy as np
    import pandas as pd
    m = get_match_for_trajectory(trajectory)
    all_geometries = []
    all_dists = []
    last_match_end_point = None
    if 'matchings' not in m:
        r = get_route_for_trajectory(trajectory.iloc[[0, -1]])
        route_res = r['routes'][0]
        all_geometries.append(route_res['geometry']['coordinates'])
        all_dists.append(route_res['distance'])
    else:
        for match in m['matchings']:
            coordinates = match['geometry']['coordinates']
            # if low confience, just route between a start and end.
            if match['confidence'] <= 50:
                if len(m['matchings']) == 1:
                    # if length of matchings is 1 in total, just do a route on the trajectory
                    r = get_route_for_trajectory(trajectory.iloc[[0, -1]])
                else:
                    print("last match endpoint:",
                          last_match_end_point, len(coordinates))
                    if last_match_end_point is None:
                        coords_to_route = coordinates
                    else:
                        coords_to_route = [last_match_end_point] + coordinates
                    last_match_end_point = coords_to_route[-1]
                    r = route([{'lat': c[1], 'lng': c[0]} for c in [
                              coords_to_route[0], coords_to_route[-1]]]).json()
                route_res = r['routes'][0]
                all_geometries.append(route_res['geometry']['coordinates'])
                all_dists.append(route_res['distance'])
            else:
                all_geometries.append(coordinates)
                all_dists.append(match['distance'])
                last_match_end_point = coordinates[-1]
    all_geometries = list(itertools.chain(*all_geometries))
    locs = pd.DataFrame(all_geometries, columns=['lng', 'lat'])
    locs['datetime'] = np.arange(0, len(locs))

    return MatchResult(trajectory=TrajDataFrame(locs),
                       geometry=all_geometries,
                       distance=sum(all_dists),
                       bbox=bounding_box(all_geometries))


def get_route_geometry(locs_or_traj):
    """
    Computes a map-matched geometry for a list of locations or TrajDataFrame

    Parameters
    ----------
    locs_or_traj : list | TrajDataFrame
        Either a list of coordinates in the form of [[x,y], ...] or a TrajDataFrame to map-match

    Returns
    -------
    GeometryResult
        A namedtuple with three keys:
        status: 'error' if the server could not match the route, and 'ok' otherwise.
        result: a dict with keys 'trajectory', 'geometry', 'distance' and 'bbox' if there was a successful match and None otherwise.
        message: Message summarising result.
    """
    from skmob.core import trajectorydataframe
    import pandas as pd

    print("getting match for", len(locs_or_traj), "locations...")
    try:
        if (type(locs_or_traj) == trajectorydataframe.TrajDataFrame or
                type(locs_or_traj) == pd.DataFrame):
            res = get_matched_trajectory(locs_or_traj)
        else:  # it's a list of locations
            traj_df = clean_trajectory(locs_or_traj)
            res = get_matched_trajectory(traj_df)
    except ConnectionError as e:
        return GeometryResult(status='error', result=None, message='Connection Error')
    if res.geometry == []:
        logging.error("Failed to match route")
        return GeometryResult(status='error',
                              result=None,
                              message="Failed to match route")
    else:
        return GeometryResult(status='ok', result=res, message='Success')


def segment_and_match(trajdf):
    trips = get_trips_from_locations()
