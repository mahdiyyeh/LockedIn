// src/pages/CommitmentDetailPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  LogOut,
  ArrowLeft,
  Loader2,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Brain,
  MessageSquare,
  Coins,
  Trash2,
} from "lucide-react";
import { DuckLogo } from "@/components/DuckLogo";
import { toast } from "sonner";
import {
  getCommitment,
  getCommitmentContext,
  getCoachingMessages,
  getCommitmentBets,
  completeCommitment,
  deleteCommitment,
  createBet,
  deleteBet,
  getBalance,
  getComments,
  createComment,
  deleteComment,
} from "../api";
import type {
  User,
  Commitment,
  ContextMessage,
  CoachingMessage,
  Bet,
  Balance,
  Comment,
} from "../types";

interface CommitmentDetailPageProps {
  user: User;
  onLogout: () => void;
}

export default function CommitmentDetailPage({
  user,
  onLogout,
}: CommitmentDetailPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [context, setContext] = useState<ContextMessage[]>([]);
  const [coaching, setCoaching] = useState<CoachingMessage[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Complete commitment form
  const [completionReport, setCompletionReport] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [completing, setCompleting] = useState(false);

  // Bet form
  const [betDirection, setBetDirection] = useState<"will_complete" | "will_fail">(
    "will_complete"
  );
  const [betAmount, setBetAmount] = useState(50);
  const [placingBet, setPlacingBet] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);

  // Comments
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [deletingBetId, setDeletingBetId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [commitmentData, contextData, coachingData, betsData, commentsData, balanceData] =
          await Promise.all([
            getCommitment(parseInt(id)),
            getCommitmentContext(parseInt(id)).catch(() => []),
            getCoachingMessages(parseInt(id)).catch(() => []),
            getCommitmentBets(parseInt(id)).catch(() => []),
            getComments(parseInt(id)).catch(() => []),
            getBalance().catch(() => ({ balance: 0 })),
          ]);

        setCommitment(commitmentData);
        setContext(contextData);
        setCoaching(coachingData);
        setBets(betsData);
        setComments(commentsData);
        setBalance(balanceData);
      } catch (err: unknown) {
        console.error("[CommitmentDetailPage] Load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load goal");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const isOwner = commitment && commitment.owner_id === user.id;
  const canBet =
    commitment &&
    !isOwner &&
    commitment.status === "pending" &&
    new Date(commitment.deadline) > new Date();

  const handleComplete = async (completed: boolean) => {
    if (!commitment) return;

    try {
      setCompleting(true);
      const updated = await completeCommitment(commitment.id, {
        completed,
        completion_report: completionReport || undefined,
        evidence_url: evidenceUrl || undefined,
      });
      setCommitment(updated);

      // Reload coaching messages
      const newCoaching = await getCoachingMessages(commitment.id).catch(() => []);
      setCoaching(newCoaching);

      toast.success(
        completed ? "Goal marked as completed!" : "Goal marked as failed"
      );
    } catch (err: unknown) {
      console.error("Complete error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to complete");
    } finally {
      setCompleting(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!commitment || !balance) return;

    if (betAmount > balance.balance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setPlacingBet(true);
      const bet = await createBet(commitment.id, {
        direction: betDirection,
        amount: betAmount,
      });
      setBets([...bets, bet]);
      setBalance({ balance: balance.balance - betAmount });
      toast.success("Bet placed successfully!");
    } catch (err: unknown) {
      console.error("Bet error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setPlacingBet(false);
    }
  };

  const handleDelete = async () => {
    if (!commitment) return;
    
    if (!window.confirm("Are you sure you want to delete this goal? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      await deleteCommitment(commitment.id);
      toast.success("Goal deleted successfully!");
      navigate("/dashboard");
    } catch (err: unknown) {
      console.error("Delete error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete goal");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteBet = async (betId: number) => {
    try {
      setDeletingBetId(betId);
      await deleteBet(betId);
      setBets(bets.filter(b => b.id !== betId));
      // Refresh balance
      const newBalance = await getBalance().catch(() => ({ balance: 0 }));
      setBalance(newBalance);
      toast.success("Bet cancelled and refunded!");
    } catch (err: unknown) {
      console.error("Delete bet error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to cancel bet");
    } finally {
      setDeletingBetId(null);
    }
  };

  const handlePostComment = async () => {
    if (!commitment || !newComment.trim()) return;

    try {
      setPostingComment(true);
      const comment = await createComment(commitment.id, { content: newComment.trim() });
      setComments([...comments, comment]);
      setNewComment("");
      toast.success("Comment posted!");
    } catch (err: unknown) {
      console.error("Post comment error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      setDeletingCommentId(commentId);
      await deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success("Comment deleted!");
    } catch (err: unknown) {
      console.error("Delete comment error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#050816] via-[#0a0f2e] to-[#2d0b5c]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !commitment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#050816] via-[#0a0f2e] to-[#2d0b5c] text-gray-100">
        <p className="text-red-400 mb-4">{error || "Goal not found"}</p>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#050816] via-[#0a0f2e] to-[#2d0b5c] text-gray-100">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-primary/20 bg-card/10 backdrop-blur-lg shadow-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#2d0b5c] shadow-glow">
              <DuckLogo size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                LockedIn
              </h1>
              <p className="text-xs text-gray-300">Goal Details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-gray-100 hover:bg-primary/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="border-red-500/60 text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-gray-100 text-xl">
                        {commitment.title}
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        by {commitment.owner_display_name || "Unknown"}
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        commitment.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : commitment.status === "failed"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-primary/20 text-primary-foreground"
                      }
                    >
                      {commitment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {commitment.description && (
                    <p className="text-gray-300">{commitment.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-accent" />
                      Due: {formatDate(commitment.deadline)}
                    </span>
                    <Badge variant="outline" className="border-primary/30">
                      {commitment.category}
                    </Badge>
                    <Badge variant="outline" className="border-primary/30">
                      {commitment.visibility}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500">
                    ID: {commitment.public_id}
                  </div>
                </CardContent>
              </Card>

              {/* AI Prediction */}
              {commitment.prediction_probability !== null && (
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <Brain className="h-5 w-5 text-accent" />
                      AI Prediction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-primary">
                        {(commitment.prediction_probability * 100).toFixed(0)}%
                      </div>
                      <div>
                        <p className="text-gray-300">Success probability</p>
                        {commitment.ai_confidence_label && (
                          <Badge
                            className={
                              commitment.ai_confidence_label === "high"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : commitment.ai_confidence_label === "medium"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-red-500/20 text-red-300"
                            }
                          >
                            {commitment.ai_confidence_label} confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                    {commitment.prediction_explanation && (
                      <p className="mt-4 text-sm text-gray-400">
                        {commitment.prediction_explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Q&A Context */}
              {context.length > 0 && (
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <MessageSquare className="h-5 w-5 text-accent" />
                      Q&A Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {(() => {
                        // Separate questions (AI) and answers (user)
                        const questions = context.filter(msg => msg.role === "ai");
                        const answers = context.filter(msg => msg.role === "user");
                        
                        // Pair them together
                        return questions.map((question, index) => (
                          <div key={question.id} className="space-y-2">
                            {/* Question */}
                            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                              <p className="text-xs text-gray-500 mb-1">
                                Q{index + 1}
                              </p>
                              <p className="text-gray-300 text-sm">{question.content}</p>
                            </div>
                            {/* Answer (if exists) */}
                            {answers[index] && (
                              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 ml-4">
                                <p className="text-xs text-gray-500 mb-1">
                                  Your Answer
                                </p>
                                <p className="text-gray-300 text-sm">{answers[index].content}</p>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Coaching Messages */}
              {coaching.length > 0 && (
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <Brain className="h-5 w-5 text-emerald-400" />
                      AI Coaching
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {coaching.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <p className="text-gray-300">{msg.content}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Owner actions */}
              {isOwner && commitment.status === "pending" && (
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-gray-100 text-lg">
                      Mark Outcome
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-200">Reflection (optional)</Label>
                      <textarea
                        value={completionReport}
                        onChange={(e) => setCompletionReport(e.target.value)}
                        placeholder="What did you learn?"
                        className="min-h-[80px] w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm text-gray-100 placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-200">Evidence URL (optional)</Label>
                      <Input
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="https://..."
                        className="bg-background/60 text-gray-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleComplete(true)}
                        disabled={completing}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {completing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Completed
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleComplete(false)}
                        disabled={completing}
                        variant="outline"
                        className="flex-1 border-red-500/60 text-red-300 hover:bg-red-500/10"
                      >
                        {completing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Failed
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delete goal - only for owner and if no bets */}
              {isOwner && bets.length === 0 && (
                <Card className="border-red-500/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-red-400 text-lg">
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">
                      Once you delete a goal, there is no going back.
                    </p>
                    <Button
                      onClick={handleDelete}
                      disabled={deleting}
                      variant="outline"
                      className="w-full border-red-500/60 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Goal
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Bet panel */}
              {canBet && (
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      Place a Bet
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Your balance: {balance?.balance || 0} pts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={
                          betDirection === "will_complete" ? "default" : "outline"
                        }
                        onClick={() => setBetDirection("will_complete")}
                        className="flex-1"
                      >
                        Will Complete
                      </Button>
                      <Button
                        variant={betDirection === "will_fail" ? "default" : "outline"}
                        onClick={() => setBetDirection("will_fail")}
                        className="flex-1"
                      >
                        Will Fail
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-gray-200">Amount</Label>
                        <span className="text-primary font-semibold">
                          {betAmount} pts
                        </span>
                      </div>
                      <Slider
                        value={[betAmount]}
                        onValueChange={([val]) => setBetAmount(val)}
                        min={10}
                        max={Math.min(balance?.balance || 100, 500)}
                        step={10}
                      />
                    </div>

                    <Button
                      onClick={handlePlaceBet}
                      disabled={placingBet || betAmount > (balance?.balance || 0)}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {placingBet ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Coins className="mr-2 h-4 w-4" />
                          Place Bet
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Bets list */}
              {bets.length > 0 && (
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                      <Users className="h-5 w-5 text-accent" />
                      Bets ({bets.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {bets.map((bet) => (
                        <div
                          key={bet.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10"
                        >
                          <div>
                            <p className="text-sm text-gray-300">
                              {bet.bettor_display_name}
                              {bet.bettor_id === user.id && (
                                <span className="ml-1 text-xs text-primary">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {bet.direction === "will_complete"
                                ? "Will complete"
                                : "Will fail"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary">
                                {bet.amount} pts
                              </p>
                              {bet.resolved && bet.payout !== null && (
                                <p
                                  className={`text-xs ${
                                    bet.payout > 0
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {bet.payout > 0 ? "+" : ""}
                                  {bet.payout}
                                </p>
                              )}
                            </div>
                            {/* Delete button for user's own bets (only if not resolved) */}
                            {bet.bettor_id === user.id && !bet.resolved && commitment?.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBet(bet.id)}
                                disabled={deletingBetId === bet.id}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                {deletingBetId === bet.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments section - only show for non-owners OR if there are comments */}
              {(!isOwner || comments.length > 0) && (
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                      <MessageSquare className="h-5 w-5 text-accent" />
                      Comments ({comments.length})
                    </CardTitle>
                    {!isOwner && (
                      <CardDescription className="text-gray-400">
                        Leave encouragement or feedback on this goal
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Comment input - only show for non-owners */}
                    {!isOwner && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handlePostComment();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={handlePostComment}
                          disabled={postingComment || !newComment.trim()}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {postingComment ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Post"
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Comments list */}
                    {comments.length > 0 ? (
                      <div className="space-y-3 pt-2 max-h-80 overflow-y-auto pr-2">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="p-3 rounded-lg bg-primary/5 border border-primary/10"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-200">
                                    {comment.user_display_name}
                                  </span>
                                  {comment.user_id === user.id && (
                                    <span className="text-xs text-primary">(you)</span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-300">{comment.content}</p>
                              </div>
                              {comment.user_id === user.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={deletingCommentId === comment.id}
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  {deletingCommentId === comment.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No comments yet. Be the first to comment! 🦆
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

