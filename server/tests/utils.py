import os
import unittest
import pytest

from flask import current_app, request
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
                'StartTime': (datetime.now() - timedelta(hours = 5)).strftime('%Y-%m-%d %H:%M:%S'),
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
