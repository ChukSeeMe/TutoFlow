"""
Seed script — populates the database with:
- England curriculum subjects and topics (KS3, KS4, KS5)
- A demo tutor account
- Two demo students
- Sample lesson plan

Run: python scripts/seed.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, engine
from app.models import *  # noqa: F403
from app.database import Base
from app.core.security import hash_password


SUBJECTS_AND_TOPICS = [
    {
        "name": "Mathematics",
        "key_stage": "All",
        "description": "England National Curriculum Mathematics",
        "topics": [
            # KS3
            {"name": "Place Value and Ordering", "year_group": "Year 7", "key_stage": "KS3", "order_index": 1},
            {"name": "Fractions, Decimals and Percentages", "year_group": "Year 7", "key_stage": "KS3", "order_index": 2},
            {"name": "Algebraic Expressions", "year_group": "Year 8", "key_stage": "KS3", "order_index": 3},
            {"name": "Equations and Inequalities", "year_group": "Year 8", "key_stage": "KS3", "order_index": 4},
            {"name": "Ratio and Proportion", "year_group": "Year 9", "key_stage": "KS3", "order_index": 5},
            # KS4
            {"name": "Quadratic Equations", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-Maths-Algebra-4", "order_index": 10},
            {"name": "Simultaneous Equations", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-Maths-Algebra-5", "order_index": 11},
            {"name": "Trigonometry", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-Maths-Geometry-8", "order_index": 12},
            {"name": "Probability", "year_group": "Year 11", "key_stage": "KS4", "curriculum_ref": "GCSE-Maths-Statistics-2", "order_index": 13},
            {"name": "Statistics and Data Handling", "year_group": "Year 11", "key_stage": "KS4", "curriculum_ref": "GCSE-Maths-Statistics-1", "order_index": 14},
            {"name": "Circle Theorems", "year_group": "Year 11", "key_stage": "KS4", "order_index": 15},
            {"name": "Vectors", "year_group": "Year 11", "key_stage": "KS4", "order_index": 16},
            # KS5
            {"name": "Differentiation", "year_group": "Year 12", "key_stage": "KS5", "order_index": 20},
            {"name": "Integration", "year_group": "Year 12", "key_stage": "KS5", "order_index": 21},
            {"name": "Binomial Expansion", "year_group": "Year 12", "key_stage": "KS5", "order_index": 22},
            {"name": "Mechanics — Kinematics", "year_group": "Year 13", "key_stage": "KS5", "order_index": 23},
        ],
    },
    {
        "name": "English Language",
        "key_stage": "All",
        "description": "England National Curriculum English Language",
        "topics": [
            {"name": "Reading Comprehension Strategies", "year_group": "Year 7", "key_stage": "KS3", "order_index": 1},
            {"name": "Narrative Writing", "year_group": "Year 8", "key_stage": "KS3", "order_index": 2},
            {"name": "Persuasive Writing", "year_group": "Year 9", "key_stage": "KS3", "order_index": 3},
            {"name": "Language Analysis — AQA Paper 1", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-English-Language-P1", "order_index": 10},
            {"name": "Language Analysis — AQA Paper 2", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-English-Language-P2", "order_index": 11},
            {"name": "Descriptive Writing", "year_group": "Year 11", "key_stage": "KS4", "order_index": 12},
            {"name": "Spoken Language", "year_group": "Year 11", "key_stage": "KS4", "order_index": 13},
        ],
    },
    {
        "name": "English Literature",
        "key_stage": "All",
        "description": "England National Curriculum English Literature",
        "topics": [
            {"name": "Shakespeare — Macbeth", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-English-Lit-Shakespeare", "order_index": 1},
            {"name": "Shakespeare — Romeo and Juliet", "year_group": "Year 10", "key_stage": "KS4", "order_index": 2},
            {"name": "19th Century Novel — A Christmas Carol", "year_group": "Year 10", "key_stage": "KS4", "order_index": 3},
            {"name": "Modern Prose — An Inspector Calls", "year_group": "Year 11", "key_stage": "KS4", "order_index": 4},
            {"name": "Poetry Anthology — Power and Conflict", "year_group": "Year 11", "key_stage": "KS4", "order_index": 5},
        ],
    },
    {
        "name": "Science — Biology",
        "key_stage": "All",
        "description": "GCSE Biology (England)",
        "topics": [
            {"name": "Cell Biology", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-Bio-1", "order_index": 1},
            {"name": "Organisation", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-Bio-2", "order_index": 2},
            {"name": "Infection and Response", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-Bio-3", "order_index": 3},
            {"name": "Bioenergetics", "year_group": "Year 10", "key_stage": "KS4", "curriculum_ref": "GCSE-Bio-4", "order_index": 4},
            {"name": "Homeostasis and Response", "year_group": "Year 11", "key_stage": "KS4", "curriculum_ref": "GCSE-Bio-5", "order_index": 5},
            {"name": "Inheritance, Variation and Evolution", "year_group": "Year 11", "key_stage": "KS4", "curriculum_ref": "GCSE-Bio-6", "order_index": 6},
            {"name": "Ecology", "year_group": "Year 11", "key_stage": "KS4", "curriculum_ref": "GCSE-Bio-7", "order_index": 7},
        ],
    },
    {
        "name": "Science — Chemistry",
        "key_stage": "All",
        "description": "GCSE Chemistry (England)",
        "topics": [
            {"name": "Atomic Structure and the Periodic Table", "year_group": "Year 10", "key_stage": "KS4", "order_index": 1},
            {"name": "Bonding, Structure and Properties", "year_group": "Year 10", "key_stage": "KS4", "order_index": 2},
            {"name": "Chemical Quantities and Calculations", "year_group": "Year 10", "key_stage": "KS4", "order_index": 3},
            {"name": "Chemical Changes", "year_group": "Year 11", "key_stage": "KS4", "order_index": 4},
            {"name": "Energy Changes", "year_group": "Year 11", "key_stage": "KS4", "order_index": 5},
        ],
    },
    {
        "name": "Science — Physics",
        "key_stage": "All",
        "description": "GCSE Physics (England)",
        "topics": [
            {"name": "Forces", "year_group": "Year 10", "key_stage": "KS4", "order_index": 1},
            {"name": "Energy", "year_group": "Year 10", "key_stage": "KS4", "order_index": 2},
            {"name": "Waves", "year_group": "Year 10", "key_stage": "KS4", "order_index": 3},
            {"name": "Electricity", "year_group": "Year 11", "key_stage": "KS4", "order_index": 4},
            {"name": "Magnetism and Electromagnetism", "year_group": "Year 11", "key_stage": "KS4", "order_index": 5},
            {"name": "Particle Model of Matter", "year_group": "Year 11", "key_stage": "KS4", "order_index": 6},
        ],
    },
    {
        "name": "History",
        "key_stage": "All",
        "description": "GCSE History (England)",
        "topics": [
            {"name": "Medicine Through Time", "year_group": "Year 10", "key_stage": "KS4", "order_index": 1},
            {"name": "The British Sector of the Western Front 1914-18", "year_group": "Year 10", "key_stage": "KS4", "order_index": 2},
            {"name": "Weimar and Nazi Germany 1918-39", "year_group": "Year 11", "key_stage": "KS4", "order_index": 3},
            {"name": "Early Elizabethan England 1558-88", "year_group": "Year 11", "key_stage": "KS4", "order_index": 4},
        ],
    },
    {
        "name": "Geography",
        "key_stage": "All",
        "description": "GCSE Geography (England)",
        "topics": [
            {"name": "The Challenge of Natural Hazards", "year_group": "Year 10", "key_stage": "KS4", "order_index": 1},
            {"name": "The Living World", "year_group": "Year 10", "key_stage": "KS4", "order_index": 2},
            {"name": "Physical Landscapes in the UK", "year_group": "Year 10", "key_stage": "KS4", "order_index": 3},
            {"name": "Urban Issues and Challenges", "year_group": "Year 11", "key_stage": "KS4", "order_index": 4},
            {"name": "The Changing Economic World", "year_group": "Year 11", "key_stage": "KS4", "order_index": 5},
        ],
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        db: AsyncSession

        print("Seeding subjects and topics...")
        for subj_data in SUBJECTS_AND_TOPICS:
            topics = subj_data.pop("topics")
            subject = Subject(**subj_data)
            db.add(subject)
            await db.flush()

            for t in topics:
                topic = Topic(subject_id=subject.id, **t)
                db.add(topic)

        print("Creating demo tutor account...")
        demo_user = User(
            email="demo@tutorflow.co.uk",
            password_hash=hash_password("Demo1234!"),
            role=UserRole.TUTOR,
            is_active=True,
            is_verified=True,
        )
        db.add(demo_user)
        await db.flush()

        demo_tutor = Tutor(
            user_id=demo_user.id,
            first_name="Alex",
            last_name="Taylor",
            bio="Experienced secondary school tutor specialising in Maths and English.",
            subjects_json=["Mathematics", "English Language", "English Literature"],
            qualifications_json=[
                {"title": "QTS", "institution": "University of Manchester"},
                {"title": "BSc Mathematics", "institution": "University of Leeds"},
            ],
        )
        db.add(demo_tutor)
        await db.flush()

        print("Creating demo students...")
        student1 = Student(
            tutor_id=demo_tutor.id,
            first_name="Jamie",
            last_name="Patel",
            year_group="Year 11",
            key_stage=KeyStage.KS4,
            ability_band=AbilityBand.HIGHER,
            send_notes="No identified SEND needs.",
            support_strategies="Responds well to worked examples before independent practice.",
        )
        db.add(student1)

        student2 = Student(
            tutor_id=demo_tutor.id,
            first_name="Chloe",
            last_name="Robinson",
            year_group="Year 10",
            key_stage=KeyStage.KS4,
            ability_band=AbilityBand.CORE,
            send_notes="Possible processing speed differences — benefits from extra thinking time.",
            support_strategies="Use bullet-point scaffolds. Chunk instructions. Verbal check-ins.",
            literacy_notes="Finds extended writing challenging. Sentence starters and frames help.",
            preferred_scaffolds="Step-by-step frames, visual organisers, worked examples first.",
            communication_preferences="Email to parent preferred. Student prefers verbal feedback.",
        )
        db.add(student2)

        await db.commit()
        print("\nSeed complete.")
        print("Demo tutor login: demo@tutorflow.co.uk / Demo1234!")
        print("Students: Jamie Patel (Year 11), Chloe Robinson (Year 10)")


if __name__ == "__main__":
    asyncio.run(seed())
