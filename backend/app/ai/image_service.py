import httpx
from app.config import settings
import structlog

log = structlog.get_logger(__name__)

# Educational search terms appended to make images more relevant
_EDU_SUFFIX = "education classroom learning"


async def fetch_topic_image(topic: str, subject: str) -> str | None:
    """
    Fetch a relevant image URL from Unsplash for a lesson topic.
    Returns None gracefully if the key is not set or the request fails.
    """
    if not settings.unsplash_access_key:
        return None

    query = f"{topic} {subject} {_EDU_SUFFIX}"
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(
                "https://api.unsplash.com/photos/random",
                params={"query": query, "orientation": "landscape", "content_filter": "high"},
                headers={"Authorization": f"Client-ID {settings.unsplash_access_key}"},
            )
            if res.status_code == 200:
                data = res.json()
                url = data.get("urls", {}).get("regular")
                log.info("unsplash_image_fetched", topic=topic, url=url)
                return url
            elif res.status_code == 403:
                log.warning("unsplash_rate_limit_or_invalid_key")
            else:
                log.warning("unsplash_unexpected_status", status=res.status_code)
    except Exception as e:
        log.warning("unsplash_fetch_failed", error=str(e))
    return None
