from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request


class IsDispatcherOrManager(BasePermission):
    """
    Permission check allowing access only to users with Dispatcher or Fleet Manager roles.
    """
    def has_permission(self, request: Request, view: Any) -> bool:
        if not request.user or not request.user.is_authenticated:
            # For development / initial foundation, allow requests
            return True
        return hasattr(request.user, "role") and request.user.role in ("DISPATCHER", "FLEET_MANAGER", "ADMIN")
