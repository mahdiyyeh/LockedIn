# Locked In

**Locked In** (formerly "CommitCast") is a social accountability + prediction app where users create commitments (tasks with deadlines), get AI-powered success predictions, and let others bet virtual points on outcomes.

## Features

- 🎯 Create commitments with deadline and description
- 🤖 AI follow-up questions and success predictions
- 💰 Social betting with virtual points
- 📊 Dashboard grouped by status (active, completed, failed)
- 🏆 AI coaching/reflection after outcome resolution
- 🌍 Public commitments and community comments

## Tech Stack

### Backend

- FastAPI (async web framework) — source: lockedin-backend/app/main.py
- SQLAlchemy + SQLite — models: lockedin-backend/app/models.py
- AI layer: lockedin-backend/app/ai_client.py (wraps OpenAI/Spoon-like providers)
- JWT auth + bcrypt password hashing — implemented in lockedin-backend/app/main.py
- Requirements: lockedin-backend/requirements.txt

### Frontend

- React 19 + TypeScript — source: lockedin-frontend/src
- Vite — lockedin-frontend/vite.config.ts
- Tailwind CSS — lockedin-frontend/tailwind.config.js
- React Router, Radix UI components
- API client: lockedin-frontend/src/api.ts
- Types: lockedin-frontend/src/types.ts
- Package config: lockedin-frontend/package.json

## Important files (quick)

- lockedin-backend/app/main.py — backend routes, DB setup, auth
- lockedin-backend/app/models.py — SQLAlchemy models
- lockedin-backend/app/ai_client.py — generate questions, predict outcome, coaching
- lockedin-backend/.env (template) — env vars (DO NOT COMMIT SECRETS)
- lockedin-frontend/src/api.ts — frontend API helpers and base URL
- lockedin-frontend/src/pages & components — UI

## Setup

Prereqs: Python 3.10+, Node.js 18+, OpenAI API key (or equivalent)

1. Clone

```bash
git clone <repo-url>
cd LockedIn
```

2. Backend

```bash
cd lockedin-backend
python -m venv venv
source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
```

Create `.env` in lockedin-backend with at least:

```
OPENAI_API_KEY=sk-...
SECRET_KEY=your-secret-key  # optional for dev
DEFAULT_LLM_PROVIDER=openai  # optional
DEFAULT_MODEL=gpt-4o        # optional
```

Run:

```bash
export OPENAI_API_KEY="your-openai-api-key"
uvicorn app.main:app --reload
```

Default backend: http://127.0.0.1:8000 — API docs at /docs

Notes: the backend currently creates a local SQLite DB file (commitcast.db by default in config). Rename in code if you prefer lockedin.db.

3. Frontend

```bash
cd lockedin-frontend
npm install
npm run dev
```

Default frontend: http://localhost:5173

4. Running both
   Terminal 1:

```bash
cd lockedin-backend
source venv/bin/activate
export OPENAI_API_KEY="your-key"
uvicorn app.main:app --reload
```

Terminal 2:

```bash
cd lockedin-frontend
npm run dev
```

## API Endpoints (implemented in lockedin-backend/app/main.py)

Auth

- POST /auth/register
- POST /auth/login
- GET /auth/me

Commitments

- POST /commitments
- GET /commitments/my
- GET /commitments/public
- GET /commitments/{id}
- POST /commitments/{id}/complete

AI

- POST /commitments/{id}/ai/questions -> generate follow-up questions (app.ai_client.generate_questions_for_commitment)
- POST /commitments/{id}/ai/answer -> submit AI answer
- POST /commitments/{id}/ai/predict -> get success prediction (app.ai_client.predict_commitment_outcome)

Bets & Comments

- GET /commitments/{id}/bets
- POST /commitments/{id}/bets
- GET /commitments/{id}/comments
- POST /commitments/{id}/comments

User

- GET /me/balance
- GET /me/stats

## AI architecture

- ai_client.py exposes:
  - generate_questions_for_commitment(commitment) — returns 3–5 follow-ups
  - predict_commitment_outcome(commitment, answers) — probability, explanation, confidence
  - coaching_reflection(commitment, outcome) — supportive reflection message
- Designed to be swappable for Spoon/SpoonOS or other LLM providers (spoon-ai-sdk may be present in requirements)

## Development / Production

Backend production:

```bash
cd lockedin-backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend build:

```bash
cd lockedin-frontend
npm run build
npm run preview
```

## Notes & TODOs

- Update DB filename/reference if you want lockedin.db instead of commitcast.db (configured in lockedin-backend/app/main.py).
- Keep backend Pydantic models and frontend types in sync (lockedin-backend/app/main.py vs lockedin-frontend/src/types.ts).
- Ensure .env not committed.

## License

MIT
