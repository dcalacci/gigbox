from flask import Flask, Blueprint, request, jsonify
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_graphql import GraphQLView

from api.models import User, Shift, Location, db
from api.controllers.errors import custom_errors
from api.controllers import auth
from api.schema import schema
from config import Config
from graphene_file_upload.flask import FileUploadGraphQLView
from api.controllers.auth.decorators import login_required


def create_app(env):
    app = Flask(__name__)
    app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

    app.config.from_object(get_environment_config())
    db.init_app(app)

    class DummyMiddleware(object):
        def resolve(self, next, root, info, **kwargs):
            print("DummyMiddleware", next, kwargs, root, info)
            return next(root, info, **kwargs)

    dummy_middleware = DummyMiddleware()

    # OR app.schema import schema..
    # @app.route('/graphql', methods=['GET', 'POST'])
    def graphql_endpoint():
        # print("request:", request)
        view = FileUploadGraphQLView.as_view(
            "graphql", schema=schema, graphiql=True)
        return view
        # return login_required(view)

    app.add_url_rule(
        '/graphql',
        view_func=graphql_endpoint()
        # middleware=[dummy_middleware]
    )

    @ app.before_first_request
    def initialize_database():
        """ Create db tables"""
        app.logger.info("Before first request")
        try:
            app.logger.info("Creating postgis extension...")
            db.engine.execute('create extension postgis')
        except:
            app.logger.debug("POSTGIS extension already created...")
        app.logger.info("Creating all tables...")
        db.create_all()
        db.session.commit()
        app.logger.info("Session Committed.")

    @ app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()

    api_bp = Blueprint('api', __name__)
    api = Api(api_bp, errors=custom_errors)

    api.add_resource(auth.GetOtp, '/auth/get_otp')
    api.add_resource(auth.VerifyOtp, '/auth/verify_otp')
    api.add_resource(auth.LoggedIn, '/auth/login')
    app.register_blueprint(api_bp, url_prefix="/api/v1")

    @ app.route("/")
    def root():
        return "Go to /graphql"

    return app


def get_environment_config():
    if Config.ENV == "TESTING":
        return "config.TestingConfig"
    elif Config.ENV == "DEVELOPMENT":
        return "config.DevelopmentConfig"
