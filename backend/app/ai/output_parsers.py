import json
import re
from typing import Any


def extract_json(text: str) -> Any:
    """
    Extract and parse JSON from an AI response.
    Handles cases where the model wraps JSON in markdown code blocks.
    """
    # Strip markdown code fences if present
    text = text.strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence_match:
        text = fence_match.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        # Attempt to find the first complete JSON object
        brace_start = text.find("{")
        if brace_start != -1:
            try:
                return json.loads(text[brace_start:])
            except json.JSONDecodeError:
                pass
        raise ValueError(f"Could not parse AI response as JSON: {e}") from e


def validate_lesson_plan(data: dict) -> dict:
    """Validate and normalise lesson plan JSON from AI."""
    required_keys = [
        "title", "learning_objectives", "success_criteria",
        "starter_activity", "teacher_explanation", "worked_examples",
        "guided_practice", "independent_tasks", "differentiated_tasks",
        "exit_ticket", "homework_suggestion", "parent_summary_draft",
    ]
    for key in required_keys:
        if key not in data:
            data[key] = [] if key in ("learning_objectives", "success_criteria") else {}
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
