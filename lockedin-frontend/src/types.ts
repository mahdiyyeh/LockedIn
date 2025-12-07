// src/types.ts
// TypeScript types for CommitCast frontend

export interface User {
  id: number;
  email: string;
  display_name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Commitment {
  id: number;
  public_id: string;
  title: string;
  description: string | null;
  category: string;
  deadline: string; // ISO datetime string
  visibility: string;
  status: string; // "pending" | "completed" | "failed" | "expired"
  prediction_probability: number | null;
  prediction_explanation: string | null;
  ai_confidence_label: string | null;
  completion_report: string | null;
  evidence_url: string | null;
  created_at: string;
  owner_id: number;
  owner_display_name: string | null;
}

export interface CreateCommitmentRequest {
  title: string;
  description?: string;
  category: string;
  deadline: string; // ISO datetime string
  visibility: string;
}

export interface CompleteCommitmentRequest {
  completed: boolean;
  completion_report?: string;
  evidence_url?: string;
}

export interface ContextMessage {
  id: number;
  role: string; // "system" | "ai" | "user"
  content: string;
  created_at: string;
}

export interface CoachingMessage {
  id: number;
  content: string;
  created_at: string;
}

export interface PredictionResult {
  probability: number;
  explanation: string;
  confidence_label: string;
}

export interface Bet {
  id: number;
  commitment_id: number;
  bettor_id: number;
  bettor_display_name: string;
  direction: string; // "will_complete" | "will_fail"
  amount: number;
  created_at: string;
  resolved: boolean;
  payout: number | null;
}

export interface CreateBetRequest {
  direction: string; // "will_complete" | "will_fail"
  amount: number;
}

export interface Balance {
  balance: number;
}

export interface UserStats {
  display_name: string;
  email: string;
  completed_count: number;
  failed_count: number;
  pending_count: number;
  success_rate: number;
  balance: number;
}

export interface Comment {
  id: number;
  commitment_id: number;
  user_id: number;
  user_display_name: string;
  content: string;
  created_at: string;
}

export interface CreateCommentRequest {
  content: string;
}
