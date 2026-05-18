"""
Per-user Metabase embed token endpoint.

Reads the dashboard id + embedding secret out of the shared volume that
`metabase-init` populated, signs a short-lived JWT pinning the `user_id`
parameter to the request's user, and returns the full embed URL.

The user_id parameter is set to "locked" on the dashboard, so the JWT value
is server-controlled — clients cannot inspect or override it. Token lifetime
is 1 hour so a dashboard tab can stay open without re-fetching.
"""
from __future__ import annotations

import json
import os
import time

import jwt
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

CONFIG_PATH = os.environ.get("MB_CONFIG_PATH", "/shared/metabase.json")
PUBLIC_URL  = os.environ.get("MB_PUBLIC_URL", "http://localhost:3004")
TOKEN_TTL   = 3600  # 1 hour


def _load_config() -> dict | None:
    """Returns {dashboard_id, embedding_secret} once metabase-init has provisioned, else None."""
    try:
        with open(CONFIG_PATH) as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


class DashboardTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cfg = _load_config()
        if not cfg:
            return Response(
                {"error": {"code": "SERVER_ERROR", "message": "Dashboard not yet provisioned. Try again shortly."}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        payload = {
            "resource": {"dashboard": int(cfg["dashboard_id"])},
            "params":   {"user_id": request.user.id},
            "exp":      int(time.time()) + TOKEN_TTL,
        }
        token = jwt.encode(payload, cfg["embedding_secret"], algorithm="HS256")
        # `theme=night` + transparent + no border/title so the embed blends into our
        # own overlay panel (frontend renders this in an iframe inside `Dashboard.tsx`).
        url = (
            f"{PUBLIC_URL}/embed/dashboard/{token}"
            "#theme=night&bordered=false&titled=false&background=false&downloads=true"
        )
        return Response({"url": url})
