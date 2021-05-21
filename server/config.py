import click
import os


class Config(object):
    ENV = os.environ["ENV"] if "ENV" in os.environ else "DEVELOPMENT"
    CSRF_ENABLED = True
    SECRET_KEY = "this_is_a_secret_key"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DATABASE_NAME = "gigbox"
    OTP_MESSAGE = "Your one-time login code from gigbox: {}"
    TWILIO_TOKEN = "140d775b7a19edd3a1bce22666de5d54"
    TWILIO_NUMBER = "+14013570487"
    TWILIO_SID = "ACf94ed41badca81cd1f75d453b785e41f"
    TOKEN_LIFETIME = 31
    IMAGE_DIR = '/opt/images'
    SQLALCHEMY_DATABASE_URI = "postgresql://" + os.environ["DB_USERNAME"] + ":"  \
                              + os.environ["DB_PASSWORD"] + "@" \
                              + os.environ["DB_HOST"] + ":" \
                              + os.environ["DB_PORT"] + "/" \
                              + os.environ["DB_DATABASE"]


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    DATABASE_NAME = "gigbox-testing"
    TESTING_TO_NUMBER = "+19082298992"
    DEBUG = False

class ProductionConfig(Config):
    ENV = "PRODUCTION"
    SECRET_KEY = os.environ["SECRET_KEY"]
    TWILIO_NUMBER = os.environ["TWILIO_NUMBER"]
    TWILIO_SID = os.environ["TWILIO_SID"]
    TWILIO_TOKEN = os.environ["TWILIO_TOKEN"]
