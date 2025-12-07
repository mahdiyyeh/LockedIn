// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  Plus,
  Calendar,
  TrendingUp,
  Loader2,
  Coins,
  Compass,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { DuckLogo, DuckIcon, HeroDuck } from "@/components/DuckLogo";
import { getMyCommitments, getBalance } from "../api";
import type { User, Commitment, Balance } from "../types";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [commitmentsData, balanceData] = await Promise.all([
          getMyCommitments(),
          getBalance(),
        ]);
        setCommitments(commitmentsData);
        setBalance(balanceData);
      } catch (err: unknown) {
        console.error("[Dashboard] Load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const pendingCommitments = commitments.filter((c) => c.status === "pending");
  const completedCommitments = commitments.filter((c) => c.status === "completed");
  const failedCommitments = commitments.filter((c) => c.status === "failed");

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
              <p className="text-xs text-gray-300">
                Welcome, {user.display_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {balance && (
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                <Coins className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-primary">
                  {balance.balance} pts
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/explore")}
              className="text-gray-100 hover:bg-primary/10"
            >
              <Compass className="mr-2 h-4 w-4" />
              Explore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/me")}
              className="text-gray-100 hover:bg-primary/10"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
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
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Action buttons */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-100">My Goals</h2>
            <Button
              onClick={() => navigate("/commitments/new")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              <span className="text-gray-300">Loading your goals...</span>
            </div>
          ) : commitments.length === 0 ? (
            <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
              <CardContent className="py-12 text-center">
                <div className="flex justify-center mb-4">
                  <DuckLogo size={80} animate className="opacity-70" />
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-2">
                  The duck is waiting... 🦆
                </h3>
                <p className="text-gray-400 mb-6">
                  Create your first goal and let the duck judge your success!
                </p>
                <Button
                  onClick={() => navigate("/commitments/new")}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-glow"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Lock in your first goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Pending commitments */}
              {pendingCommitments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    In Progress ({pendingCommitments.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingCommitments.map((commitment) => (
                      <CommitmentCard
                        key={commitment.id}
                        commitment={commitment}
                        onClick={() => navigate(`/commitments/${commitment.id}`)}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed commitments */}
              {completedCommitments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Completed ({completedCommitments.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {completedCommitments.map((commitment) => (
                      <CommitmentCard
                        key={commitment.id}
                        commitment={commitment}
                        onClick={() => navigate(`/commitments/${commitment.id}`)}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Failed commitments */}
              {failedCommitments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-400" />
                    Not Completed ({failedCommitments.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {failedCommitments.map((commitment) => (
                      <CommitmentCard
                        key={commitment.id}
                        commitment={commitment}
                        onClick={() => navigate(`/commitments/${commitment.id}`)}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CommitmentCard({
  commitment,
  onClick,
  formatDate,
}: {
  commitment: Commitment;
  onClick: () => void;
  formatDate: (iso: string) => string;
}) {
  return (
    <Card
      className="border-primary/20 bg-card/60 backdrop-blur-xl cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-gray-100 text-lg line-clamp-1">
            {commitment.title}
          </CardTitle>
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
        <CardDescription className="text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due: {formatDate(commitment.deadline)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-primary/30 text-xs">
            {commitment.category}
          </Badge>
          {commitment.prediction_probability !== null && (
            <span className="text-sm text-primary font-semibold">
              {(commitment.prediction_probability * 100).toFixed(0)}% likely
            </span>
          )}
        </div>
        {commitment.public_id && (
          <p className="text-xs text-gray-500 mt-2">
            ID: {commitment.public_id}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
