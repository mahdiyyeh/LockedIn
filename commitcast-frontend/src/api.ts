// src/api.ts
// API client for CommitCast backend

import { loadToken } from "./auth";
import type {
  User,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  Commitment,
  CreateCommitmentRequest,
  CompleteCommitmentRequest,
  ContextMessage,
  CoachingMessage,
  PredictionResult,
  Bet,
  CreateBetRequest,
  Balance,
  UserStats,
  Comment,
  CreateCommentRequest,
} from "./types";

const BASE_URL = "http://127.0.0.1:8000";

// Helper to get auth headers
function getAuthHeaders(): Record<string, string> {
  const token = loadToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Helper for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

/* ========== AUTH ========== */

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMe(): Promise<User> {
  return apiRequest<User>("/auth/me");
}

/* ========== BALANCE & STATS ========== */

export async function getBalance(): Promise<Balance> {
  return apiRequest<Balance>("/me/balance");
}

export async function getMyStats(): Promise<UserStats> {
  return apiRequest<UserStats>("/me/stats");
}

/* ========== COMMITMENTS ========== */

export async function getMyCommitments(): Promise<Commitment[]> {
  return apiRequest<Commitment[]>("/commitments/my");
}

export async function getPublicCommitments(): Promise<Commitment[]> {
  return apiRequest<Commitment[]>("/commitments/public");
}

export async function getCommitment(id: number): Promise<Commitment> {
  return apiRequest<Commitment>(`/commitments/${id}`);
}

export async function createCommitment(
  data: CreateCommitmentRequest
): Promise<Commitment> {
  return apiRequest<Commitment>("/commitments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function completeCommitment(
  id: number,
  data: CompleteCommitmentRequest
): Promise<Commitment> {
  return apiRequest<Commitment>(`/commitments/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteCommitment(
  id: number
): Promise<{ status: string; message: string }> {
  return apiRequest(`/commitments/${id}`, {
    method: "DELETE",
  });
}

/* ========== AI ========== */

export async function generateAIQuestions(commitmentId: number): Promise<string[]> {
  return apiRequest<string[]>(`/commitments/${commitmentId}/ai/questions`, {
    method: "POST",
  });
}

export async function submitAIAnswer(
  commitmentId: number,
  answer: string
): Promise<{ status: string; message: string }> {
  return apiRequest(`/commitments/${commitmentId}/ai/answer`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export async function getAIPrediction(
  commitmentId: number
): Promise<PredictionResult> {
  return apiRequest<PredictionResult>(`/commitments/${commitmentId}/ai/predict`, {
    method: "POST",
  });
}

export async function getCommitmentContext(
  commitmentId: number
): Promise<ContextMessage[]> {
  return apiRequest<ContextMessage[]>(`/commitments/${commitmentId}/context`);
}

export async function getCoachingMessages(
  commitmentId: number
): Promise<CoachingMessage[]> {
  return apiRequest<CoachingMessage[]>(`/commitments/${commitmentId}/coaching`);
}

/* ========== BETS ========== */

export async function getCommitmentBets(commitmentId: number): Promise<Bet[]> {
  return apiRequest<Bet[]>(`/commitments/${commitmentId}/bets`);
}

export async function createBet(
  commitmentId: number,
  data: CreateBetRequest
): Promise<Bet> {
  return apiRequest<Bet>(`/commitments/${commitmentId}/bets`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteBet(
  betId: number
): Promise<{ status: string; message: string }> {
  return apiRequest(`/bets/${betId}`, {
    method: "DELETE",
  });
}

/* ========== COMMENTS ========== */

export async function getComments(commitmentId: number): Promise<Comment[]> {
  return apiRequest<Comment[]>(`/commitments/${commitmentId}/comments`);
}

export async function createComment(
  commitmentId: number,
  data: CreateCommentRequest
): Promise<Comment> {
  return apiRequest<Comment>(`/commitments/${commitmentId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteComment(
  commentId: number
): Promise<{ status: string; message: string }> {
  return apiRequest(`/comments/${commentId}`, {
    method: "DELETE",
  });
}
