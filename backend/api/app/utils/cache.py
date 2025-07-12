import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


def cache_headers(max_age: int = 60 * 60 * 24):
    if ENVIRONMENT == "development":
        return {}
    return {
        "Cache-Control": f"public, max-age={max_age}, stale-while-revalidate=3600",
    }
