"""Authentication helpers built on flask-jwt-extended."""

from functools import wraps

from flask import g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from .extensions import db
from .models import User
from .utils import ApiError


def current_user() -> User:
    return g.current_user


def auth_required(*roles: str):
    """Require a valid JWT of an active user, optionally restricted to the given roles."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            try:
                user_id = int(get_jwt_identity())
            except (TypeError, ValueError):
                raise ApiError("Invalid token", 401) from None
            user = db.session.get(User, user_id)
            if user is None or not user.is_active:
                raise ApiError("Account not available", 401)
            if roles and user.role not in roles:
                raise ApiError("Forbidden", 403)
            g.current_user = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator
