# CommitCast

**CommitCast** is a social accountability + prediction app where users create commitments (tasks with deadlines), get AI-powered success predictions, and let others bet virtual points on their outcomes.

## Features

- 🎯 **Create Commitments** - Set goals with deadlines and descriptions
- 🤖 **AI Predictions** - OpenAI-powered analysis that asks follow-up questions and predicts success probability
- 💰 **Social Betting** - Friends can bet virtual points on whether you'll complete your commitment
- 📊 **Track Progress** - Dashboard with your commitments grouped by status
- 🏆 **Coaching Messages** - AI provides reflection and coaching after you mark outcomes
- 🌍 **Public Commitments** - Share your goals publicly and get community support

## Tech Stack

### Backend
- **FastAPI** - Python async web framework
- **SQLAlchemy** - SQL ORM with SQLite database
- **OpenAI API** - AI predictions and coaching (designed for future Spoon-style agent swapping)
- **JWT Authentication** - Secure token-based auth with bcrypt password hashing

### Frontend
- **React 19** + **TypeScript**
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Radix UI** - Accessible UI primitives

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd CommitCast
```

### 2. Backend Setup

```bash
cd commitcast-backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-openai-api-key"
# Optional: export SECRET_KEY="your-secret-key"  # For JWT tokens

# Run the backend
uvicorn app.main:app --reload
```

The backend will be available at `http://127.0.0.1:8000`

**API Documentation**: Visit `http://127.0.0.1:8000/docs` for the interactive Swagger UI.

### 3. Frontend Setup

```bash
cd commitcast-frontend

# Install dependencies
npm install

# Run the frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Environment Variables

#### Backend (`commitcast-backend/`)

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `SECRET_KEY` | JWT signing secret (defaults to dev key) | No |

You can create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=sk-...
SECRET_KEY=your-production-secret-key
```

## Running Both Apps Together

**Terminal 1 - Backend:**
```bash
cd commitcast-backend
source venv/bin/activate
export OPENAI_API_KEY="your-key"
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd commitcast-frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

## API Endpoints

### Auth
- `POST /auth/register` - Create a new account
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Commitments
- `POST /commitments` - Create a new commitment
- `GET /commitments/my` - List your commitments
- `GET /commitments/public` - List public commitments
- `GET /commitments/{id}` - Get commitment details
- `POST /commitments/{id}/complete` - Mark commitment as completed/failed

### AI
- `POST /commitments/{id}/ai/questions` - Generate AI follow-up questions
- `POST /commitments/{id}/ai/answer` - Submit answer to AI question
- `POST /commitments/{id}/ai/predict` - Get AI success prediction

### Bets
- `GET /commitments/{id}/bets` - List bets on a commitment
- `POST /commitments/{id}/bets` - Place a bet

### User
- `GET /me/balance` - Get your point balance
- `GET /me/stats` - Get your stats (completed, failed, success rate)

## AI Architecture

The AI functionality is abstracted in `app/ai_client.py` with three main functions:

1. **`generate_questions_for_commitment()`** - Asks 3-5 follow-up questions about the commitment
2. **`predict_commitment_outcome()`** - Returns probability, explanation, and confidence level
3. **`coaching_reflection()`** - Provides supportive coaching message after resolution

This abstraction layer is designed to be easily swapped for a SpoonOS/Spoon AI agent system in the future.

## Development

### Build for Production

**Backend:**
```bash
cd commitcast-backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd commitcast-frontend
npm run build
npm run preview  # To test the production build
```

## License

MIT

