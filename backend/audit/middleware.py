# audit/middleware.py
import threading
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

_thread_locals = threading.local()

def get_current_user():
    """Use this in signals: returns the user or None."""
    return getattr(_thread_locals, "user", None)

class CurrentUserMiddleware(MiddlewareMixin):
    """
    Populate thread-local with the currently authenticated user.

    Works for:
      - SessionAuthentication / regular Django auth (request.user set by AuthenticationMiddleware),
      - JWT auth (we call JWTAuthentication().authenticate(request) here).
    """

    def process_request(self, request):
        # 1) Prefer existing authenticated user (session/cookie auth)
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            _thread_locals.user = user
            return None

        # 2) Otherwise try JWT authentication (for API requests)
        try:
            auth_result = JWTAuthentication().authenticate(request)
            if auth_result is not None:
                user, validated_token = auth_result
                # set both on request and threadlocals
                request.user = user
                _thread_locals.user = user
            else:
                _thread_locals.user = None
        except Exception:
            # If JWT parsing/validation fails, just set None (do not raise)
            _thread_locals.user = None

    def process_response(self, request, response):
        # Clear after response so the threadlocal doesn't leak across requests
        _thread_locals.user = None
        return response

    def process_exception(self, request, exception):
        _thread_locals.user = None
        return None
