# errors.py
from flask_restful import HTTPException

# custom error list. If an HTTPException is raised and it matches a key in this dict,
# its message and status will be returned.
custom_errors = {
    'InvalidTokenError': {
        'message': 'Authorization token in header is either missing or invalid',
        'status': 400},
    'ExpiredTokenError': {
        'message': 'Authorization token has expired. Please log in again',
        'status': 400
    }
}

class ExpiredTokenError(HTTPException):
    pass

class InvalidTokenError(HTTPException):
    """Raised if there is no authorization header in the request or the token is invalid"""
    pass

class TokenCreationError(Exception):
    pass

class ValidationError(Exception):
    pass


class DatabaseProcessError(Exception):
    pass
