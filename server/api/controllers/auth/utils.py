import bcrypt
import base64
from flask import current_app
import datetime
import jwt
import pyotp
from twilio import twiml, base
from twilio.rest import Client


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
        jwt_timedelta = current_app.config['TOKEN_LIFETIME']
        payload = {
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=jwt_timedelta),
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
