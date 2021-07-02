import click
import os


class Config(object):
    ENV = os.environ["ENV"] if "ENV" in os.environ else "DEVELOPMENT"
    CSRF_ENABLED = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DATABASE_NAME = "gigbox"
    OTP_MESSAGE = "Your one-time login code from gigbox: {}"
    SECRET_KEY = os.environ["SECRET_KEY"]
    TWILIO_NUMBER = os.environ['TWILIO_NUMBER']
    TWILIO_SID = os.environ["TWILIO_SID"]
    TWILIO_TOKEN = os.environ["TWILIO_TOKEN"]
    MIN_SHIFT_MILEAGE = 1
    MIN_SHIFT_DURATION = 5*60
    TOKEN_LIFETIME = 31

class DevelopmentConfig(Config):
    ENV = "DEVELOPMENT"
    DATABASE_NAME = "gigbox-development"
    DEBUG = True
    MIN_SHIFT_MILEAGE = 0
    MIN_SHIFT_DURATION = 5*60
    SQLALCHEMY_DATABASE_URI = "postgresql://" + os.environ["POSTGRES_USER"] + ":"  \
                              + os.environ["POSTGRES_PASSWORD"] + "@" \
                              + os.environ["DB_HOST"] + ":" \
                              + os.environ["DB_PORT"] + "/" \
                              + DATABASE_NAME


class TestingConfig(Config):
    ENV = "TESTING"
    DATABASE_NAME = "gigbox-testing"
    TESTING_TO_NUMBER = "+19082298992"
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "postgresql://" + os.environ["POSTGRES_USER"] + ":"  \
                              + os.environ["POSTGRES_PASSWORD"] + "@" \
                              + os.environ["DB_HOST"] + ":" \
                              + os.environ["DB_PORT"] + "/" \
                              + DATABASE_NAME



class ProductionConfig(Config):
    ENV = "PRODUCTION"
    MIN_SHIFT_MILEAGE = 1
    MIN_SHIFT_DURATION = 5*60
    SQLALCHEMY_DATABASE_URI = "postgresql://" + os.environ["POSTGRES_USER"] + ":"  \
                              + os.environ["POSTGRES_PASSWORD"] + "@" \
                              + os.environ["DB_HOST"] + ":" \
                              + os.environ["DB_PORT"] + "/" \
                              + os.environ["POSTGRES_DB"]


def get_environment_config_str():
    if Config.ENV == "TESTING":
        return "config.TestingConfig"
    elif Config.ENV == "DEVELOPMENT":
        return "config.DevelopmentConfig"
    elif Config.ENV == "PRODUCTION":
        return "config.ProductionConfig"
    else:
        raise ValueError("Did not recognize environment. Exiting...")

def get_environment_config():
    print("ENV:", os.environ['ENV'])
    if Config.ENV == "TESTING":
        print("Testing env...")
        return TestingConfig()
    elif Config.ENV == "DEVELOPMENT":
        print("Development env...")
        return DevelopmentConfig()
    elif Config.ENV == "PRODUCTION":
        print("Production env...")
        return ProductionConfig()
    else:
        raise ValueError("Did not recognize environment. Exiting...")
