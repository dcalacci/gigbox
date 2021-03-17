import bcrypt
import base64
from flask import current_app
import datetime
import jwt
import pyotp
from twilio import twiml, base 
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from api.controllers.errors import ExpiredTokenError, InvalidTokenError, TokenCreationError, TextMessageSendError

def send_text(message, to_phone, from_phone):
        TwilioClient = Client(
            current_app.config["TWILIO_SID"], current_app.config["TWILIO_TOKEN"]
        )
        try:
            sent_message = TwilioClient.messages.create(
                body=message,
                from_=from_phone,
                to=to_phone,
            )
        except TwilioRestException as e:
            raise TextMessageSendError("Could not send message with texting service")
        return sent_message


def encode_base32(str, key):
    """encode input as base32 string using input and a secret key"""
    return base64.b32encode(bytearray(str + key, "ascii")).decode("utf-8")


def get_otp(phone):
    """create OTP for a phone, using phone as base32 secret"""
    totp = pyotp.TOTP(encode_base32(phone, current_app.config['SECRET_KEY']))
    return totp.now()


def create_jwt(phone):
    """generates a token from successful authentication
    NOTE: If this is changed, you need to change tests.test_auth.create_expired_token as well.
    """
    try:
        jwt_timedelta = current_app.config['TOKEN_LIFETIME']
        payload = {
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=jwt_timedelta),
            "iat": datetime.datetime.utcnow(),
            "sub": phone,
        }
        return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256").decode("utf-8")
    except Exception as e:
        raise TokenCreationError()
        current_app.logger.error("Could not create JWT token for phone: {}".format(e))


def decode_jwt(token):
    """decodes a token and returns ID associated (subject) if valid"""
    try:
        payload = jwt.decode(token.encode(), current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return {"isError": False, "payload": payload["sub"]}
    except jwt.ExpiredSignatureError as e:
        current_app.logger.error("Token expired.")
        raise ExpiredTokenError()
    except jwt.InvalidTokenError as e:
        current_app.logger.error("Invalid token.")
        raise InvalidTokenError()
