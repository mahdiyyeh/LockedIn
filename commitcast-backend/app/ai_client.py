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
from typing import Optional

from spoon_ai.chat import ChatBot


def get_chatbot() -> ChatBot:
    """Get a configured ChatBot instance."""
    return ChatBot(
        model_name=os.getenv("DEFAULT_MODEL", "gpt-4o-mini"),
        llm_provider=os.getenv("DEFAULT_LLM_PROVIDER", "openai"),
    )


async def generate_questions_for_commitment(
    commitment_title: str,
    commitment_description: str,
    commitment_category: str,
    deadline_days: int,
    user_completed_count: int = 0,
    user_failed_count: int = 0,
) -> list[str]:
    """
    Generate follow-up questions to understand the commitment better.
    
    Returns a list of 3-7 questions about effort, time, obstacles, 
    motivation, and previous attempts.
    """
    chatbot = get_chatbot()
    
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

    try:
        response = await chatbot.ask(
            messages=[{"role": "user", "content": user_prompt}],
            system_msg=system_prompt,
        )
        
        content = response.strip()
        # Parse JSON array
        questions = json.loads(content)
        if isinstance(questions, list):
            return questions[:7]  # Cap at 7 questions
        return ["What's your main motivation for this commitment?",
                "Have you attempted something similar before?",
                "What obstacles do you anticipate?"]
    except Exception as e:
        print(f"[ai_client] Error generating questions: {e}")
        # Fallback questions
        return [
            "What's your main motivation for completing this?",
            "How many hours per day/week can you dedicate to this?",
            "What obstacles might prevent you from completing this?",
            "Have you attempted something similar before? What happened?",
            "Who can support you in achieving this goal?"
        ]


async def predict_commitment_outcome(
    commitment_title: str,
    commitment_description: str,
    commitment_category: str,
    deadline_days: int,
    context_messages: list[dict],
    user_completed_count: int = 0,
    user_failed_count: int = 0,
    user_success_rate: float = 0.5,
) -> dict:
    """
    Predict the probability that the user will complete the commitment.
    
    Returns a dict with:
    - probability: float between 0 and 1
    - explanation: string explaining the prediction
    - confidence_label: "high", "medium", or "low"
    """
    chatbot = get_chatbot()
    
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
        
        return {
            "probability": probability,
            "explanation": explanation,
            "confidence_label": confidence
        }
    except Exception as e:
        print(f"[ai_client] Error predicting outcome: {e}")
        # Fallback prediction
        return {
            "probability": 0.5,
            "explanation": "Unable to generate AI prediction. Using neutral estimate.",
            "confidence_label": "low"
        }


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

    try:
        response = await chatbot.ask(
            messages=[{"role": "user", "content": user_prompt}],
            system_msg=system_prompt,
        )
        
        return response.strip()
    except Exception as e:
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
