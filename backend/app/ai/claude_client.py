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
    use_cache: bool = True,
) -> str:
    """
    Send a prompt to Claude and return the text response.
    All student data sent to AI must be anonymised at the caller level.

    Prompt caching: when use_cache=True (default) the system prompt is sent
    with cache_control so Anthropic caches it between requests, cutting
    latency by up to 80% on repeated calls with the same system prompt.
    """
    client = get_claude_client()

    # Build system block — use prompt caching for large system prompts
    if use_cache and len(system_prompt) > 500:
        system_block = [
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ]
    else:
        system_block = system_prompt  # type: ignore[assignment]

    try:
        message = await client.messages.create(
            model=settings.ai_model,
            max_tokens=max_tokens or settings.ai_max_tokens,
            system=system_block,  # type: ignore[arg-type]
            messages=[{"role": "user", "content": user_prompt}],
            extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"} if use_cache else {},
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

    usage = message.usage
    cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
    cache_created = getattr(usage, "cache_creation_input_tokens", 0) or 0
    log.info(
        "claude_call_success",
        tokens_used=usage.output_tokens,
        cache_read=cache_read,
        cache_created=cache_created,
        response_length=len(text),
        response_preview=text[:300],
    )
    return text
