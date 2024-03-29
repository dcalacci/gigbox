# test_auth.py
# tests authentication and authorization functions, including decorators.
# uses the error messages from api.controllers.errors to validate that the correct error messages
# are being thrown.
import unittest
import os
import datetime
from flask import current_app
import jwt

from .utils import ApiTestCase
from api import create_app, db
from api.controllers.errors import custom_errors
from api.controllers.auth.utils import create_jwt, decode_jwt, get_otp
from api.models import User
from api.models import engine as models_conn
from unittest import mock


def create_expired_token(phone):
    # Creates an expired token just for testing :)
    payload = {
        # expired yesterday
        "exp": datetime.datetime.utcnow() - datetime.timedelta(days=1),
        "iat": datetime.datetime.utcnow(),
        "sub": phone,
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256").decode("utf-8")


class TokenTestCase(ApiTestCase):

    def test_400_with_no_authorization_header(self):
        """tests 400 error for a request with no authorization header
        """
        res = self.client.get("/api/v1/auth/heartbeat",
                                headers={'not_authorization': 'not_a_token'})
        self.assertEqual(res.status_code, 400)
        self.assertIn(custom_errors['InvalidTokenError']
                      ['message'], str(res.data))

    def test_400_with_invalid_token(self):
        """tests that an invalid token returns 400
        """
        res = self.client.get('/api/v1/auth/heartbeat',
                                headers={'authorization': 'not-a-token'})
        self.assertEqual(res.status_code, 400)
        self.assertIn(custom_errors['InvalidTokenError']
                      ['message'], str(res.data))

    def test_400_with_valid_token_but_invalid_user(self):
        """tests that a valid token (is a phone number) but isnt a user returns 400
        """
        with self.app.app_context():
            token = create_jwt("5555555555")
        res = self.client.get('/api/v1/auth/heartbeat',
                                headers={'authorization': token})
        self.assertEqual(res.status_code, 400)
        self.assertIn(custom_errors['InvalidTokenError']
                      ['message'], str(res.data))

    def test_expired_token_error(self):
        """tests that an expired token returns a 400 error
        """
        with self.app.app_context():
            token = create_expired_token('5555555555')
        res = self.client.get('/api/v1/auth/heartbeat',
                                headers={'authorization': token})
        self.assertEqual(res.status_code, 400)
        self.assertIn(custom_errors['ExpiredTokenError']
                      ['message'], str(res.data))


class OTPTestCase(ApiTestCase):

    @mock.patch('api.controllers.auth.send_text')
    def test_otp_sent_with_valid_numbers(self, mock_send_text):
        """ensures that an OTP with a valid phone number(s) should be sent."""
        with self.app.app_context():
            expected_sid = "SID1"
            mock_send_text.return_value.sid = expected_sid

            res = self.client.post('/api/v1/auth/get_otp',
                                     data={'phone': current_app.config['TESTING_TO_NUMBER']})
            self.assertEqual(res.get_json()['message_sid'], expected_sid)
            # ensures that our send_text function is called with the right arguments
            # create the current OTP for our phone
            mock_send_text.assert_called_once_with(message=current_app.config['OTP_MESSAGE'].format(get_otp(current_app.config['TESTING_TO_NUMBER'])),
                                                   to_phone=current_app.config['TESTING_TO_NUMBER'],
                                                   from_phone=current_app.config['TWILIO_NUMBER'])
            self.assertEqual(res.status_code, 200)

    def test_otp_raises_error_if_cant_send(self):
        """API errors if an OTP is asked for by a number that is invalid"""
        with self.app.app_context():
            res = self.client.post('/api/v1/auth/get_otp',
                                     data={'phone': 'not-a-phone-number'})
            self.assertEqual(res.status_code, 500)
            self.assertIn(custom_errors['OTPSendError']
                          ['message'], res.get_json()['message'])

    def test_verify_otp_creates_new_user(self):
        """A call to the verify_otp endpoint should create a new user if they didn't exist before and the OTP is correct.
        """
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

    def test_verify_otp_400_if_invalid_otp(self):
        """Verify_otp should return a 400 code if the passcode submitted is incorrect"""
        with self.app.app_context():
            res = self.client.post("/api/v1/auth/verify_otp",
                                     data={'phone': current_app.config['TESTING_TO_NUMBER'],
                                           'otp': 'fake-otp'})
        self.assertEqual(res.status_code, 400)
        self.assertIn(custom_errors['OTPInvalidError']
                      ['message'], res.get_json()['message'])


if __name__ == "__main__":
    unittest.main()
