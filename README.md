# TutorFlow — UK Tutoring Operating System

A teacher-led, privacy-first tutoring platform for UK secondary and college educators.

> **Not a generic LMS. Not an AI tutor. A professional operating system for tutors.**

---

## What This Is

TutorFlow helps professional tutors:
- Plan curriculum-aligned lessons (with AI assistance)
- Deliver and record sessions with structured notes
- Track student progress using a clear mastery model
- Generate differentiated support and homework tasks
- Produce parent-friendly reports (AI-drafted, tutor-approved)
- Get explainable, rule-based teaching recommendations

All AI outputs require tutor review and approval. The tutor is always in control.

---

## Quick Start (Docker)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY and change POSTGRES_PASSWORD

# 2. Start all services
docker-compose up -d

# 3. Seed demo data (subjects, topics, demo tutor account)
docker-compose exec backend python scripts/seed.py

# 4. Open the app
# Frontend: http://localhost:3000
# Backend API docs: http://localhost:8000/docs
```

**Demo login:** `demo@tutorflow.co.uk` / `Demo1234!`

---

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp ../.env.example .env
# Edit .env with your local Postgres credentials

# Run migrations (or let development auto-create tables)
# alembic upgrade head

# Seed data
python scripts/seed.py

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing key (minimum 32 chars) |
| `ANTHROPIC_API_KEY` | Claude API key for AI features |
| `AI_MODEL` | Claude model (default: claude-opus-4-6) |
| `BACKEND_CORS_ORIGINS` | Allowed frontend origins |

---

## Architecture

```
tutorflow/
├── backend/          FastAPI API server
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── core/     auth, security, deps, exceptions
│   │   ├── models/   SQLAlchemy ORM models
│   │   ├── schemas/  Pydantic request/response schemas
│   │   ├── routers/  API endpoints
│   │   ├── services/ business logic
│   │   ├── ai/       Claude integration + prompts
│   │   └── analytics/ recommendation engine
│   ├── alembic/      database migrations
│   └── scripts/      seed.py
└── frontend/         Next.js 15 app
    └── src/
        ├── app/      App Router pages
        ├── components/
        ├── lib/      api.ts, utils.ts
        ├── stores/   auth.ts (Zustand)
        └── types/    TypeScript types
```

---

## User Roles

| Role | Access |
|------|--------|
| **Tutor** | Full access to own students, lesson plans, sessions, analytics, reports |
| **Student** | Own lessons, tasks, progress (read-only) |
| **Parent** | Linked child's approved reports and summaries (read-only) |

---

## AI Features

All AI features use Anthropic's Claude API, server-side only.

| Feature | Description |
|---------|-------------|
| Lesson plan generation | Full structured lesson from curriculum parameters |
| Quiz generation | Curriculum-aligned questions with answers |
| Homework generation | Structured follow-up tasks |
| Parent report drafting | Warm, professional parent summaries |

**Privacy rules:**
- No student full names or identifying data in AI prompts
- All AI outputs are marked as drafts requiring tutor approval
- Student data is never used for general model training

---

## Curriculum Coverage (Seed Data)

England National Curriculum:
- Mathematics (KS3, KS4, KS5)
- English Language (KS3, KS4)
- English Literature (KS4)
- Science: Biology, Chemistry, Physics (KS4)
- History (KS4)
- Geography (KS4)

Tutors can add custom subjects and topics.

---

## Mastery States

| State | Meaning |
|-------|---------|
| Not Started | Topic not yet covered |
| Taught | Covered in session, not yet practised |
| Practising | Some attempts, early stage |
| Developing | Making progress, not yet consistent |
| Secure | Consistently performing well |
| Needs Reteach | Scoring low after multiple attempts |
| Exceeded | Performing beyond expectation |

Mastery is computed automatically from assessment scores and can be overridden by the tutor.

---

## Security

- Bcrypt password hashing
- JWT access tokens (30 min) + httpOnly refresh token cookies (7 days)
- Role-based access control on every endpoint
- All write operations logged to audit trail
- Rate limiting on auth endpoints
- CORS locked to configured frontend origins
- No sensitive data in API error responses (production mode)
- Soft-delete for students (data retained)

---

## Phase 2 Roadmap

- [ ] Student portal with interactive lesson delivery
- [ ] Email/SMS notification delivery
- [ ] Calendar/timetable integration
- [ ] Parent/student account invite flow

## Phase 3 Roadmap

- [ ] ML-based progress prediction (once sufficient clean data exists)
- [ ] Multi-tutor SaaS with subscription billing
- [ ] School/MIS integrations (SIMS, Bromcom)
- [ ] Mobile app
- [ ] Video session recording + AI transcript summaries

---

## Licence

Private — not for public distribution.
Built for professional tutoring use in the United Kingdom.
