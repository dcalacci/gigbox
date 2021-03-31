# auth.py
# authentication endpoint
from flask_restful import reqparse, abort, Resource
from flask import Blueprint, request, jsonify, g
from twilio import twiml, base
from twilio.rest import Client
from functools import wraps
import datetime
import base64
import os
import pyotp
import jwt
import bcrypt

from flask import current_app, request

from api.database.model import User
from api.database.base import db_session
from api.controllers.errors import ValidationError, OTPSendError, OTPInvalidError, TextMessageSendError
from api.controllers.auth.utils import get_otp, create_jwt, decode_jwt, encode_base32, send_text
from api.controllers.auth.decorators import login_required


class GetOtp(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            "phone",
            type=str,
            help="You need to log in using a phone number: {error_msg}",
            required=True,
        )
        args = parser.parse_args()
        phone = args.get("phone")

        try:
            sent_message = send_text(
                message=current_app.config['OTP_MESSAGE'].format(
                    get_otp(phone)),
                to_phone=phone,
                from_phone=current_app.config['TWILIO_NUMBER']
            )
        except TextMessageSendError as e:
            current_app.logger.error(
                "Error sending text message: {}".format(e))
            raise OTPSendError()

        # create one-time password with phone as secret, send to user's phone
        return {"message": 'Success',
                "status": 200,
                "message_sid": sent_message.sid}


class VerifyOtp(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            "phone", type=str, help="The phone number to log in as", required=True
        )
        parser.add_argument(
            "otp",
            type=str,
            help="The one-time passcode sent to this phone number",
            required=True,
        )
        args = parser.parse_args()
        phone = args.get("phone")
        otp = args.get("otp")

        current_app.logger.info("OTP should be: {}".format(get_otp(phone)))

        authenticated = get_otp(phone) == otp

        if not authenticated:
            raise OTPInvalidError()
        user_id = encode_base32(phone, key=current_app.config['SECRET_KEY'])
        jwt = create_jwt(user_id)
        # TODO: #4 check if user exists. if it doesn't, and we couldn't create the user, we shouldnt mark
        # them as authenticated.
        try:
            user = User(uid=user_id)
            db_session.add(user)
            db_session.commit()
            return {'token': jwt,
                    'user_id': user_id,
                    'authenticated': True,
                    'userCreated': True,
                    'status': 200,
                    'message': 'Success'}
        except ValidationError as e:
            current_app.logger.info("Could not create user: {}".format(e))
            return {'token': jwt,
                    'user_id': user_id,
                    'authenticated': True,
                    'userCreated': False,
                    'status': 200,
                    'message': 'Success'}


class GetSomeResource(Resource):
    @login_required
    def get(self):
        return {'message': "right on, man"}
