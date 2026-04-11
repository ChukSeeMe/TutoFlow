"""
All AI prompts for Teach Harbour.

Privacy rules enforced here:
- Student first names are used only where needed (not full names, not dates of birth)
- No NHS numbers, postcodes, or identifying medical information
- SEND notes are summarised as pedagogical strategies only
- All outputs are framed as tutor-facing drafts requiring review
"""


LESSON_PLAN_SYSTEM = """
You are an expert UK secondary school curriculum planner with deep knowledge of the
National Curriculum, AQA, Edexcel, and OCR specifications.

Return ONLY the JSON object. No markdown fences, no preamble, no explanation outside the JSON.

Rules:
- All content must align with UK National Curriculum standards
- Use UK spelling throughout (e.g. "recognise", "practise", "colour")
- Keep each section's content field under 150 words
- Include a maximum of 2 worked examples
- Include a maximum of 4 practice questions
- activity_type must be one of: explain | practice | discuss | assess
- If support_needs_context is provided, reflect scaffolding strategies in differentiation.support
- If prior_knowledge is provided, reference it in the first section's teacher_notes
""".strip()


def lesson_plan_prompt(
    subject: str,
    topic: str,
    year_group: str,
    key_stage: str,
    lesson_type: str,
    duration_minutes: int,
    difficulty_level: str,
    learning_objective: str,
    send_context: str | None = None,
    prior_knowledge: str | None = None,
    additional_notes: str | None = None,
) -> str:
    send_section = ""
    if send_context:
        send_section = f"\nsupport_needs_context: {send_context}"

    prior_section = ""
    if prior_knowledge:
        prior_section = f"\nprior_knowledge: {prior_knowledge}"

    notes_section = ""
    if additional_notes:
        notes_section = f"\nadditional_notes: {additional_notes}"

    return f"""
Generate a lesson plan for one-to-one tutoring with these parameters:

subject: {subject}
topic: {topic}
year_group: {year_group}
key_stage: {key_stage}
lesson_type: {lesson_type}
duration_minutes: {duration_minutes}
difficulty: {difficulty_level}
objective: {learning_objective}{send_section}{prior_section}{notes_section}

Return a JSON object matching this schema exactly:
{{
  "title": "string",
  "subject": "{subject}",
  "topic": "{topic}",
  "year_group": "{year_group}",
  "duration_mins": {duration_minutes},
  "difficulty": "{difficulty_level}",
  "objective": "string",
  "curriculum_links": ["string"],
  "sections": [
    {{
      "title": "string",
      "duration_mins": number,
      "content": "string (max 150 words)",
      "teacher_notes": "string",
      "activity_type": "explain | practice | discuss | assess"
    }}
  ],
  "worked_examples": [
    {{
      "problem": "string",
      "solution": "string",
      "steps": ["string"]
    }}
  ],
  "practice_questions": [
    {{
      "question": "string",
      "answer": "string",
      "marks": number,
      "difficulty": "foundation | core | extension"
    }}
  ],
  "key_vocabulary": [
    {{
      "term": "string",
      "definition": "string"
    }}
  ],
  "homework": {{
    "task": "string",
    "instructions": "string",
    "estimated_time_mins": number
  }},
  "assessment_criteria": ["string"],
  "differentiation": {{
    "support": "string",
    "core": "string",
    "extension": "string"
  }}
}}
""".strip()


QUIZ_SYSTEM = """
You are an experienced UK secondary school teacher who creates high-quality, curriculum-aligned assessments.
You return only valid JSON. Questions must be clear, unambiguous, and appropriate to the specified level.
""".strip()


def quiz_prompt(
    subject: str,
    topic: str,
    year_group: str,
    num_questions: int,
    difficulty_level: str,
    assessment_type: str,
) -> str:
    return f"""
Create a {assessment_type} for one-to-one tutoring with these parameters:

Subject: {subject}
Topic: {topic}
Year Group: {year_group}
Number of Questions: {num_questions}
Difficulty: {difficulty_level}

Return a JSON object:
{{
  "title": "string",
  "questions": [
    {{
      "question": "string",
      "question_type": "mcq|short|true_false",
      "options": ["string", ...],  // only for mcq
      "answer": "string",
      "marks": number,
      "explanation": "string — brief explanation shown after attempt"
    }}
  ],
  "total_marks": number,
  "time_suggested_minutes": number
}}

Make questions specific, England-curriculum aligned, and clear.
For MCQ, include 4 options. For short answer, keep expected answers brief and unambiguous.
""".strip()


HOMEWORK_SYSTEM = """
You are an experienced UK tutor creating structured, manageable homework tasks.
Homework should reinforce lesson content, be achievable independently, and have clear instructions.
Return only valid JSON.
""".strip()


def homework_prompt(
    subject: str,
    topic: str,
    year_group: str,
    difficulty_level: str,
    num_tasks: int,
    lesson_summary: str | None = None,
) -> str:
    lesson_context = f"\nRecent lesson summary: {lesson_summary}" if lesson_summary else ""

    return f"""
Create structured homework tasks for a tutoring student.

Subject: {subject}
Topic: {topic}
Year Group: {year_group}
Difficulty: {difficulty_level}
Number of tasks: {num_tasks}{lesson_context}

Return JSON:
{{
  "title": "string",
  "description": "string — student-friendly overview",
  "estimated_time_minutes": number,
  "tasks": [
    {{
      "task_number": number,
      "instruction": "string — clear, student-facing",
      "content": "string or object — the actual task",
      "marks_available": number,
      "hint": "string — optional scaffold"
    }}
  ],
  "resources": ["string — any useful resources or revision tips"]
}}
""".strip()


PARENT_SUMMARY_SYSTEM = """
You are a professional UK tutor writing parent/guardian updates.
Your tone is warm, clear, professional, and accessible — never jargon-heavy.
You summarise teaching progress factually and constructively.
You do not make medical diagnoses or negative personal judgments about students.
You highlight achievements and frame challenges as next steps.
All outputs are drafts requiring tutor review before sending.
Return only the text of the parent summary — no JSON wrapper.
""".strip()


RESOURCE_SYSTEM = """
You are an experienced UK secondary school teacher and tutor creating high-quality educational resources.
All resources must be:
- Curriculum-aligned for England
- Clearly structured with instructions
- Appropriately levelled for the stated year group and ability
- Practical and immediately usable
- Formatted as clean plain text (no markdown images, no external links)
Return ONLY the resource content — no preamble, no explanation.
"""


def resource_prompt(
    resource_type: str,
    topic: str,
    subject: str,
    year_group: str,
    ability_band: str,
    context: str = "",
) -> str:
    extras = f"\nAdditional context: {context}" if context else ""
    return f"""
Create a {resource_type} for the following:

Subject: {subject}
Topic: {topic}
Year group: {year_group}
Ability: {ability_band}
{extras}

Resource type guidance:
- worksheet: Include clear title, learning objective, worked example, 8-12 graded questions (easier → harder), and an extension task.
- retrieval_quiz: 10 short retrieval questions with answer key at the end. Mix recall, application, and explain-type questions.
- revision_card: Concise double-sided card format. Front: key facts/definitions/formulae. Back: 5 quick-fire questions.
- worked_example: Step-by-step worked example with annotated explanation at each step. Then one guided practice question.
- homework: Title, objective, 6-8 questions suitable for independent home completion, clear instructions.
- differentiated_task: Three versions — Foundation (scaffolded), Core (standard), Extension (challenge). Label each clearly.

Generate the {resource_type} now.
""".strip()


def parent_summary_prompt(
    student_first_name: str,
    subject: str,
    topics_covered: list[str],
    session_count: int,
    strengths: list[str],
    areas_to_develop: list[str],
    homework_status: str,
    next_steps: list[str],
    period_description: str,
    tutor_name: str,
) -> str:
    return f"""
Write a parent/guardian update for {student_first_name}'s tutoring sessions.

Period: {period_description}
Subject: {subject}
Number of sessions: {session_count}
Topics covered: {", ".join(topics_covered)}
Strengths demonstrated: {", ".join(strengths)}
Areas to develop: {", ".join(areas_to_develop)}
Homework engagement: {homework_status}
Next steps: {", ".join(next_steps)}
Tutor: {tutor_name}

Write a warm, professional 3-4 paragraph update for the parent/guardian.
Start with positives, then address development areas constructively, then outline next steps.
Keep it accessible — avoid technical jargon.
Do not include any sensitive personal or medical information.
This is a DRAFT for the tutor to review before sending.
""".strip()
