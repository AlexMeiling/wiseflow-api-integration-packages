"""
WISEflow Integration Packages — Shared Auth Utility
====================================================
Provides get_headers() which obtains an OAuth2 bearer token via the
client_credentials grant and caches it until 30 seconds before expiry,
then returns the Authorization header dict ready for use with requests.

Usage:
    from shared.auth import get_headers

    response = requests.get(url, headers=get_headers())
"""

import os
import time

import requests
from dotenv import load_dotenv

# .env is loaded by each package script; this module just reads the env vars.
# A second load_dotenv() here is a belt-and-braces fallback.
load_dotenv()

# Module-level token cache — survives for the lifetime of the Python process.
_cache: dict = {"access_token": None, "expires_at": 0.0}


def get_headers() -> dict:
    """Return ``{"Authorization": "Bearer <token>"}`` for the WISEflow API.

    Fetches a new token only when the cached one is absent or within 30 s of
    expiry.  Raises ``requests.HTTPError`` if the token endpoint returns an
    error, and ``KeyError`` if required environment variables are missing.
    """
    now = time.monotonic()

    if _cache["access_token"] and now < _cache["expires_at"] - 30:
        return {"Authorization": f"Bearer {_cache['access_token']}"}

    base_url = os.environ["WISEFLOW_BASE_URL"].rstrip("/")
    client_id = os.environ["WISEFLOW_CLIENT_ID"]
    client_secret = os.environ["WISEFLOW_CLIENT_SECRET"]

    response = requests.post(
        f"{base_url}/oauth2/token",
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    response.raise_for_status()

    token_data = response.json()
    _cache["access_token"] = token_data["access_token"]
    expires_in = int(token_data.get("expires_in", 3600))
    _cache["expires_at"] = now + expires_in

    return {"Authorization": f"Bearer {_cache['access_token']}"}


def invalidate_cache() -> None:
    """Force the next call to get_headers() to fetch a fresh token."""
    _cache["access_token"] = None
    _cache["expires_at"] = 0.0
