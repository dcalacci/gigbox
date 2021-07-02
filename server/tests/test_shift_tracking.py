# test_auth.py
# tests authentication and authorization functions, including decorators.
# uses the error messages from api.controllers.errors to validate that the correct error messages
# are being thrown.
import unittest
import pytest
import os
import jwt
import pandas as pd
from datetime import datetime, timedelta
from flask import current_app, request
from .utils import ApiTestCase, app, client, gqlClient, token, locs, exodus_locs, active_shift

from api import create_app, db
from api.controllers.errors import custom_errors
from api.controllers.auth.utils import create_jwt, decode_jwt, get_otp
from api.models import User
from api.models import engine as models_conn
from flask_sqlalchemy import SQLAlchemy




class TestShiftCreation(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.locs = pd.read_csv("tests/locs.csv", index_col=0, parse_dates=['time'])

        # create user
        with self.app.app_context():
            otp = get_otp(current_app.config['TESTING_TO_NUMBER'])
            res = self.client.post('/api/v1/auth/verify_otp',
                                     data={'phone': current_app.config['TESTING_TO_NUMBER'],
                                           'otp': otp})
            obj = res.get_json()
            print(obj)
            # request should come back authenticated
            self.assertEqual(obj['authenticated'], True)
            # user should have been created, not found
            self.assertEqual(obj['userCreated'], True)
            id = decode_jwt(obj['token'])['payload']
            # user ID returned by API is same as the one decoded from the token
            self.assertEqual(obj['user_id'], id)
            # created user ID in database is same as decoded ID in token
            self.assertEqual(User.query.get(obj['user_id']).id, id)
            self.token = obj['token']


    def test_get_active_shift_returns_none_if_no_active_shift(self):

        with self.app.test_request_context():
            request.headers = {'authorization': self.token}
            query = '''{getActiveShift {id}}'''
            res = self.gqlClient.execute(query, context_value=request)
            print("data:", res['data'])
            assert res['data']['getActiveShift'] == None


    def test_new_user_has_no_shifts(self):
        with self.app.test_request_context():
            request.headers = {'authorization': self.token}
            query = '''{allShifts {pageInfo {hasNextPage endCursor} edges { node { id } } } }
            '''
            res = self.gqlClient.execute(query, context_value=request)
            print("query result:", res)
            assert len(res['data']['allShifts']['edges']) == 0


    def test_aa_create_shift_should_return_new_shift(self):
        with self.app.test_request_context():
            request.headers = {'authorization': self.token}
            query = '''mutation {createShift(active: true) { shift { id startTime active }}}
            '''
            res = self.gqlClient.execute(query, context_value=request)
            print("query result:", res)
            assert res['data']['createShift']['shift']['active']
            self.shift_id = res['data']['createShift']['shift']['id']


def add_locations_to_shift(token, locs, exodus_locs, active_shift, gqlClient,
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
    if trip == 'exodus':
        locs = exodus_locs
    ## add all locations not just first!
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
            ll['timestamp'] = shift_start + timedelta(minutes=start_n_mins_after_shift)
        else:
            # otherwise, add calculated time difference to last added loc
            td = l['time'] - locations[n-1]['time'] # diff from last timestamp
            ll['timestamp'] = (locs_to_add[-1]['timestamp'] + td)
        locs_to_add.append(ll)

    # turn into timestamp
    for l in locs_to_add:
        l['timestamp'] = l['timestamp'].timestamp()

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




def test_adding_locations_to_shift_is_ok_and_returns_geometry(app, token, locs, exodus_locs, active_shift, gqlClient):
    with app.test_request_context():
        res = add_locations_to_shift(token, locs, exodus_locs, active_shift, gqlClient)
        # geom is POINT(lng, lat)
        assert res['data']['addLocationsToShift']['location']['geom'] is not None
        assert res['data']['addLocationsToShift']['ok']


def test_extracts_three_jobs_from_example_shift(app, token, locs, exodus_locs, active_shift, gqlClient):
    import numpy as np
    with app.test_request_context():
        _ = add_locations_to_shift(token, locs, exodus_locs, active_shift, gqlClient)
        res = end_shift(token, active_shift, gqlClient)

        print("endshift result:", res)
        assert not res['data']['endShift']['shift']['active']
        assert len(res['data']['endShift']['shift']['jobs']['edges']) == 3
        jobs = res['data']['endShift']['shift']['jobs']['edges']
        endTimes = [j['node']['endTime'] for j in jobs]
        startTimes = [j['node']['startTime'] for j in jobs]
        miles = [j['node']['mileage'] for j in jobs]


        # all end times less than shift end
        assert np.all([e <= res['data']['endShift']['shift']['endTime'] for e in endTimes])

        # all end times greater than shift start
        assert np.all([e >= res['data']['endShift']['shift']['startTime'] for e in endTimes])

        # all start times less than shift end
        assert np.all([s <= res['data']['endShift']['shift']['endTime'] for s in startTimes])

        # all start times greater than shift start
        assert np.all([s >= res['data']['endShift']['shift']['startTime'] for s in startTimes])

        # mileage less than or equal
        assert np.sum(miles) <= res['data']['endShift']['shift']['roadSnappedMiles']

def test_doesnt_extract_already_extracted_jobs(app, token, exodus_locs, locs, active_shift, gqlClient):
    with app.test_request_context():
        _ = add_locations_to_shift(token, locs, exodus_locs, active_shift, gqlClient)
        _ = end_shift(token, active_shift, gqlClient)
        res = extract_jobs_from_shift(token, active_shift, gqlClient)
        print("extract result:", res)
        assert len(res['data']['extractJobsFromShift']['jobs']) == 0

def test_extracts_jobs_if_not_already_exist(app, token, exodus_locs, locs, active_shift, gqlClient):
    with app.test_request_context():
        # locs = locs.to_dict(orient='records')
        # Confirm the shift doesn't have any jobs
        end_shift_res = end_shift(token, active_shift, gqlClient)
        assert end_shift_res['data']['endShift']['shift']['jobs']['edges'] == []

        # locs.time = pd.to_datetime(locs.time)
        # locs.time = locs.time + timedelta(hours=3)

        _ = add_locations_to_shift(token, locs, exodus_locs, active_shift, gqlClient,
                start_n_mins_after_shift=120)
        res = extract_jobs_from_shift(token, active_shift, gqlClient)
        print("extract result:", res)
        assert len(res['data']['extractJobsFromShift']['jobs']) == 3

        res2 = extract_jobs_from_shift(token, active_shift, gqlClient)
        assert len(res2['data']['extractJobsFromShift']['jobs']) == 0

def test_extracts_two_trips_and_mileage_from_exodus_test_trip(app, token, locs, exodus_locs, active_shift, gqlClient):
    import numpy as np
    with app.test_request_context():
        _ = add_locations_to_shift(token, locs, exodus_locs, active_shift, gqlClient, trip='exodus')
        res = end_shift(token, active_shift, gqlClient)

        print("endshift result:", res)
        assert not res['data']['endShift']['shift']['active']
        assert len(res['data']['endShift']['shift']['jobs']['edges']) == 2
        jobs = res['data']['endShift']['shift']['jobs']['edges']
        endTimes = [j['node']['endTime'] for j in jobs]
        startTimes = [j['node']['startTime'] for j in jobs]
        miles = [j['node']['mileage'] for j in jobs]


        # all end times less than shift end
        assert np.all([e <= res['data']['endShift']['shift']['endTime'] for e in endTimes])

        # all end times greater than shift start
        assert np.all([e >= res['data']['endShift']['shift']['startTime'] for e in endTimes])

        # all start times less than shift end
        assert np.all([s <= res['data']['endShift']['shift']['endTime'] for s in startTimes])

        # all start times greater than shift start
        assert np.all([s >= res['data']['endShift']['shift']['startTime'] for s in startTimes])

        # mileage less than or equal
        assert np.sum(miles) <= res['data']['endShift']['shift']['roadSnappedMiles']

        # mileage on this trip in total should be about 5.1 miles
        assert (np.sum(miles) - 5.1) < 0.2



if __name__ == "__main__":
    unittest.main()
