from flask import Flask, Blueprint, request, jsonify
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_graphql import GraphQLView

from api.database import base
from api.database.base import db_session
from api.controllers.errors import custom_errors
from api.controllers import auth
from api.schema import schema
from config import Config

db = SQLAlchemy()


def create_app(env):
    app = Flask(__name__)

    app.config.from_object(get_environment_config())
    db.init_app(app)

    # OR app.schema import schema..
    app.add_url_rule(
        '/graphql',
        view_func=GraphQLView.as_view(
            'graphql',
            schema=schema,
            graphiql=True
        )
    )

    @app.before_first_request
    def initialize_database():
        """ Create db tables"""
        print('Create database {}'.format(base.db_name))
        base.Base.metadata.create_all(base.engine)

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    @app.route("/")
    def test():
        return "Test ok!"

    api_bp = Blueprint('api', __name__)
    api = Api(api_bp, errors=custom_errors)

    api.add_resource(auth.GetOtp, '/auth/get_otp')
    api.add_resource(auth.VerifyOtp, '/auth/verify_otp')
    app.register_blueprint(api_bp, url_prefix="/api/v1")

    @app.route("/")
    def root():
        return "Go to /graphql"

    return app


def get_environment_config():
    if Config.ENV == "TESTING":
        return "config.TestingConfig"
    elif Config.ENV == "DEVELOPMENT":
        return "config.DevelopmentConfig"
