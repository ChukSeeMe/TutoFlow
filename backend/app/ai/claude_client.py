import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential
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


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
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
        content = message.content[0]
        log.info(
            "claude_raw_response",
            content_type=content.type,
            stop_reason=message.stop_reason,
            usage=str(message.usage),
        )
        if content.type != "text":
            raise AIServiceError("Unexpected AI response format")
        text = content.text.strip()
        log.info(
            "claude_response_text",
            length=len(text),
            stop_reason=message.stop_reason,
            tokens_used=message.usage.output_tokens,
            full_response=text,
        )
        if not text:
            raise AIServiceError("AI returned an empty response. Please try again.")
        if message.stop_reason == "max_tokens":
            log.error(
                "claude_response_truncated",
                tokens_used=message.usage.output_tokens,
                max_tokens=max_tokens or settings.ai_max_tokens,
                response_tail=text[-200:],
            )
            raise AIServiceError(
                "AI response was cut off before completing. "
                "Try a shorter lesson duration or fewer sections."
            )
        return text
    except anthropic.APIConnectionError as e:
        log.error("claude_connection_error", error=str(e))
        raise AIServiceError("Could not connect to AI service. Please try again.")
    except anthropic.RateLimitError as e:
        log.warning("claude_rate_limit", error=str(e))
        raise AIServiceError("AI service rate limit reached. Please wait a moment.")
    except anthropic.APIStatusError as e:
        log.error("claude_api_error", status=e.status_code, error=str(e))
        raise AIServiceError(f"AI service error: {e.message}")
