from flask import Flask, Blueprint, request, jsonify
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_graphql import GraphQLView
from sqlalchemy import create_engine
from sqlalchemy_utils import database_exists, create_database
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from api.controllers.errors import custom_errors
from api.controllers import auth
from api.models import User, Survey, Question, Answer, RangeOptions, Shift
from config import Config, get_environment_config_str
from graphene_file_upload.flask import FileUploadGraphQLView
from api.controllers.auth.decorators import login_required

from api.data.surveys import initialize_survey_data

from api.models import db

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    
    # set optional bootswatch theme
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    app.config.from_object(get_environment_config_str())

    # This engine just used to query for list of databases

    # Query for existing databases
    # existing_databases = engine.execute("SHOW DATABASES;")
    if not database_exists(app.config['SQLALCHEMY_DATABASE_URI']):
        create_database(app.config['SQLALCHEMY_DATABASE_URI'])
        app.logger.debug("database created...")
    else:
        app.logger.info("database already exists")


    # existing_databases = engine.execute("SELECT datname FROM pg_database;")
    # print("Existing dbs:", existing_databases)
    # existing_databases = [d[0] for d in existing_databases]

    # Create database if it doesn't exist
    # if app.config['DATABASE_NAME'] not in existing_databases:
    #     engine.execute("CREATE DATABASE {0}".format(app.config['DATABASE_NAME']))
    #     app.logger.debug("Created database {0}".format(app.config['DATABASE_NAME']))

    # app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'] + "/" + app.config['DATABASE_NAME']
    db.init_app(app)

    

    admin = Admin(app, name='microblog', template_mode='bootstrap3')
    @ app.before_first_request
    def initialize_database():
        """ Create db tables"""
        app.logger.info("Before first request")

        try:
            app.logger.info("Creating postgis extension...")
            db.engine.execute('create extension postgis')
        except:
            app.logger.debug("POSTGIS extension already created...")
        db.create_all()
        db.session.commit()
        print("Session Committed. All tables created.")

        initialize_survey_data(db)


    @ app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()

    def graphql_endpoint():

        from api.schema import schema

        view = FileUploadGraphQLView.as_view(
            "graphql", schema=schema, graphiql=True)
        return view

    app.add_url_rule(
        '/graphql',
        view_func=graphql_endpoint()
    )

    api_bp = Blueprint('api', __name__)
    api = Api(api_bp, errors=custom_errors)

    api.add_resource(auth.GetOtp, '/auth/get_otp')
    api.add_resource(auth.VerifyOtp, '/auth/verify_otp')
    api.add_resource(auth.LoggedIn, '/auth/login')
    app.register_blueprint(api_bp, url_prefix="/api/v1")

    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Survey, db.session))
    admin.add_view(ModelView(Question, db.session))
    admin.add_view(ModelView(Answer, db.session))
    admin.add_view(ModelView(RangeOptions, db.session))
    # admin.add_view(ModelView(Survey, db.session))



    @ app.route("/")
    def root():
        return "Go to /graphql"

    return app
