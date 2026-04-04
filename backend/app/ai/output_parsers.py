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
    # Only require title — all other keys get sensible defaults if missing
    if "title" not in data:
        data["title"] = "Lesson Plan"
    list_keys = ("learning_objectives", "success_criteria", "scaffolded_support",
                 "challenge_tasks", "assessment_opportunities", "materials_needed")
    dict_keys = ("starter_activity", "teacher_explanation", "guided_practice",
                 "independent_tasks", "differentiated_tasks", "exit_ticket",
                 "homework_suggestion", "prior_knowledge_check")
    for key in list_keys:
        if key not in data:
            data[key] = []
    for key in dict_keys:
        if key not in data:
            data[key] = {}
    if "worked_examples" not in data:
        data["worked_examples"] = []
    if "parent_summary_draft" not in data:
        data["parent_summary_draft"] = ""
    if "misconceptions" not in data:
        data["misconceptions"] = []
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
