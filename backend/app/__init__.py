"""SupportDesk application factory."""

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from .config import load_config
from .extensions import cors, db, jwt, migrate
from .utils import ApiError


def _error(message: str, status: int):
    return jsonify({"error": message}), status


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(exc: ApiError):
        return _error(exc.message, exc.status)

    @app.errorhandler(HTTPException)
    def handle_http_error(exc: HTTPException):
        messages = {404: "Not found", 405: "Method not allowed"}
        return _error(messages.get(exc.code, exc.name), exc.code or 500)

    @app.errorhandler(Exception)
    def handle_unexpected(exc: Exception):
        app.logger.exception("Unhandled error")
        db.session.rollback()
        return _error("Internal server error", 500)

    @jwt.unauthorized_loader
    def missing_token(reason: str):
        return _error("Authentication required", 401)

    @jwt.invalid_token_loader
    def invalid_token(reason: str):
        return _error("Invalid token", 401)

    @jwt.expired_token_loader
    def expired_token(header, payload):
        return _error("Token has expired", 401)


def create_app(config: dict | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(load_config())
    if config:
        app.config.update(config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        expose_headers=["Content-Disposition"],
    )

    from .routes import auth, dashboard, tickets, users

    for module in (auth, tickets, users, dashboard):
        app.register_blueprint(module.bp, url_prefix=_prefix(module))

    register_error_handlers(app)
    return app


def _prefix(module) -> str:
    """Blueprints are mounted under /api; some define their own sub-prefix."""
    return "/api" + (module.bp.url_prefix or "")
