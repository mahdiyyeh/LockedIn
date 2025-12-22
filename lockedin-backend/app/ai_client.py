"""
AI Client Module for CommitCast

This module provides an abstraction layer for AI functionality using SpoonOS.

Agents:
1. Question Generator - Generates follow-up questions about commitments
2. Predictor - Predicts probability of commitment completion
3. Coach - Provides coaching/reflection messages after completion
"""

import os
import json
import asyncio
import time
from typing import Optional, Dict
from pathlib import Path
from collections import defaultdict

from dotenv import load_dotenv
from spoon_ai.chat import ChatBot

# Load environment variables from .env file
# Look for .env in the backend directory (parent of app/)
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    # Use override=True to ensure .env values are loaded even if env var is already set
    load_dotenv(env_path, override=True)
    print(f"[ai_client] Loaded .env file from: {env_path}")
else:
    print(f"[ai_client] Warning: .env file not found at {env_path}")


# -----------------------
# Rate Limiter
# -----------------------

class RateLimiter:
    """
    Simple rate limiter to prevent hitting OpenAI rate limits.
    Tracks last request time per operation type and enforces minimum delays.
    """
    def __init__(self, min_delay_seconds: float = 15.0):
        """
        Args:
            min_delay_seconds: Minimum time between requests of the same type (default: 15s)
        """
        self.min_delay = min_delay_seconds
        self.last_request_time: Dict[str, float] = defaultdict(lambda: 0.0)
        self._lock = asyncio.Lock()
    
    async def wait_if_needed(self, operation_type: str) -> None:
        """
        Wait if necessary to respect rate limits for the given operation type.
        
        Args:
            operation_type: Type of operation (e.g., "questions", "prediction", "coaching")
        """
        async with self._lock:
            last_time = self.last_request_time[operation_type]
            current_time = time.time()
            time_since_last = current_time - last_time
            
            if time_since_last < self.min_delay:
                wait_time = self.min_delay - time_since_last
                print(f"[ai_client] Rate limiter: Waiting {wait_time:.1f}s before {operation_type} request...")
                await asyncio.sleep(wait_time)
            
            self.last_request_time[operation_type] = time.time()


# Global rate limiter instance
# 15 seconds minimum between requests of the same type
# This ensures we stay well under OpenAI's free tier limit of ~3 requests/minute
_rate_limiter = RateLimiter(min_delay_seconds=15.0)


def get_chatbot() -> Optional[ChatBot]:
    """Get a configured ChatBot instance."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    
    # Remove quotes if present (common in .env files)
    if api_key.startswith('"') and api_key.endswith('"'):
        api_key = api_key[1:-1].strip()
    elif api_key.startswith("'") and api_key.endswith("'"):
        api_key = api_key[1:-1].strip()
    
    # Check if API key is missing or set to dummy value
    if not api_key or api_key == "dummy":
        print(f"[ai_client] Warning: OPENAI_API_KEY is not set or invalid. AI features will use fallbacks.")
        print(f"[ai_client] Debug: API key value: '{api_key[:10]}...' (length: {len(api_key)})")
        return None
    
    # Check if it looks like a valid OpenAI API key (starts with sk-)
    if not api_key.startswith("sk-"):
        print(f"[ai_client] Warning: OPENAI_API_KEY format appears invalid (should start with 'sk-'). AI features will use fallbacks.")
        print(f"[ai_client] Debug: API key starts with: '{api_key[:10]}...'")
        return None
    
    try:
        return ChatBot(
            model_name=os.getenv("DEFAULT_MODEL", "gpt-4o-mini"),
            llm_provider=os.getenv("DEFAULT_LLM_PROVIDER", "openai"),
        )
    except Exception as e:
        print(f"[ai_client] Error creating ChatBot: {e}")
        return None


async def generate_questions_for_commitment(
    commitment_title: str,
    commitment_description: str,
    commitment_category: str,
    deadline_days: int,
    user_completed_count: int = 0,
    user_failed_count: int = 0,
) -> tuple[list[str], bool]:
    """
    Generate follow-up questions to understand the commitment better.
    
    Returns a tuple of:
    - list of questions (3-7 questions)
    - bool indicating if rate limit was hit (True if rate limited, False otherwise)
    """
    chatbot = get_chatbot()
    if not chatbot:
        # Return fallback questions if AI is not available
        return ([
            "What's your main motivation for completing this?",
            "How many hours per day/week can you dedicate to this?",
            "What obstacles might prevent you from completing this?",
            "Have you attempted something similar before? What happened?",
            "Who can support you in achieving this goal?"
        ], False)
    
    system_prompt = """You are an AI coach helping users set realistic commitments.
Your job is to ask thoughtful follow-up questions to understand:
- How much effort/time the task requires
- What obstacles might come up
- The user's motivation and past experience
- Their available resources and support

Generate 3-5 short, specific questions. Be encouraging but realistic.
Return ONLY a JSON array of question strings, no other text."""

    user_prompt = f"""The user wants to commit to the following:

Title: {commitment_title}
Description: {commitment_description}
Category: {commitment_category}
Days until deadline: {deadline_days}
User's past completions: {user_completed_count}
User's past failures: {user_failed_count}

Generate follow-up questions to better understand this commitment."""

    # Rate limiting: Wait if needed before making request
    await _rate_limiter.wait_if_needed("questions")
    
    # Retry logic for rate limits
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            response = await chatbot.ask(
                messages=[{"role": "user", "content": user_prompt}],
                system_msg=system_prompt,
            )
            
            content = response.strip()
            # Parse JSON array
            questions = json.loads(content)
            if isinstance(questions, list):
                return (questions[:7], False)  # Cap at 7 questions, no rate limit
            return (["What's your main motivation for this commitment?",
                    "Have you attempted something similar before?",
                    "What obstacles do you anticipate?"], False)
        except Exception as e:
            error_str = str(e).lower()
            is_rate_limit = "rate limit" in error_str or "429" in error_str
            
            if is_rate_limit and attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                print(f"[ai_client] Rate limit hit, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})...")
                await asyncio.sleep(wait_time)
                continue
            else:
                if is_rate_limit:
                    print(f"[ai_client] Rate limit exceeded after {max_retries} attempts. Using fallback questions.")
                    print(f"[ai_client] Note: OpenAI has rate limits. Wait a few minutes and try again.")
                else:
                    print(f"[ai_client] Error generating questions: {e}")
                # Fallback questions - return with rate_limit flag
                return ([
                    "What's your main motivation for completing this?",
                    "How many hours per day/week can you dedicate to this?",
                    "What obstacles might prevent you from completing this?",
                    "Have you attempted something similar before? What happened?",
                    "Who can support you in achieving this goal?"
                ], is_rate_limit)


async def predict_commitment_outcome(
    commitment_title: str,
    commitment_description: str,
    commitment_category: str,
    deadline_days: int,
    context_messages: list[dict],
    user_completed_count: int = 0,
    user_failed_count: int = 0,
    user_success_rate: float = 0.5,
) -> tuple[dict, bool]:
    """
    Predict the probability that the user will complete the commitment.
    
    Returns a tuple of:
    - dict with:
      - probability: float between 0 and 1
      - explanation: string explaining the prediction
      - confidence_label: "high", "medium", or "low"
    - bool indicating if rate limit was hit (True if rate limited, False otherwise)
    """
    chatbot = get_chatbot()
    if not chatbot:
        # Return fallback prediction if AI is not available
        return ({
            "probability": 0.5,
            "explanation": "AI prediction unavailable. Using neutral estimate.",
            "confidence_label": "low"
        }, False)
    
    # Format context messages for the prompt
    qa_context = ""
    for msg in context_messages:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        if role == "ai":
            qa_context += f"AI Question: {content}\n"
        elif role == "user":
            qa_context += f"User Answer: {content}\n"
    
    system_prompt = """You are an AI prediction engine for commitment tracking.
Based on the commitment details and user's answers to questions, predict the probability
of successful completion.

Consider:
- Specificity and clarity of the commitment
- User's responses showing preparation and motivation
- Time available vs. complexity
- Past success rate
- Potential obstacles mentioned

Return ONLY a valid JSON object with this exact structure:
{
  "probability": <number between 0 and 1>,
  "explanation": "<2-3 sentence explanation>",
  "confidence_label": "<high|medium|low>"
}

No other text, just the JSON object."""

    user_prompt = f"""Analyze this commitment:

Title: {commitment_title}
Description: {commitment_description}
Category: {commitment_category}
Days until deadline: {deadline_days}
User's past success rate: {user_success_rate:.0%} ({user_completed_count} completed, {user_failed_count} failed)

Q&A Context:
{qa_context if qa_context else "No additional context provided."}

Predict the probability of successful completion."""

    # Rate limiting: Wait if needed before making request
    await _rate_limiter.wait_if_needed("prediction")
    
    # Retry logic for rate limits
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            response = await chatbot.ask(
                messages=[{"role": "user", "content": user_prompt}],
                system_msg=system_prompt,
            )
            
            content = response.strip()
            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            result = json.loads(content)
            
            # Validate and normalize
            probability = float(result.get("probability", 0.5))
            probability = max(0.0, min(1.0, probability))
            
            explanation = str(result.get("explanation", "Unable to generate explanation."))
            
            confidence = str(result.get("confidence_label", "medium")).lower()
            if confidence not in ["high", "medium", "low"]:
                confidence = "medium"
            
            return ({
                "probability": probability,
                "explanation": explanation,
                "confidence_label": confidence
            }, False)
        except Exception as e:
            error_str = str(e).lower()
            is_rate_limit = "rate limit" in error_str or "429" in error_str
            
            if is_rate_limit and attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                print(f"[ai_client] Rate limit hit, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})...")
                await asyncio.sleep(wait_time)
                continue
            else:
                if is_rate_limit:
                    print(f"[ai_client] Rate limit exceeded after {max_retries} attempts. Using fallback prediction.")
                    print(f"[ai_client] Note: OpenAI has rate limits. Wait a few minutes and try again.")
                else:
                    print(f"[ai_client] Error predicting outcome: {e}")
                # Fallback prediction - return with rate_limit flag
                explanation_msg = "Unable to generate AI prediction due to rate limits. Using neutral estimate. Please try again in a few minutes." if is_rate_limit else "Unable to generate AI prediction. Using neutral estimate."
                return ({
                    "probability": 0.5,
                    "explanation": explanation_msg,
                    "confidence_label": "low"
                }, is_rate_limit)


async def coaching_reflection(
    commitment_title: str,
    commitment_description: str,
    outcome: str,  # "completed" or "failed"
    prediction_probability: Optional[float],
    context_messages: list[dict],
    completion_report: Optional[str] = None,
) -> str:
    """
    Generate a coaching/reflection message after the commitment is resolved.
    
    Returns a supportive message reflecting on the outcome.
    """
    chatbot = get_chatbot()
    if not chatbot:
        # Return fallback message if AI is not available
        if outcome == "completed":
            return "Congratulations on completing your commitment! Every success builds momentum for the next goal."
        else:
            return "It's okay that this one didn't work out. Reflect on what you learned and use it to set yourself up for success next time."
    
    # Format context messages
    qa_context = ""
    for msg in context_messages:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        if role == "ai":
            qa_context += f"AI: {content}\n"
        elif role == "user":
            qa_context += f"User: {content}\n"
    
    prediction_text = ""
    if prediction_probability is not None:
        prediction_text = f"The AI had predicted a {prediction_probability:.0%} chance of success."
    
    outcome_text = "successfully completed" if outcome == "completed" else "not completed"
    
    system_prompt = """You are a supportive AI coach providing reflection after a commitment outcome.
Be encouraging regardless of the outcome. If they succeeded, celebrate and reinforce good habits.
If they didn't complete it, be understanding, help identify learnings, and encourage future attempts.

Keep your message to 2-4 sentences. Be warm and personal."""

    user_prompt = f"""The user had committed to:
Title: {commitment_title}
Description: {commitment_description}

{prediction_text}

Outcome: The commitment was {outcome_text}.
{f"User's reflection: {completion_report}" if completion_report else ""}

Previous Q&A context:
{qa_context if qa_context else "No context available."}

Provide a brief coaching message."""

    # Rate limiting: Wait if needed before making request
    await _rate_limiter.wait_if_needed("coaching")
    
    # Retry logic for rate limits
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            response = await chatbot.ask(
                messages=[{"role": "user", "content": user_prompt}],
                system_msg=system_prompt,
            )
            
            return response.strip()
        except Exception as e:
            error_str = str(e).lower()
            is_rate_limit = "rate limit" in error_str or "429" in error_str
            
            if is_rate_limit and attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                print(f"[ai_client] Rate limit hit, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})...")
                await asyncio.sleep(wait_time)
                continue
            else:
                if is_rate_limit:
                    print(f"[ai_client] Rate limit exceeded after {max_retries} attempts. Using fallback coaching message.")
                else:
                    print(f"[ai_client] Error generating coaching message: {e}")
                if outcome == "completed":
                    return "Congratulations on completing your commitment! Every success builds momentum for the next goal."
                else:
                    return "It's okay that this one didn't work out. Reflect on what you learned and use it to set yourself up for success next time."


# Heuristic scoring tool (can be used as fallback or supplement)
def compute_heuristic_probability(
    hours_required: float,
    hours_available: float,
    days_until_due: int,
    friend_support_score: float = 0.0,
    user_success_rate: float = 0.5,
) -> float:
    """
    Compute a heuristic probability based on available data.
    This can be used as a fallback or to supplement AI predictions.
    
    Returns a probability between 0 and 1.
    """
    if hours_required <= 0:
        return 1.0
    
    # Ratio of free hours to required hours (clipped)
    ratio = hours_available / max(hours_required, 0.1)
    ratio = max(0.0, min(ratio, 2.0))
    
    # Base probability from ratio
    base_prob = min(1.0, ratio / 1.5)
    
    # Time factor – more days until due helps, capped at 14 days
    time_factor = min(1.0, days_until_due / 14.0)
    
    # Friend support factor (-0.1 to +0.1)
    friend_factor = 0.1 * max(-1.0, min(friend_support_score, 1.0))
    
    # User history factor
    history_factor = 0.1 * (user_success_rate - 0.5)
    
    prob = base_prob * 0.5 + time_factor * 0.3 + friend_factor + history_factor + 0.1
    prob = max(0.0, min(prob, 1.0))
    
    return round(prob, 3)
