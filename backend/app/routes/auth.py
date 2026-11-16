import re

from flask import Blueprint, jsonify
from flask_jwt_extended import create_access_token
from sqlalchemy import func

from ..extensions import db
from ..models import User
from ..security import auth_required, current_user
from ..serializers import user_to_dict
from ..utils import ApiError, json_body

bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _auth_response(user: User, status: int):
    token = create_access_token(identity=str(user.id))
    return jsonify({"user": user_to_dict(user), "access_token": token}), status


@bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@bp.post("/auth/register")
def register():
    data = json_body()
    name = str(data.get("name") or "").strip()
    email = str(data.get("email") or "").strip().lower()
    password = data.get("password")
    if not name or len(name) > 120:
        raise ApiError("Name is required (max 120 characters)")
    if not EMAIL_RE.match(email) or len(email) > 255:
        raise ApiError("A valid email is required")
    if not isinstance(password, str) or len(password) < 8:
        raise ApiError("Password must be at least 8 characters")
    if User.query.filter(func.lower(User.email) == email).first():
        raise ApiError("Email is already registered", 409)
    user = User(name=name, email=email, role="usuario")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return _auth_response(user, 201)


@bp.post("/auth/login")
def login():
    data = json_body()
    email = str(data.get("email") or "").strip().lower()
    password = data.get("password")
    user = User.query.filter(func.lower(User.email) == email).first()
    if user is None or not isinstance(password, str) or not user.check_password(password):
        raise ApiError("Invalid email or password", 401)
    if not user.is_active:
        raise ApiError("Account is disabled", 403)
    return _auth_response(user, 200)


@bp.get("/auth/me")
@auth_required()
def me():
    return jsonify(user_to_dict(current_user()))
