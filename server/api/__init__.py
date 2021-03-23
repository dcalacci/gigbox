from flask import Flask, Blueprint, request, jsonify
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_graphql import GraphQLView

from api.controllers.errors import custom_errors
from api.controllers import auth
from api.models import initialize_db
from config import config


def create_app(env):
    app = Flask(__name__)

    app.config.from_object(config[env])
    initialize_db(app)

    api_bp = Blueprint('api', __name__)
    api = Api(api_bp, errors=custom_errors)

    api.add_resource(auth.GetOtp, '/auth/get_otp')
    api.add_resource(auth.VerifyOtp, '/auth/verify_otp')
    api.add_resource(auth.GetSomeResource, '/auth/test_get')

    app.register_blueprint(api_bp, url_prefix="/api/v1")

    @app.route("/")
    def root():
        return "Hi!"

    return app
