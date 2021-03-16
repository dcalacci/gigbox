from flask import Flask, Blueprint, request, jsonify
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_graphql import GraphQLView


from api.controllers import auth
from config import config


def create_app(env):
    app = Flask(__name__)

    app.config.from_object(config[env])

    api_bp = Blueprint('api', __name__)
    api = Api(api_bp)

    api.add_resource(auth.GetOtp, '/auth/otp')
    api.add_resource(auth.VerifyOtp, '/auth/verify_otp')
    api.add_resource(auth.GetSomeResource, '/getSomething')

    app.register_blueprint(api_bp, url_prefix="/api/v1")

    @app.route("/")
    def root():
        return "Hi!"

    return app
