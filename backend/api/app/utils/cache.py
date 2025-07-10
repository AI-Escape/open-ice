def cache_headers(max_age: int = 60 * 60 * 24):
    return {
        "Cache-Control": f"public, max-age={max_age}, stale-while-revalidate=3600",
    }
