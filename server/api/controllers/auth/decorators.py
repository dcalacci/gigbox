# api/controllers/auth/decorators.py
# Decorators for API functions to ensure users are logged in and accessing resources they are
# authorized for.
from flask import current_app
from flask_restful import reqparse, abort, Resource
from flask import Blueprint, request, jsonify, g
from functools import wraps

from api.controllers.auth.utils import decode_jwt
from api.controllers.errors import InvalidTokenError
from api.database.base import db_session
from api.database.model import User


def login_required(f):
    '''
    This decorator checks the header to ensure a valid token is set
    '''
    @wraps(f)
    def func(*args, **kwargs):

        if 'authorization' not in request.headers:
            current_app.logger.error("No authorization header found.")
            raise InvalidTokenError()
        token = request.headers.get('authorization')
        user_id = decode_jwt(token).get("payload")
        if user_id is None:
            current_app.logger.error("Token parsed to none")
            raise InvalidTokenError()
        g.user = db_session.query(User).get(uid=user_id)
        # g.user = User.get(user_id)
        if g.user is None:
            current_app.logger.error(
                "Token corresponds to a user that doesn't exist: {}".format(user_id))
            raise InvalidTokenError()
        return f(*args, **kwargs)
    return func
