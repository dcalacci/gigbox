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
from .utils import ApiTestCase, add_locations_to_shift, app, client, end_shift, extract_jobs_from_shift, gqlClient, token, locs, exodus_locs, active_shift, long_stop_test_locs

from api import create_app, db
from api.controllers.errors import custom_errors
from api.controllers.auth.utils import create_jwt, decode_jwt, get_otp
from api.models import User
from api.models import engine as models_conn
from flask_sqlalchemy import SQLAlchemy


def send_merge_jobs_graphql(jobIds, gqlClient, token, dry_run=False):
    request.headers = {'authorization': token}
    query = '''mutation MergeJobs($JobIds: [ID]! $DryRun: Boolean) {
        mergeJobs(jobIds: $JobIds, dryRun: $DryRun) {
                mergedJob {
                    id
                    startTime
                    endTime
                    mileage
                }
                ok
                message
                committed
            }
        }
    '''
    vars = {
        'JobIds': jobIds,
        'DryRun': dry_run
    }
    res = gqlClient.execute(query, context_value=request, variables=vars)
    return res


class TestShiftCreation(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.locs = pd.read_csv(
            "tests/locs.csv", index_col=0, parse_dates=['time'])

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


def test_adding_locations_to_shift_is_ok_and_returns_geometry(app, token, locs, active_shift, gqlClient):
    with app.test_request_context():
        res = add_locations_to_shift(
            token, locs, active_shift, gqlClient)
        # geom is POINT(lng, lat)
        assert res['data']['addLocationsToShift']['location']['geom'] is not None
        assert res['data']['addLocationsToShift']['ok']


def test_extracts_two_jobs_from_example_shift(app, token, locs, active_shift, gqlClient):
    import numpy as np
    with app.test_request_context():
        _ = add_locations_to_shift(token, locs, active_shift, gqlClient)
        res = end_shift(token, active_shift, gqlClient)

        print("endshift result:", res)
        assert not res['data']['endShift']['shift']['active']
        assert len(res['data']['endShift']['shift']['jobs']['edges']) == 2
        jobs = res['data']['endShift']['shift']['jobs']['edges']
        endTimes = [j['node']['endTime'] for j in jobs]
        startTimes = [j['node']['startTime'] for j in jobs]
        miles = [j['node']['mileage'] for j in jobs]

        # all end times less than shift end
        assert np.all([e <= res['data']['endShift']['shift']
                       ['endTime'] for e in endTimes])

        # all end times greater than shift start
        assert np.all([e >= res['data']['endShift']['shift']
                       ['startTime'] for e in endTimes])

        # all start times less than shift end
        assert np.all([s <= res['data']['endShift']['shift']
                       ['endTime'] for s in startTimes])

        # all start times greater than shift start
        assert np.all([s >= res['data']['endShift']['shift']
                       ['startTime'] for s in startTimes])


def test_doesnt_extract_already_extracted_jobs(app, token, locs, active_shift, gqlClient):
    with app.test_request_context():
        _ = add_locations_to_shift(token, locs, active_shift, gqlClient)
        _ = end_shift(token, active_shift, gqlClient)
        res = extract_jobs_from_shift(token, active_shift, gqlClient)
        print("extract result:", res)
        assert len(res['data']['extractJobsFromShift']['jobs']) == 0


def test_extracts_jobs_if_not_already_exist(app, token, locs, active_shift, gqlClient):
    with app.test_request_context():
        # locs = locs.to_dict(orient='records')
        # Confirm the shift doesn't have any jobs
        end_shift_res = end_shift(token, active_shift, gqlClient)
        assert end_shift_res['data']['endShift']['shift']['jobs']['edges'] == [
        ]

        # locs.time = pd.to_datetime(locs.time)
        # locs.time = locs.time + timedelta(hours=3)

        _ = add_locations_to_shift(token, locs, active_shift, gqlClient,
                                   start_n_mins_after_shift=120)
        res = extract_jobs_from_shift(token, active_shift, gqlClient)
        print("extract result:", res)
        assert len(res['data']['extractJobsFromShift']['jobs']) == 2

        res2 = extract_jobs_from_shift(token, active_shift, gqlClient)
        assert len(res2['data']['extractJobsFromShift']['jobs']) == 0


def test_extracts_two_trips_and_mileage_from_exodus_test_trip(app, token, exodus_locs, active_shift, gqlClient):
    import numpy as np
    with app.test_request_context():
        _ = add_locations_to_shift(token, exodus_locs, active_shift, gqlClient)
        res = end_shift(token, active_shift, gqlClient)

        print("endshift result:", res)
        assert not res['data']['endShift']['shift']['active']
        assert len(res['data']['endShift']['shift']['jobs']['edges']) == 2
        jobs = res['data']['endShift']['shift']['jobs']['edges']
        endTimes = [j['node']['endTime'] for j in jobs]
        startTimes = [j['node']['startTime'] for j in jobs]
        miles = [j['node']['mileage'] for j in jobs]

        # all end times less than shift end
        assert np.all([e <= res['data']['endShift']['shift']
                       ['endTime'] for e in endTimes])

        # all end times greater than shift start
        assert np.all([e >= res['data']['endShift']['shift']
                       ['startTime'] for e in endTimes])

        # all start times less than shift end
        assert np.all([s <= res['data']['endShift']['shift']
                       ['endTime'] for s in startTimes])

        # all start times greater than shift start

        assert np.all([s >= res['data']['endShift']['shift']
                       ['startTime'] for s in startTimes])

        # mileage less than or equal
        assert np.sum(
            miles) <= res['data']['endShift']['shift']['roadSnappedMiles']

        # mileage on this trip in total should be about 5.1 miles
        assert abs(np.sum(miles) - 5.1) < 1


def test_merges_two_trips_from_one_shift(app, token, exodus_locs, active_shift, gqlClient):
    import numpy as np
    with app.test_request_context():
        _ = add_locations_to_shift(token, exodus_locs, active_shift, gqlClient)
        res = end_shift(token, active_shift, gqlClient)

        print("endshift result:", res)
        assert not res['data']['endShift']['shift']['active']
        assert len(res['data']['endShift']['shift']['jobs']['edges']) == 2
        jobs = res['data']['endShift']['shift']['jobs']['edges']
        jobIds = [j['node']['id'] for j in jobs]

        res = send_merge_jobs_graphql(jobIds, gqlClient, token)

        mergedJob = res['data']['mergeJobs']['mergedJob']
        ok = res['data']['mergeJobs']['ok']
        assert ok
        assert res['data']['mergeJobs']['committed']
        print("merged job:", mergedJob)
        print("job miles:", jobs)
        assert abs(mergedJob['mileage'] - 5.1) < 1


def test_does_not_commit_dry_run(app, token, exodus_locs, active_shift, gqlClient):
    import numpy as np
    with app.test_request_context():
        _ = add_locations_to_shift(token, exodus_locs, active_shift, gqlClient)
        res = end_shift(token, active_shift, gqlClient)

        print("endshift result:", res)
        assert not res['data']['endShift']['shift']['active']
        assert len(res['data']['endShift']['shift']['jobs']['edges']) == 2
        jobs = res['data']['endShift']['shift']['jobs']['edges']
        jobIds = [j['node']['id'] for j in jobs]
        res = send_merge_jobs_graphql(jobIds, gqlClient, token, dry_run=True)

        mergedJob = res['data']['mergeJobs']['mergedJob']
        ok = res['data']['mergeJobs']['ok']
        assert ok
        assert res['data']['mergeJobs']['committed'] == False
        print("merged job:", mergedJob)
        print("job miles:", jobs)
        assert abs(mergedJob['mileage'] - 5.1) < 1


def test_lingering_stop_is_squashed(app, token, long_stop_test_locs, active_shift, gqlClient):
    import numpy as np
    with app.test_request_context():
        _ = add_locations_to_shift(
            token, long_stop_test_locs, active_shift, gqlClient)
        res = end_shift(token, active_shift, gqlClient)

        print("endshift result:", res)
        assert not res['data']['endShift']['shift']['active']
        assert len(res['data']['endShift']['shift']['jobs']['edges']) == 1
        jobs = res['data']['endShift']['shift']['jobs']['edges']
        # With this trip, if we don't squash the ending stop correctly, OSRM
        # parses it as a 17+ mile job (circling around)
        print("job:", jobs[0])
        assert abs(jobs[0]['node']['mileage'] - 6) < 1


if __name__ == "__main__":
    unittest.main()
