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


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "postgresql://" + os.environ["DB_USERNAME"] + ":"  \
                              + os.environ["DB_PASSWORD"] + "@" \
                              + os.environ["DB_HOST"] + ":" \
                              + os.environ["DB_PORT"] + "/" \
                              + os.environ["DB_DATABASE"]
    click.echo(SQLALCHEMY_DATABASE_URI)


class TestingConfig(Config):
    DATABASE_NAME = "gigbox-testing"
    TESTING_TO_NUMBER = "+19082298992"
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "postgresql://" + os.environ["DB_USERNAME"] + ":" \
                              + os.environ["DB_PASSWORD"] + "@" \
                              + os.environ["DB_HOST"] + ":" \
                              + os.environ["DB_PORT"] + "/" \
                              + os.environ["DB_DATABASE"]
