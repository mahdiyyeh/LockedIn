"""
SQLAlchemy Models for CommitCast

Data models for users, commitments, bets, and AI context.
"""

from datetime import datetime
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum
import enum

Base = declarative_base()


class CommitmentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    commitments = relationship("Commitment", back_populates="owner")
    bets = relationship("Bet", back_populates="bettor")
    balance = relationship("UserBalance", back_populates="user", uselist=False)
    comments = relationship("Comment", back_populates="user")


class Commitment(Base):
    __tablename__ = "commitments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Global, shareable commitment ID (public code)
    public_id = Column(String, unique=True, index=True, nullable=False)
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False, default="personal")
    deadline = Column(DateTime, nullable=False)
    visibility = Column(String, default="public")  # "public" or "private"
    
    # Status
    status = Column(String, default="pending")  # "pending", "completed", "failed", "expired"
    
    # AI prediction fields
    prediction_probability = Column(Float, nullable=True)
    prediction_explanation = Column(Text, nullable=True)
    ai_confidence_label = Column(String, nullable=True)  # "high", "medium", "low"
    
    # Reflection fields
    completion_report = Column(Text, nullable=True)
    evidence_url = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="commitments")
    bets = relationship("Bet", back_populates="commitment")
    context_messages = relationship("CommitmentContextMessage", back_populates="commitment")
    coaching_messages = relationship("CoachingMessage", back_populates="commitment")
    comments = relationship("Comment", back_populates="commitment")


class CommitmentContextMessage(Base):
    """Stores the Q&A dialogue with the AI."""
    __tablename__ = "commitment_context_messages"

    id = Column(Integer, primary_key=True, index=True)
    commitment_id = Column(Integer, ForeignKey("commitments.id"), nullable=False)
    role = Column(String, nullable=False)  # "system", "ai", or "user"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    commitment = relationship("Commitment", back_populates="context_messages")


class Bet(Base):
    __tablename__ = "bets"

    id = Column(Integer, primary_key=True, index=True)
    commitment_id = Column(Integer, ForeignKey("commitments.id"), nullable=False)
    bettor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    direction = Column(String, nullable=False)  # "will_complete" or "will_fail"
    amount = Column(Integer, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
    payout = Column(Integer, nullable=True)  # Can be positive, zero, or negative

    commitment = relationship("Commitment", back_populates="bets")
    bettor = relationship("User", back_populates="bets")


class UserBalance(Base):
    __tablename__ = "user_balances"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    balance = Column(Integer, default=500)  # Starting balance for new users
    
    user = relationship("User", back_populates="balance")


class CoachingMessage(Base):
    """AI coaching/reflection messages after commitment resolution."""
    __tablename__ = "coaching_messages"

    id = Column(Integer, primary_key=True, index=True)
    commitment_id = Column(Integer, ForeignKey("commitments.id"), nullable=False)
    role = Column(String, default="ai")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    commitment = relationship("Commitment", back_populates="coaching_messages")


class Comment(Base):
    """User comments on commitments/goals."""
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    commitment_id = Column(Integer, ForeignKey("commitments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    commitment = relationship("Commitment", back_populates="comments")
    user = relationship("User", back_populates="comments")
