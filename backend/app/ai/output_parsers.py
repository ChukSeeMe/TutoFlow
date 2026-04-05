import json
import re
from typing import Any


def extract_json(text: str) -> Any:
    """
    Extract and parse JSON from an AI response.
    Handles markdown code fences (with or without closing fence),
    and truncated responses.
    """
    text = text.strip()

    # Strip opening code fence (closing fence may be absent if response was truncated)
    fence_open = re.match(r"```(?:json)?\s*", text)
    if fence_open:
        text = text[fence_open.end():]
        # Remove closing fence if present
        text = re.sub(r"\s*```\s*$", "", text).strip()

    # Find the first { and attempt to parse from there
    brace_start = text.find("{")
    if brace_start == -1:
        raise ValueError("Could not parse AI response as JSON: no JSON object found")
    text = text[brace_start:]

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Response may be truncated — find the last complete key-value by
        # trimming from the end until we get valid JSON
        for end in range(len(text), 0, -1):
            try:
                return json.loads(text[:end])
            except json.JSONDecodeError:
                continue
        raise ValueError("Could not parse AI response as JSON: response appears truncated")


def validate_lesson_plan(data: dict) -> dict:
    """Validate and normalise lesson plan JSON from AI."""
    if "title" not in data:
        data["title"] = "Lesson Plan"
    list_keys = ("sections", "worked_examples", "practice_questions",
                 "key_vocabulary", "curriculum_links", "assessment_criteria")
    for key in list_keys:
        if key not in data or not isinstance(data[key], list):
            data[key] = []
    # Enforce maximums from the prompt
    data["worked_examples"] = data["worked_examples"][:2]
    data["practice_questions"] = data["practice_questions"][:4]
    if "homework" not in data or not isinstance(data["homework"], dict):
        data["homework"] = {}
    if "differentiation" not in data or not isinstance(data["differentiation"], dict):
        data["differentiation"] = {}
    return data


def validate_quiz(data: dict) -> dict:
    """Validate and normalise quiz JSON from AI."""
    if "questions" not in data:
        raise ValueError("AI quiz response missing 'questions' field")
    if "total_marks" not in data:
        data["total_marks"] = sum(q.get("marks", 1) for q in data["questions"])
    return data


def validate_homework(data: dict) -> dict:
    """Validate and normalise homework JSON from AI."""
    if "tasks" not in data:
        raise ValueError("AI homework response missing 'tasks' field")
    return data
