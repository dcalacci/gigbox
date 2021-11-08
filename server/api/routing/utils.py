
def meters_to_miles(x):
    return x * 0.0006213712

def _get_trajectory_from_location_objects(locations):
    from geoalchemy2.shape import to_shape
    import numpy as np
    import pandas as pd
    """
    Returns a trajectory dataframe that represents the trajectory created from an array of Location objects

    Parameters
    ----------
    locations : list
        Locations to turn into a TrajDataFrame

    Returns
    -------
    TrajDataFrame
        Trajectory dataframe that represents the given locations
    """
    records = []
    for l in locations:
        try:
            coords = to_shape(l.geom)
            records.append([coords.y, coords.x, pd.to_datetime(l.timestamp)])
        except Exception as e:
            print("Problem translating location into shape. Location:",
                  l, ". Exception:", e)
    # sort by timestamp
    traj = np.array(sorted(records, key=lambda r: r[2]))
    print("trajectory of length: ", len(traj))
    data = pd.DataFrame(np.vstack((traj.T)).T)
    data.columns = ['lat', 'lng', 'timestamp']
    return data


def clean_trajectory(locs):
    """
    Cleans and filters a list of Location objects, and processes into a TrajDataFrame

    It filters out points that have a max speed of over 500kmh, and compresses trajectory data within a radius of 0.05km.

    Parameters
    ----------
    locs : list
        Locations to clean, filter, and transform into TrajDataFrame

    Returns
    -------
    TrajDataFrame
        Cleaned and filtered trajectory dataframe
    """    

    from skmob import TrajDataFrame
    from skmob.preprocessing import compression, filtering, detection
    data = _get_trajectory_from_location_objects(locs)

    # filter and compress our location dataset
    tdf = TrajDataFrame(data, datetime='timestamp')
    ftdf = filtering.filter(tdf, max_speed_kmh=500.)
    print("filtered {} locs from trajectory of length {}".format(
        len(tdf) - len(ftdf), len(tdf)))
    print("compressed trajectory is length {}".format(len(tdf)))
    return tdf



def bounding_box(points):
    """
    Computes a bounding box from a list of coordinates

    Parameters
    ----------
    points : list
        List of coordinates in the form of [[x,y], ...]

    Returns
    -------
    list
        A 4-tuple consisting of [xmin, ymin, xmax, ymax]
    """    
    x_coordinates, y_coordinates = zip(*points)
    return [min(x_coordinates), min(y_coordinates), max(x_coordinates), max(y_coordinates)]


def avg_speed(tdf):
    from skmob.utils import gislib
    """
    Calculate average speed in meters/second of a raw trajectory

    Returns
    -------
    float
        Average speed between points in the given TrajDataFrame in m/s.
    """    
    temp_df = tdf.copy()
    temp_df['prev_lat'] = temp_df.lat.shift()
    temp_df['prev_lng'] = temp_df.lng.shift()
    temp_df['dist'] = [gislib.getDistance(r[1][['lat','lng']], r[1][['prev_lat', 'prev_lng']]) for r in temp_df.iterrows()]
    temp_df['dt'] = (temp_df.datetime - temp_df.datetime.shift()).apply(lambda dt: float(dt.seconds))
    if len(temp_df) == 0:
        return 0.
    temp_df['speed_ms'] = temp_df['dist'] / temp_df['dt']
    return temp_df.speed_ms.mean()
