# api/controllers/auth/decorators.py
# Decorators for API functions to ensure users are logged in and accessing resources they are
# authorized for.
from flask import current_app
from flask_restful import reqparse, abort, Resource
from flask import Blueprint, request, jsonify, g
from functools import wraps

from api.controllers.auth.utils import decode_jwt
from api.models import User


def login_required(f):
    '''
    This decorator checks the header to ensure a valid token is set
    '''
    @wraps(f)
    def func(*args, **kwargs):
        try:
            if 'authorization' not in request.headers:
                current_app.logger.error("No authorization header found.")
                abort(404, message="You need to be logged in to access this resource")
            token = request.headers.get('authorization')
            user_id = decode_jwt(token).get("payload")
            g.user = User.find(user_id)
            if g.user is None:
                current_app.logger.error("Invalid User ID")
                abort(404, message="The user id is invalid")
            return f(*args, **kwargs)
        except Exception as e:
            current_app.logger.error("Error parsing token: {}".format(e))
            abort(
                400, message="There was a problem while trying to parse your token")
    return func
