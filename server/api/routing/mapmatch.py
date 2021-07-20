from api.graphql.object import Location
from api.models import Location as LocationModel
from geoalchemy2.shape import to_shape
import logging
from .osrmapi import get_match_distance, get_match_geometry, match


def _get_trajectory_from_location_objects(locations):
    from geoalchemy2.shape import to_shape
    import numpy as np
    import pandas as pd
    """ Returns a trajectory dataframe that represents the trajectory created from an array
    of Location databse objects.

    locations: array of Location model objects
    """
    records = []
    for l in locations:
        coords = to_shape(l.geom)
        records.append([coords.y, coords.x, int(l.timestamp.timestamp())])
    # sort by timestamp
    traj = np.array(sorted(records, key=lambda r: r[2]))
    data = pd.DataFrame(np.vstack((traj.T)).T)
    data.columns = ['lat', 'lng', 'timestamp']
    # timestamps in DB are seconds
    data.timestamp = pd.to_datetime(data.timestamp, unit='s')
    return data


def clean_trajectory(locs):
    """ Returns a trajectory dataframe from an array of Location database objects that has
    been compressed and filtered.
    """
    from skmob import TrajDataFrame
    from skmob.preprocessing import compression, filtering, detection
    data = _get_trajectory_from_location_objects(locs)

    # filter and compress our location dataset
    tdf = TrajDataFrame(data, datetime='timestamp')
    ftdf = filtering.filter(tdf, max_speed_kmh=500.)
    print("filtered {} locs from trajectory of length {}".format(
        len(tdf) - len(ftdf), len(tdf)))
    ctdf = compression.compress(tdf, spatial_radius_km=0.05)
    print("compressed trajectory is length {}".format(len(ctdf)))
    return ctdf


def get_match_for_locations(locations):
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


###############

def get_route_distance_and_geometry(locs_or_traj):
    from skmob.core import trajectorydataframe

    print("getting match for", len(locs_or_traj), "locations...")
    try:
        if (type(locs_or_traj) == trajectorydataframe.TrajDataFrame):
            res = get_match_for_trajectory(locs_or_traj)
        else:
            res = get_match_for_locations(locs_or_traj)
    except ConnectionError as e:
        return {'status': 'error',
                'message': 'Connection error.'}

    if res['code'] == 'TooBig':
        logging.error('Trace too large')
        return {'status': 'error',
                'message': 'trace too large'}
    elif 'matchings' not in res:
        logging.error("Failed to match route")
        return {'status': 'error',
                'message': 'failed to match route'}
    else:
        distance = get_match_distance(res)
        geom_obj = get_match_geometry(res)
        return {"status": "ok",
                "distance": distance,
                "geom_obj": geom_obj}


############ Stops and trips

def clean_and_get_stops(locations):
    from skmob.preprocessing import detection
    ctdf = clean_trajectory(locations)

    stdf = detection.stops(ctdf, minutes_for_a_stop=2, no_data_for_minutes=120)
    return (ctdf, stdf)


def _merge_short_trips(trips, trip_bookends, min_distance_mi=0.5):
    """Merges short (under min_distance_mi) trips

    Args:
        trips (tuple: (traj_df, stop_df, [distances])): 3-tuple list of trips already extracted from a trajectory.
        trip_bookends ([type]): [description]
        min_distance_mi (float, optional): [description]. Defaults to 0.5.

    Returns:
        (tuple: (traj_df, stop_df, [distances])): 3-tuple list of merged trips extracted from a trajectory.
    """
    from api.routing.osrmapi import get_match_distance
    import pandas as pd
    matches = [get_match_for_trajectory(trip) for n, trip in enumerate(trips)]
    dists = [get_match_distance(m) for m in matches]
    merged_trips = []
    for n, d in enumerate(dists):
        # if last merged trip has same endpoint as this one, skip this one; it's been merged
        if n > 0 and (merged_trips[-1][1]['stop']['datetime'] == trip_bookends[n]['stop']['datetime']):
            continue
        elif d <= min_distance_mi and n > 0:
            newtrip = pd.concat([trips[n-1], trips[n]])
            newtrip_bookends = {
                'start': trip_bookends[n-1]['start'], 'stop': trip_bookends[n]['stop']}
            merged_trips = merged_trips[:-1]  # remove last entry
            merged_trips.append(
                (newtrip, newtrip_bookends, d + dists[n-1]))  # replace it
        elif d <= min_distance_mi and n == 0:
            newtrip = pd.concat([trips[n], trips[n+1]])
            newtrip_bookends = {
                'start': trip_bookends[n]['start'], 'stop': trip_bookends[n+1]['stop']}
            merged_trips.append((newtrip, newtrip_bookends, d + dists[n+1]))
        else:
            merged_trips.append((trips[n], trip_bookends[n], d))
    return merged_trips


def _match_path_and_stops(trips, trip_bookends):
    import itertools
    import pandas as pd
    matches = [get_match_for_trajectory(trip) for trip in trips]
    all_locs = []
    for m in matches:
        geometries = [mm['geometry']['coordinates'] for mm in m['matchings']]
        geometries = itertools.chain(*geometries)
        all_locs.append(pd.DataFrame(geometries, columns=['lng', 'lat']))
    return zip(trips, matches, all_locs, trip_bookends)


def split_into_trips(traj_df, stop_df, min_trip_dist_mi=0.5):
    """Returns a list of (traj_df, [{'start', 'stop}]) tuples
    """
    trips = []
    trip_bookends = []

    start = traj_df.iloc[0]
    start['leaving_datetime'] = start.datetime
    end = traj_df.iloc[-1]
    end['leaving_datetime'] = end.datetime

    print("total number of stops: {}".format(len(stop_df)))

    if len(stop_df) == 0:
        # no stops, just a trip, so return the first location and last location of
        # our trajectory as "stops"
        print("No stops, returning one trip")
        trip_bookends.append({'start': start, 'stop': end})
        trips.append(traj_df)
    else:
        # Otherwise, extract between-stop trajectories and stops ("bookends").
        # datetime is the beginning of a stop, while leaving_datetime is the end of a stop.
        # we don't include points within a stop in our final trajectory because we don't
        # want to include points in a "stop" for map matching.

        # dt is
        for n, time_arrived_at_stop in enumerate(stop_df.datetime):
            if n == 0:
                first_trip = traj_df[(traj_df.datetime <= time_arrived_at_stop) & (
                    traj_df.datetime >= start.datetime)]
                trips.append(first_trip)
                trip_bookends.append({
                    'start': start,
                    'stop': stop_df.iloc[n]})
            else:
                trip = traj_df[(traj_df.datetime <= time_arrived_at_stop) & (
                    traj_df.datetime >= stop_df.iloc[n-1].leaving_datetime)]
                trips.append(trip)
                trip_bookends.append({
                    'start': stop_df.iloc[n-1],
                    'stop': stop_df.iloc[n]})

        # add final trip (from last stop to last location)
        final_trip = traj_df[(traj_df.datetime >=
                              stop_df.iloc[-1].leaving_datetime)]
        trip_bookends.append({'start': stop_df.iloc[-1], 'stop': end})
        trips.append(final_trip)

    if len(trips) > 1 and len(trip_bookends) > 1:
        merged_trips = _merge_short_trips(
            trips, trip_bookends, min_trip_dist_mi)
        logging.info("Merged trips df:")
        logging.info(merged_trips)
        return merged_trips
    else:
        match = get_match_for_trajectory(trips[0])
        dist = get_match_distance(match)
        return list(zip(trips, trip_bookends, [dist]))


def get_trips_from_locations(locations,
                             min_trip_dist_mi=1.,
                             minutes_for_stop=5,
                             no_data_for_minutes=120):
    """ Returns trips in a 2-tuple, each a list of:
    - trajectory_df
    - {'stop', 'start'} (lat, lng, datetime series)
    """
    from skmob.preprocessing import detection
    logging.info("Extracting trips from {} locations".format(len(locations)))
    traj_df = clean_trajectory(locations)

    stop_df = detection.stops(traj_df,
                              minutes_for_a_stop=minutes_for_stop,
                              no_data_for_minutes=no_data_for_minutes)

    return split_into_trips(
        traj_df,
        stop_df,
        min_trip_dist_mi=min_trip_dist_mi)
