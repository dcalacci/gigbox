# test_auth.py
# tests authentication and authorization functions, including decorators.
# uses the error messages from api.controllers.errors to validate that the correct error messages
# are being thrown.
import unittest
import pytest
import os
import datetime
import pandas as pd
from flask import current_app, request
import jwt
from .utils import ApiTestCase, app, client, gqlClient, token, locs, active_shift

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


    @pytest.mark.dependency(name="shift_create")
    def test_aa_create_shift_should_return_new_shift(self):
        with self.app.test_request_context():
            request.headers = {'authorization': self.token}
            query = '''mutation {createShift(active: true) { shift { id startTime active }}}
            '''
            res = self.gqlClient.execute(query, context_value=request)
            print("query result:", res)
            assert res['data']['createShift']['shift']['active']
            self.shift_id = res['data']['createShift']['shift']['id']


@pytest.mark.dependency(depends=['shift_create'])
def test_adding_location_to_shift(app, token, locs, active_shift, gqlClient):
    with app.test_request_context():
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
        l = locs.iloc[0].to_dict()
        locations = [{'lat': l['lat'], 
            'lng': l['lng'], 
            'timestamp': l['time'].timestamp(), 
            'accuracy': 5}]
        vars = {
                'ShiftId': active_shift['id'],
                'Locations': locations
                }
        res = gqlClient.execute(query, context_value=request, variables=vars)
        assert res['data']['addLocationsToShift']['location']['geom'] is not None
        assert res['data']['addLocationsToShift']['ok']


if __name__ == "__main__":
    unittest.main()
