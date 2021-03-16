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

from flask import current_app

from api.models import User
from api.controllers.errors import ValidationError


def encode_base32(str, key):
    """encode input as base32 string using input and a secret key"""
    return base64.b32encode(bytearray(str + key, "ascii")).decode("utf-8")


def get_otp(phone):
    """create OTP for a phone, using phone as base32 secret"""
    totp = pyotp.TOTP(encode_base32(phone, current_app.config['SECRET_KEY']))
    return totp.now()


def create_jwt(phone):
    """generates a token from successful authentication"""
    try:
        payload = {
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
            "iat": datetime.datetime.utcnow(),
            "sub": phone,
        }
        return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256").decode("utf-8")
    except Exception as e:
        print("Could not create JWT token for phone")


def decode_jwt(token):
    """decodes a token and returns ID associated (subject) if valid"""
    try:
        payload = jwt.decode(token.encode(), current_app.config['SECRET_KEY'])
        return {"isError": False, "payload": payload["sub"]}
    except jwt.ExpiredSignatureError as e:
        return {"isError": True, "message": "Signature expired"}
    except jwt.InvalidTokenError as e:
        return {"isError": True, "message": "Invalid token: {}".format(e)}


class GetOtp(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument(
            "phone",
            type=str,
            help="You need to log in using a phone number.",
            required=True,
        )
        # TODO: verify it's a phone number first
        args = parser.parse_args()
        phone = args.get("phone")

        TwilioClient = Client(
            current_app.config["TWILIO_SID"], current_app.config["TWILIO_TOKEN"]
        )
        # create one-time password with phone as secret, send to user's phone
        message = TwilioClient.messages.create(
            body=current_app.config['OTP_MESSAGE'].format(get_otp(phone)),
            from_=current_app.config["TWILIO_NUMBER"],
            to=phone,
        )
        return {"message": 'Success'}


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
            return {'token': None,
                    'authenticated': False,
                    'message': 'One time passcode incorrect.'
                    }

        user_id = encode_base32(phone, key=current_app.config['SECRET_KEY'])
        jwt = create_jwt(user_id)
        try:
            User.create(id=user_id)
            return {'token': jwt,
                    'authenticated': True,
                    'userCreated': True}
        except ValidationError as e:
            current_app.logger.info("Could not create user: {}".format(e))
            return {'token': jwt,
                    'authenticated': True,
                    'userCreated': False}


def login_required(f):
    '''
    This decorator checks the header to ensure a valid token is set
    '''
    @wraps(f)
    def func(*args, **kwargs):
        try:
            if 'authorization' not in request.headers:
                current_app.logger.error("No authorization header found.")
                abort(404, message="You need to be logged in to access this resource")
            token = request.headers.get('authorization')
            user_id = decode_jwt(token).get("payload")
            g.user = User.find(user_id)
            if g.user is None:
                current_app.logger.error("Invalid User ID")
                abort(404, message="The user id is invalid")
            return f(*args, **kwargs)
        except Exception as e:
            current_app.logger.error("Error parsing token: {}".format(e))
            abort(
                400, message="There was a problem while trying to parse your token")
    return func


class GetSomeResource(Resource):
    @login_required
    def get(self):
        return {'message': "right on, man"}
