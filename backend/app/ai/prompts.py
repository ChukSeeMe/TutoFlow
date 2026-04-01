"""
All AI prompts for TutorFlow.

Privacy rules enforced here:
- Student first names are used only where needed (not full names, not dates of birth)
- No NHS numbers, postcodes, or identifying medical information
- SEND notes are summarised as pedagogical strategies only
- All outputs are framed as tutor-facing drafts requiring review
"""


LESSON_PLAN_SYSTEM = """
You are an expert UK secondary school curriculum designer and experienced teacher.
You produce structured, high-quality lesson plans for one-to-one and small group tutoring sessions.
You follow the England National Curriculum and know GCSE and A-Level specifications well.
Your lesson plans are practical, differentiated, and teacher-facing.
You never make medical diagnoses or harmful inferences about students.
You always return your response as valid JSON matching the schema provided.
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
        send_section = f"\nLearning support context (pedagogical strategies only): {send_context}"

    prior_section = ""
    if prior_knowledge:
        prior_section = f"\nPrior knowledge: {prior_knowledge}"

    notes_section = ""
    if additional_notes:
        notes_section = f"\nAdditional tutor notes: {additional_notes}"

    return f"""
Create a detailed one-to-one tutoring lesson plan with the following parameters:

Subject: {subject}
Topic: {topic}
Year Group: {year_group}
Key Stage: {key_stage}
Lesson Type: {lesson_type}
Duration: {duration_minutes} minutes
Difficulty Level: {difficulty_level}
Learning Objective: {learning_objective}{send_section}{prior_section}{notes_section}

Return a JSON object with EXACTLY this structure:
{{
  "title": "string — specific lesson title",
  "learning_objectives": ["string", ...],
  "success_criteria": ["Student can...", ...],
  "prior_knowledge_check": {{
    "questions": ["string", ...],
    "purpose": "string"
  }},
  "starter_activity": {{
    "title": "string",
    "description": "string",
    "duration_minutes": number,
    "purpose": "string"
  }},
  "teacher_explanation": {{
    "outline": ["string — key teaching point", ...],
    "key_vocabulary": ["string", ...],
    "teaching_notes": "string"
  }},
  "worked_examples": [
    {{
      "problem": "string",
      "solution_steps": ["string", ...],
      "teaching_point": "string"
    }}
  ],
  "guided_practice": {{
    "tasks": ["string", ...],
    "scaffolding": "string",
    "duration_minutes": number
  }},
  "independent_tasks": {{
    "tasks": ["string", ...],
    "duration_minutes": number
  }},
  "differentiated_tasks": {{
    "foundation": ["string", ...],
    "core": ["string", ...],
    "higher": ["string", ...],
    "extension": ["string", ...]
  }},
  "scaffolded_support": ["string — specific scaffold strategies", ...],
  "challenge_tasks": ["string", ...],
  "misconceptions": [
    {{
      "misconception": "string",
      "how_to_address": "string"
    }}
  ],
  "assessment_opportunities": ["string", ...],
  "exit_ticket": {{
    "questions": ["string", ...],
    "purpose": "string"
  }},
  "homework_suggestion": {{
    "title": "string",
    "description": "string",
    "estimated_time_minutes": number
  }},
  "parent_summary_draft": "string — friendly plain-English summary for parents, 2-3 sentences",
  "materials_needed": ["string", ...]
}}

Be specific, practical, and appropriately challenging for the year group.
All content must be England curriculum-aligned.
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
