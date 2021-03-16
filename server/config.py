class Config(object):
    DEBUG = True
    TESTING = False
    DATABASE_NAME = "gigbox"
    OTP_MESSAGE = "Your one-time login code from gigbox: {}"
    TWILIO_TOKEN="140d775b7a19edd3a1bce22666de5d54"
    TWILIO_NUMBER="+14013570487"
    TWILIO_SID="ACf94ed41badca81cd1f75d453b785e41f"

class DevelopmentConfig(Config):
    SECRET_KEY = "S0m3S3cr3tK3y"
    OTP_MESSAGE = "Your one-time login code from gigbox: {}"
    TWILIO_TOKEN="140d775b7a19edd3a1bce22666de5d54"
    TWILIO_NUMBER="+14013570487"
    TWILIO_SID="ACf94ed41badca81cd1f75d453b785e41f"

config = {
    'development': DevelopmentConfig,
    'testing': DevelopmentConfig,
    'production': DevelopmentConfig
}
