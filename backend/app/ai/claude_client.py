import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.config import settings
from app.core.exceptions import AIServiceError
import structlog

log = structlog.get_logger(__name__)

_client: anthropic.AsyncAnthropic | None = None


def get_claude_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        if not settings.anthropic_api_key:
            raise AIServiceError("Anthropic API key not configured")
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


# Only retry on transient errors (connection issues, rate limits).
# AIServiceError (HTTPException) and APIStatusError are NOT retried.
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((anthropic.APIConnectionError, anthropic.RateLimitError)),
    reraise=True,
)
async def call_claude(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int | None = None,
) -> str:
    """
    Send a prompt to Claude and return the text response.
    All student data sent to AI must be anonymised at the caller level.
    """
    client = get_claude_client()
    try:
        message = await client.messages.create(
            model=settings.ai_model,
            max_tokens=max_tokens or settings.ai_max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except anthropic.APIConnectionError as e:
        log.error("claude_connection_error", error=str(e))
        raise  # tenacity will retry
    except anthropic.RateLimitError as e:
        log.warning("claude_rate_limit", error=str(e))
        raise  # tenacity will retry
    except anthropic.APIStatusError as e:
        log.error("claude_api_error", status=e.status_code, error=str(e))
        raise AIServiceError(f"AI service error: {e.message}")

    log.info(
        "claude_raw_response",
        stop_reason=message.stop_reason,
        usage=str(message.usage),
    )

    if not message.content:
        log.error("claude_empty_content", stop_reason=message.stop_reason)
        raise AIServiceError("AI returned no content. Please try again.")

    content = message.content[0]
    if content.type != "text":
        raise AIServiceError("Unexpected AI response format")

    text = content.text.strip()

    if not text:
        log.error("claude_empty_text", stop_reason=message.stop_reason)
        raise AIServiceError("AI returned an empty response. Please try again.")

    if message.stop_reason == "max_tokens":
        log.error(
            "claude_response_truncated",
            tokens_used=message.usage.output_tokens,
            max_tokens=max_tokens or settings.ai_max_tokens,
            response_tail=text[-300:],
        )
        raise AIServiceError(
            "AI response was cut off before completing. "
            "Try a shorter lesson duration or fewer sections."
        )

    log.info(
        "claude_call_success",
        tokens_used=message.usage.output_tokens,
        response_length=len(text),
        response_preview=text[:300],
    )
    return text
