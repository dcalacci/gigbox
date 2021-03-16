from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_graphql import GraphQLView

from models import db
from schemas import schema

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://dcalacci:weveGotheadsonsticks@02@localhost/gigbox'
    app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

    db.init_app(app)

    @app.route("/")
    def root():
        return "Hi!"


    app.add_url_rule(
        '/graphql-api',
        view_func=GraphQLView.as_view(
            'graphql',
            schema=schema,
            graphiql=True
        ))

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
