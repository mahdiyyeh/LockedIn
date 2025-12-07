"""
CommitCast Backend API

FastAPI application with JWT authentication, commitment management,
betting system, and AI predictions using SpoonOS.
"""

from datetime import datetime, timedelta
import os
import uuid
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import JWTError, jwt

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from .models import (
    Base, User, Commitment, Bet, UserBalance,
    CommitmentContextMessage, CoachingMessage, Comment
)
from .ai_client import (
    generate_questions_for_commitment,
    predict_commitment_outcome,
    coaching_reflection
)

# -----------------------
# Configuration
# -----------------------

SECRET_KEY = os.getenv("SECRET_KEY", "commitcast-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

DATABASE_URL = "sqlite:///./commitcast.db"

# -----------------------
# Security Setup
# -----------------------

security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# -----------------------
# Database setup
# -----------------------

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------
# FastAPI app
# -----------------------

app = FastAPI(title="CommitCast API", version="1.0.0")

# Allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Create DB tables if they don't exist
    Base.metadata.create_all(bind=engine)


# -----------------------
# Pydantic Schemas
# -----------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserOut(BaseModel):
    id: int
    email: str
    display_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class CommitmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "personal"
    deadline: datetime
    visibility: str = "public"


class CommitmentOut(BaseModel):
    id: int
    public_id: str
    title: str
    description: Optional[str]
    category: str
    deadline: datetime
    visibility: str
    status: str
    prediction_probability: Optional[float]
    prediction_explanation: Optional[str]
    ai_confidence_label: Optional[str]
    completion_report: Optional[str]
    evidence_url: Optional[str]
    created_at: datetime
    owner_id: int
    owner_display_name: Optional[str] = None

    class Config:
        from_attributes = True


class CommitmentCompleteRequest(BaseModel):
    completed: bool
    completion_report: Optional[str] = None
    evidence_url: Optional[str] = None


class AnswerRequest(BaseModel):
    answer: str


class BetCreate(BaseModel):
    direction: str  # "will_complete" or "will_fail"
    amount: int


class BetOut(BaseModel):
    id: int
    commitment_id: int
    bettor_id: int
    bettor_display_name: str
    direction: str
    amount: int
    created_at: datetime
    resolved: bool
    payout: Optional[int]

    class Config:
        from_attributes = True


class BalanceOut(BaseModel):
    balance: int


class ContextMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionResult(BaseModel):
    probability: float
    explanation: str
    confidence_label: str


class CoachingMessageOut(BaseModel):
    id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserStatsOut(BaseModel):
    display_name: str
    email: str
    completed_count: int
    failed_count: int
    pending_count: int
    success_rate: float
    balance: int


# -----------------------
# Auth Dependencies
# -----------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


def get_optional_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[User]:
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    return db.query(User).filter(User.id == int(user_id)).first()


# -----------------------
# Helper functions
# -----------------------

def generate_public_id() -> str:
    """Generate a short global commitment code, e.g. 'A1B2C3D4'."""
    return uuid.uuid4().hex[:8].upper()


def get_user_stats(db: Session, user_id: int) -> dict:
    """Get user completion statistics."""
    commitments = db.query(Commitment).filter(Commitment.owner_id == user_id).all()
    completed = sum(1 for c in commitments if c.status == "completed")
    failed = sum(1 for c in commitments if c.status == "failed")
    pending = sum(1 for c in commitments if c.status == "pending")
    total_resolved = completed + failed
    success_rate = completed / total_resolved if total_resolved > 0 else 0.5
    return {
        "completed": completed,
        "failed": failed,
        "pending": pending,
        "success_rate": success_rate
    }


def resolve_bets(db: Session, commitment: Commitment):
    """Resolve all bets for a completed/failed commitment."""
    bets = db.query(Bet).filter(
        Bet.commitment_id == commitment.id,
        Bet.resolved == False
    ).all()
    
    if not bets:
        return
    
    outcome_is_complete = commitment.status == "completed"
    
    # Separate winners and losers
    winners = []
    losers = []
    for bet in bets:
        is_winner = (
            (bet.direction == "will_complete" and outcome_is_complete) or
            (bet.direction == "will_fail" and not outcome_is_complete)
        )
        if is_winner:
            winners.append(bet)
        else:
            losers.append(bet)
    
    # Calculate pot from losers
    pot = sum(bet.amount for bet in losers)
    total_winner_stakes = sum(bet.amount for bet in winners)
    
    # Distribute winnings
    for bet in losers:
        bet.resolved = True
        bet.payout = -bet.amount  # Lost their stake
        db.add(bet)
    
    for bet in winners:
        bet.resolved = True
        if total_winner_stakes > 0:
            share = (bet.amount / total_winner_stakes) * pot
            bet.payout = bet.amount + int(share)  # Get stake back + share of pot
        else:
            bet.payout = bet.amount  # Just get stake back
        
        # Update winner's balance
        balance = db.query(UserBalance).filter(UserBalance.user_id == bet.bettor_id).first()
        if balance:
            balance.balance += bet.payout
            db.add(balance)
        
        db.add(bet)
    
    db.commit()


# -----------------------
# Root endpoint
# -----------------------

@app.get("/")
def read_root():
    return {"message": "CommitCast backend is running 🚀"}


# -----------------------
# Auth endpoints
# -----------------------

@app.post("/auth/register", response_model=AuthResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user with hashed password
    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        display_name=data.display_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create initial balance
    balance = UserBalance(user_id=user.id, balance=500)
    db.add(balance)
    db.commit()
    
    # Generate token
    token = create_access_token({"sub": str(user.id)})
    
    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name
        }
    )


@app.post("/auth/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(user.id)})
    
    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name
        }
    )


@app.get("/auth/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# -----------------------
# Balance endpoint
# -----------------------

@app.get("/me/balance", response_model=BalanceOut)
def get_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    balance = db.query(UserBalance).filter(UserBalance.user_id == current_user.id).first()
    if not balance:
        # Create balance if it doesn't exist
        balance = UserBalance(user_id=current_user.id, balance=500)
        db.add(balance)
        db.commit()
        db.refresh(balance)
    
    return BalanceOut(balance=balance.balance)


@app.get("/me/stats", response_model=UserStatsOut)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = get_user_stats(db, current_user.id)
    balance = db.query(UserBalance).filter(UserBalance.user_id == current_user.id).first()
    
    return UserStatsOut(
        display_name=current_user.display_name,
        email=current_user.email,
        completed_count=stats["completed"],
        failed_count=stats["failed"],
        pending_count=stats["pending"],
        success_rate=stats["success_rate"],
        balance=balance.balance if balance else 500
    )


# -----------------------
# Commitment endpoints
# -----------------------

@app.post("/commitments", response_model=CommitmentOut)
def create_commitment(
    data: CommitmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Generate a unique public_id
    public_id = generate_public_id()
    while db.query(Commitment).filter(Commitment.public_id == public_id).first():
        public_id = generate_public_id()
    
    commitment = Commitment(
        owner_id=current_user.id,
        public_id=public_id,
        title=data.title,
        description=data.description,
        category=data.category,
        deadline=data.deadline,
        visibility=data.visibility,
        status="pending"
    )
    db.add(commitment)
    db.commit()
    db.refresh(commitment)
    
    return CommitmentOut(
        **{k: v for k, v in commitment.__dict__.items() if not k.startswith('_')},
        owner_display_name=current_user.display_name
    )


@app.get("/commitments/my", response_model=List[CommitmentOut])
def list_my_commitments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    commitments = db.query(Commitment).filter(Commitment.owner_id == current_user.id).all()
    return [
        CommitmentOut(
            **{k: v for k, v in c.__dict__.items() if not k.startswith('_')},
            owner_display_name=current_user.display_name
        )
        for c in commitments
    ]


@app.get("/commitments/public", response_model=List[CommitmentOut])
def list_public_commitments(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    commitments = db.query(Commitment).filter(Commitment.visibility == "public").limit(50).all()
    result = []
    for c in commitments:
        owner = db.query(User).filter(User.id == c.owner_id).first()
        result.append(CommitmentOut(
            **{k: v for k, v in c.__dict__.items() if not k.startswith('_')},
            owner_display_name=owner.display_name if owner else "Unknown"
        ))
    return result


@app.get("/commitments/{commitment_id}", response_model=CommitmentOut)
def get_commitment(
    commitment_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    commitment = db.query(Commitment).filter(Commitment.id == commitment_id).first()
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    
    # Check visibility
    if commitment.visibility == "private":
        if not current_user or current_user.id != commitment.owner_id:
            raise HTTPException(status_code=403, detail="This commitment is private")
    
    owner = db.query(User).filter(User.id == commitment.owner_id).first()
    
    return CommitmentOut(
        **{k: v for k, v in commitment.__dict__.items() if not k.startswith('_')},
        owner_display_name=owner.display_name if owner else "Unknown"
    )


@app.get("/commitments/{commitment_id}/context", response_model=List[ContextMessageOut])
def get_commitment_context(
    commitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    commitment = db.query(Commitment).filter(Commitment.id == commitment_id).first()
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    
    messages = db.query(CommitmentContextMessage).filter(
        CommitmentContextMessage.commitment_id == commitment_id
    ).order_by(CommitmentContextMessage.created_at).all()
    
    return messages


@app.get("/commitments/{commitment_id}/coaching", response_model=List[CoachingMessageOut])
def get_coaching_messages(
    commitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = db.query(CoachingMessage).filter(
        CoachingMessage.commitment_id == commitment_id
    ).order_by(CoachingMessage.created_at).all()
    
    return messages


@app.delete("/commitments/{commitment_id}")
def delete_commitment(
    commitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    commitment = db.query(Commitment).filter(
        Commitment.id == commitment_id,
        Commitment.owner_id == current_user.id
    ).first()
    
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found or you don't have permission to delete it")
    
    # Check if there are any bets on this commitment
    bets_count = db.query(Bet).filter(Bet.commitment_id == commitment_id).count()
    if bets_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete commitment with existing bets")
    
    # Delete related context messages
    db.query(CommitmentContextMessage).filter(
        CommitmentContextMessage.commitment_id == commitment_id
    ).delete()
    
    # Delete related coaching messages
    db.query(CoachingMessage).filter(
        CoachingMessage.commitment_id == commitment_id
    ).delete()
    
    # Delete the commitment
    db.delete(commitment)
    db.commit()
    
    return {"status": "ok", "message": "Commitment deleted successfully"}


# -----------------------
# AI endpoints
# -----------------------

@app.post("/commitments/{commitment_id}/ai/questions", response_model=List[str])
async def generate_ai_questions(
    commitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    commitment = db.query(Commitment).filter(
        Commitment.id == commitment_id,
        Commitment.owner_id == current_user.id
    ).first()
    
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    
    # Get user stats
    stats = get_user_stats(db, current_user.id)
    days_until_deadline = max(0, (commitment.deadline - datetime.utcnow()).days)
    
    # Generate questions
    questions = await generate_questions_for_commitment(
        commitment_title=commitment.title,
        commitment_description=commitment.description or "",
        commitment_category=commitment.category,
        deadline_days=days_until_deadline,
        user_completed_count=stats["completed"],
        user_failed_count=stats["failed"]
    )
    
    # Store questions as context messages
    for question in questions:
        msg = CommitmentContextMessage(
            commitment_id=commitment.id,
            role="ai",
            content=question
        )
        db.add(msg)
    
    db.commit()
    
    return questions


@app.post("/commitments/{commitment_id}/ai/answer")
async def submit_ai_answer(
    commitment_id: int,
    data: AnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    commitment = db.query(Commitment).filter(
        Commitment.id == commitment_id,
        Commitment.owner_id == current_user.id
    ).first()
    
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    
    # Store answer as context message
    msg = CommitmentContextMessage(
        commitment_id=commitment.id,
        role="user",
        content=data.answer
    )
    db.add(msg)
    db.commit()
    
    return {"status": "ok", "message": "Answer recorded"}


@app.post("/commitments/{commitment_id}/ai/predict", response_model=PredictionResult)
async def predict_commitment(
    commitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    commitment = db.query(Commitment).filter(
        Commitment.id == commitment_id,
        Commitment.owner_id == current_user.id
    ).first()
    
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    
    # Get context messages
    context_messages = db.query(CommitmentContextMessage).filter(
        CommitmentContextMessage.commitment_id == commitment_id
    ).order_by(CommitmentContextMessage.created_at).all()
    
    context_list = [
        {"role": msg.role, "content": msg.content}
        for msg in context_messages
    ]
    
    # Get user stats
    stats = get_user_stats(db, current_user.id)
    days_until_deadline = max(0, (commitment.deadline - datetime.utcnow()).days)
    
    # Get prediction
    result = await predict_commitment_outcome(
        commitment_title=commitment.title,
        commitment_description=commitment.description or "",
        commitment_category=commitment.category,
        deadline_days=days_until_deadline,
        context_messages=context_list,
        user_completed_count=stats["completed"],
        user_failed_count=stats["failed"],
        user_success_rate=stats["success_rate"]
    )
    
    # Update commitment with prediction
    commitment.prediction_probability = result["probability"]
    commitment.prediction_explanation = result["explanation"]
    commitment.ai_confidence_label = result["confidence_label"]
    db.add(commitment)
    db.commit()
    
    return PredictionResult(
        probability=result["probability"],
        explanation=result["explanation"],
        confidence_label=result["confidence_label"]
    )


@app.post("/commitments/{commitment_id}/complete", response_model=CommitmentOut)
async def complete_commitment(
    commitment_id: int,
    data: CommitmentCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    commitment = db.query(Commitment).filter(
        Commitment.id == commitment_id,
        Commitment.owner_id == current_user.id
    ).first()
    
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    
    if commitment.status != "pending":
        raise HTTPException(status_code=400, detail="Commitment is already resolved")
    
    # Update status
    commitment.status = "completed" if data.completed else "failed"
    commitment.completed_at = datetime.utcnow()
    commitment.completion_report = data.completion_report
    commitment.evidence_url = data.evidence_url
    
    db.add(commitment)
    db.commit()
    
    # Resolve bets
    resolve_bets(db, commitment)
    
    # Generate coaching message
    context_messages = db.query(CommitmentContextMessage).filter(
        CommitmentContextMessage.commitment_id == commitment_id
    ).all()
    
    context_list = [
        {"role": msg.role, "content": msg.content}
        for msg in context_messages
    ]
    
    try:
        coaching_content = await coaching_reflection(
            commitment_title=commitment.title,
            commitment_description=commitment.description or "",
            outcome=commitment.status,
            prediction_probability=commitment.prediction_probability,
            context_messages=context_list,
            completion_report=data.completion_report
        )
        
        coaching_msg = CoachingMessage(
            commitment_id=commitment.id,
            role="ai",
            content=coaching_content
        )
        db.add(coaching_msg)
        db.commit()
    except Exception as e:
        print(f"[main] Failed to generate coaching message: {e}")
    
    db.refresh(commitment)
    
    owner = db.query(User).filter(User.id == commitment.owner_id).first()
    
    return CommitmentOut(
        **{k: v for k, v in commitment.__dict__.items() if not k.startswith('_')},
        owner_display_name=owner.display_name if owner else "Unknown"
    )


# -----------------------
# Bet endpoints
# -----------------------

@app.get("/commitments/{commitment_id}/bets", response_model=List[BetOut])
def list_bets(
    commitment_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    bets = db.query(Bet).filter(Bet.commitment_id == commitment_id).all()
    result = []
    for bet in bets:
        bettor = db.query(User).filter(User.id == bet.bettor_id).first()
        result.append(BetOut(
            id=bet.id,
            commitment_id=bet.commitment_id,
            bettor_id=bet.bettor_id,
            bettor_display_name=bettor.display_name if bettor else "Unknown",
            direction=bet.direction,
            amount=bet.amount,
            created_at=bet.created_at,
            resolved=bet.resolved,
            payout=bet.payout
        ))
    return result


@app.post("/commitments/{commitment_id}/bets", response_model=BetOut)
def create_bet(
    commitment_id: int,
    data: BetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    commitment = db.query(Commitment).filter(Commitment.id == commitment_id).first()
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    
    # Cannot bet on your own commitment
    if commitment.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot bet on your own commitment")
    
    # Commitment must be pending
    if commitment.status != "pending":
        raise HTTPException(status_code=400, detail="Cannot bet on a resolved commitment")
    
    # Check deadline hasn't passed
    if commitment.deadline <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cannot bet after deadline has passed")
    
    # Validate direction
    if data.direction not in ["will_complete", "will_fail"]:
        raise HTTPException(status_code=400, detail="Invalid bet direction")
    
    # Validate amount
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Bet amount must be positive")
    
    # Check balance
    balance = db.query(UserBalance).filter(UserBalance.user_id == current_user.id).first()
    if not balance:
        balance = UserBalance(user_id=current_user.id, balance=500)
        db.add(balance)
        db.commit()
        db.refresh(balance)
    
    if balance.balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Deduct amount from balance
    balance.balance -= data.amount
    db.add(balance)
    
    # Create bet
    bet = Bet(
        commitment_id=commitment_id,
        bettor_id=current_user.id,
        direction=data.direction,
        amount=data.amount
    )
    db.add(bet)
    db.commit()
    db.refresh(bet)
    
    return BetOut(
        id=bet.id,
        commitment_id=bet.commitment_id,
        bettor_id=bet.bettor_id,
        bettor_display_name=current_user.display_name,
        direction=bet.direction,
        amount=bet.amount,
        created_at=bet.created_at,
        resolved=bet.resolved,
        payout=bet.payout
    )


@app.delete("/bets/{bet_id}")
def delete_bet(
    bet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete/cancel a bet. Only allowed if the commitment is still pending."""
    bet = db.query(Bet).filter(Bet.id == bet_id).first()
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    # Only the bettor can delete their bet
    if bet.bettor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own bets")
    
    # Check if bet is already resolved
    if bet.resolved:
        raise HTTPException(status_code=400, detail="Cannot delete a resolved bet")
    
    # Check if commitment is still pending
    commitment = db.query(Commitment).filter(Commitment.id == bet.commitment_id).first()
    if commitment and commitment.status != "pending":
        raise HTTPException(status_code=400, detail="Cannot delete bet on a resolved goal")
    
    # Refund the bet amount to user's balance
    balance = db.query(UserBalance).filter(UserBalance.user_id == current_user.id).first()
    if balance:
        balance.balance += bet.amount
        db.add(balance)
    
    # Delete the bet
    db.delete(bet)
    db.commit()
    
    return {"status": "success", "message": "Bet cancelled and refunded"}


# -----------------------
# Comments Endpoints
# -----------------------

class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    commitment_id: int
    user_id: int
    user_display_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


@app.get("/commitments/{commitment_id}/comments", response_model=List[CommentOut])
def list_comments(
    commitment_id: int,
    db: Session = Depends(get_db),
):
    """List all comments for a goal."""
    commitment = db.query(Commitment).filter(Commitment.id == commitment_id).first()
    if not commitment:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    comments = db.query(Comment).filter(
        Comment.commitment_id == commitment_id
    ).order_by(Comment.created_at.asc()).all()
    
    result = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        result.append(CommentOut(
            id=comment.id,
            commitment_id=comment.commitment_id,
            user_id=comment.user_id,
            user_display_name=user.display_name if user else "Unknown",
            content=comment.content,
            created_at=comment.created_at
        ))
    return result


@app.post("/commitments/{commitment_id}/comments", response_model=CommentOut)
def create_comment(
    commitment_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a comment to a goal."""
    commitment = db.query(Commitment).filter(Commitment.id == commitment_id).first()
    if not commitment:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    
    comment = Comment(
        commitment_id=commitment_id,
        user_id=current_user.id,
        content=data.content.strip()
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return CommentOut(
        id=comment.id,
        commitment_id=comment.commitment_id,
        user_id=comment.user_id,
        user_display_name=current_user.display_name,
        content=comment.content,
        created_at=comment.created_at
    )


@app.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a comment. Only the comment author can delete it."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only the author can delete their comment
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    
    db.delete(comment)
    db.commit()
    
    return {"status": "success", "message": "Comment deleted"}
