import os
import unittest
import pytest

from flask import current_app, request
import pandas as pd
from datetime import datetime, timedelta
from graphene.test import Client
from api import create_app, db
from api.schema import schema
from api.controllers.auth.utils import create_jwt
from api.controllers.auth.utils import create_jwt, decode_jwt, get_otp


class ApiTestCase(unittest.TestCase):

    def setUp(self):
        os.environ['ENV'] = 'TESTING'
        self.app = create_app()
        self.client = self.app.test_client()
        self.gqlClient = Client(schema)

        with self.app.app_context():
            db.session.close()
            db.drop_all()
            db.create_all()


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def gqlClient():
    return Client(schema)


@pytest.fixture
def token(app, client):
    """returns a valid token for testing requests"""
    with app.app_context():
        otp = get_otp(current_app.config['TESTING_TO_NUMBER'])
        res = client.post('/api/v1/auth/verify_otp',
                          data={'phone': current_app.config['TESTING_TO_NUMBER'],
                                'otp': otp})
        obj = res.get_json()
        return obj['token']


@pytest.fixture
def active_shift(app, token, gqlClient):
    """returns the currently active shift if it exists"""
    with app.test_request_context():
        request.headers = {'authorization': token}
        query = '''mutation CreateShift($Active: Boolean!, $StartTime: String) {
        createShift(active: $Active, startTime: $StartTime) {
        shift { id startTime active }
        }
        }
        '''
        vars = {
            'StartTime': (datetime.now() - timedelta(hours=5)).strftime('%Y-%m-%d %H:%M:%S'),
            'Active': True
        }
        res = gqlClient.execute(query, context_value=request, variables=vars)
        print("query result:", res)
        assert res['data']['createShift']['shift']['active']
        shift = res['data']['createShift']['shift']
        return shift


@pytest.fixture
def locs():
    """test locations, collected from some simulations and driving by Dan"""
    import pandas as pd
    return pd.read_csv("tests/locs.csv", index_col=0, parse_dates=['time'])


@pytest.fixture
def exodus_locs():
    """test locations from a one-trip drive to Exodus"""
    import pandas as pd
    return pd.read_csv("tests/exodus.csv", index_col=0, parse_dates=['time'])


@pytest.fixture
def long_stop_test_locs():
    """test locations from a one-trip drive to Exodus"""
    import pandas as pd
    return pd.read_csv("tests/trip_with_lingering_stop.csv", index_col=0, parse_dates=['timestamp']).rename({'timestamp': 'time'}, axis=1)


def add_locations_to_shift(token, locs, active_shift, gqlClient,
                           start_n_mins_after_shift=10, trip='default'):
    """Adds locs to shift active_shift. Adds in same order and time, but begins records
    `start_n_mins_after_shift` after the shift started.

    if trip is 'exodus', loads exodus test trip locations
    """
    request.headers = {'authorization': token}
    query = '''mutation AddLocations($ShiftId: ID!, $Locations: [LocationInput]!) {
    addLocationsToShift(shiftId: $ShiftId, locations: $Locations) {
        location {
            geom
            timestamp
        }
        ok
    }
}
    '''
    # add all locations not just first!
    locations = locs.to_dict(orient='records')
    locs_to_add = []
    shift_start = pd.to_datetime(active_shift['startTime'])
    # shift_start = datetime.strptime(active_shift['startTime'],
    #         "%Y-%m-%d %H:%M:%S")
    # this for loop replicates the time difference in our set of recorded locations
    # but updates the actual time to be consistent with our test 'active_shift'.
    for n, l in enumerate(locations):
        ll = {
            'lat': l['lat'],
            'lng': l['lng'],
            'accuracy': 5
        }
        if n == 0:
            # if it's the first, just use 10 mins after shift start
            ll['timestamp'] = shift_start + \
                timedelta(minutes=start_n_mins_after_shift)
        else:
            # otherwise, add calculated time difference to last added loc
            td = l['time'] - locations[n-1]['time']  # diff from last timestamp
            ll['timestamp'] = (locs_to_add[-1]['timestamp'] + td)
        locs_to_add.append(ll)

    # turn into timestamp
    for l in locs_to_add:
        l['timestamp'] = l['timestamp'].timestamp() * 1000

    vars = {
        'ShiftId': active_shift['id'],
        'Locations': locs_to_add
    }
    res = gqlClient.execute(query, context_value=request, variables=vars)
    # structure is 'data': 'addLocationsToShift': 'location': 'geom': POINT(lng, lat)
    return res


def end_shift(token, active_shift, gqlClient):
    request.headers = {'authorization': token}
    query = '''mutation EndShift($ShiftId: ID!) {
        endShift(shiftId: $ShiftId) {
            shift {
                id
                active
                endTime
                startTime
                roadSnappedMiles
                jobs {
                    edges {
                        node {
                        id
                        startTime
                        endTime
                        mileage
                        }
                    }
                }
            }
        }
    }
    '''
    vars = {
        'ShiftId': active_shift['id']
    }
    res = gqlClient.execute(query, context_value=request, variables=vars)
    return res


def extract_jobs_from_shift(token, active_shift, gqlClient):
    request.headers = {'authorization': token}
    query = '''mutation ExtractJobs($ShiftId: ID!) {
        extractJobsFromShift(shiftId: $ShiftId) {
                jobs {
                    id
                    startTime
                    endTime
                    mileage
                }
            }
        }
    '''
    vars = {
        'ShiftId': active_shift['id']
    }
    res = gqlClient.execute(query, context_value=request, variables=vars)
    return res


def add_pay_to_job(token, job_id, pay, gqlClient):
    request.headers = {'authorization': token}
    query = '''mutation SetJobTotalPay($JobId: ID! $Pay: Float!) {
        setJobTotalPay(jobId: $JobId value: $Pay) {
            ok
                job {
                    totalPay
                }
            }
        }
    '''
    vars = {
        'JobId': job_id,
        'Pay': pay
    }
    res = gqlClient.execute(query, context_value=request, variables=vars)
    return res


def add_tip_to_job(token, job_id, tip, gqlClient):
    request.headers = {'authorization': token}
    query = '''mutation SetJobTip($JobId: ID! $Tip: Float!) {
        setJobTip(jobId: $JobId value: $Tip) {
            ok
                job {
                    tip
                }
            }
        }
    '''
    vars = {
        'JobId': job_id,
        'Tip': tip
    }
    res = gqlClient.execute(query, context_value=request, variables=vars)
    return res
