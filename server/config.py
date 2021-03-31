import click
import os


class Config(object):
    DEBUG = True
    TESTING = False
    DATABASE_NAME = "gigbox"
    OTP_MESSAGE = "Your one-time login code from gigbox: {}"
    TWILIO_TOKEN = "140d775b7a19edd3a1bce22666de5d54"
    TWILIO_NUMBER = "+14013570487"
    TWILIO_SID = "ACf94ed41badca81cd1f75d453b785e41f"
    TOKEN_LIFETIME = 31


class DevelopmentConfig(Config):
    SECRET_KEY = "S0m3S3cr3tK3y"
    OTP_MESSAGE = "Your one-time login code from gigbox: {}"
    TWILIO_TOKEN = "140d775b7a19edd3a1bce22666de5d54"
    TWILIO_NUMBER = "+14013570487"
    TWILIO_SID = "ACf94ed41badca81cd1f75d453b785e41f"


class TestingConfig(DevelopmentConfig):
    DATABASE_NAME = "gigbox-testing"
    TESTING_TO_NUMBER = "+19082298992"


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': DevelopmentConfig
}


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


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://" + os.environ["DB_USERNAME"] + ":"  \
                              + os.environ["DB_PASSWORD"] + "@" \
                              + os.environ["DB_HOST"] + ":" \
                              + os.environ["DB_PORT"] + "/" \
                              + os.environ["DB_DATABASE"]
    click.echo(SQLALCHEMY_DATABASE_URI)


class TestingConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://" + os.environ["DB_USERNAME"] + ":" \
                              + os.environ["DB_PASSWORD"] + "@" \
                              + os.environ["DB_HOST"] + ":" \
                              + os.environ["DB_PORT"] + "/" \
                              + os.environ["DB_DATABASE"]
