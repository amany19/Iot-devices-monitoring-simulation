import threading
from django.utils.deprecation import MiddlewareMixin

_thread_locals = threading.local()

def get_current_user():
    return getattr(_thread_locals, 'user', None)

class CurrentUserMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Attach the user from the request
        _thread_locals.user = request.user if request.user.is_authenticated else None

    def process_response(self, request, response):
        # Clear user after response is done (avoid leaking between threads)
        _thread_locals.user = None
        return response

    def process_exception(self, request, exception):
        # Also clear user in case of exceptions
        _thread_locals.user = None
        return None
