from flask import Blueprint, jsonify

from ..extensions import db
from ..models import ROLES, STAFF_ROLES, User
from ..security import auth_required, current_user
from ..serializers import user_to_dict
from ..utils import ApiError, json_body

bp = Blueprint("users", __name__, url_prefix="/users")


@bp.get("")
@auth_required("admin")
def list_users():
    users = User.query.order_by(User.id).all()
    return jsonify({"items": [user_to_dict(u) for u in users]})


@bp.get("/agents")
@auth_required("agente", "admin")
def list_agents():
    agents = (
        User.query.filter(User.is_active.is_(True), User.role.in_(STAFF_ROLES))
        .order_by(User.name)
        .all()
    )
    return jsonify({"items": [{"id": u.id, "name": u.name, "role": u.role} for u in agents]})


@bp.patch("/<int:user_id>")
@auth_required("admin")
def update_user(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError("User not found", 404)
    data = json_body()
    role = data.get("role", user.role)
    is_active = data.get("is_active", user.is_active)
    if role not in ROLES:
        raise ApiError("Invalid role")
    if not isinstance(is_active, bool):
        raise ApiError("is_active must be a boolean")
    if user.id == current_user().id and (role != user.role or is_active is False):
        raise ApiError("You cannot change your own role or deactivate yourself", 400)
    user.role = role
    user.is_active = is_active
    db.session.commit()
    return jsonify(user_to_dict(user))
