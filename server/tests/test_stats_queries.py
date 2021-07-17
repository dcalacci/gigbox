import unittest
import pytest
import os
import jwt
import pandas as pd
from datetime import datetime, timedelta
from flask import current_app, request
from .utils import ApiTestCase, add_locations_to_shift, add_pay_to_job, add_tip_to_job, app, client, end_shift, gqlClient, token, locs, exodus_locs, active_shift

from api import create_app, db
from api.controllers.errors import custom_errors
from api.controllers.auth.utils import create_jwt, decode_jwt, get_otp
from api.models import User
from api.models import engine as models_conn
from flask_sqlalchemy import SQLAlchemy


def test_net_pay_from_just_added_jobs(app, token, locs, exodus_locs, active_shift, gqlClient):
    import numpy as np
    with app.test_request_context():
        _ = add_locations_to_shift(
            token, exodus_locs, active_shift, gqlClient)
        res = end_shift(token, active_shift, gqlClient)

        print("endshift result:", res)
        assert not res['data']['endShift']['shift']['active']
        assert len(res['data']['endShift']['shift']['jobs']['edges']) == 2
        jobs = res['data']['endShift']['shift']['jobs']['edges']
        jobIds = [j['node']['id'] for j in jobs]

        tips = [5.20, 3.00]
        pays = [10.12, 7.50]
        for n, j in enumerate(jobIds):
            res_pay = add_pay_to_job(token, j, pays[n], gqlClient)
            res_tip = add_tip_to_job(token, j, tips[n], gqlClient)
            assert res_pay['data']['setJobTotalPay']['ok']
            assert res_tip['data']['setJobTip']['ok']

        query = """query getNetPay {
            getNetPay {

            mileageDeduction
            tip
            pay
            startDate
            endDate
            }
        }
        """
        request.headers = {'authorization': token}
        res = gqlClient.execute(query, context_value=request)
        print("res:", res)
        assert res['data']['getNetPay']['pay'] == sum(filter(None, pays))
