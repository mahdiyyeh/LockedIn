// src/pages/ExplorePage.tsx
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
  Calendar,
  TrendingUp,
  Loader2,
  ArrowLeft,
  Users,
} from "lucide-react";
import { DuckLogo, DuckIcon } from "@/components/DuckLogo";
import { getPublicCommitments } from "../api";
import type { User, Commitment } from "../types";

interface ExplorePageProps {
  user: User;
  onLogout: () => void;
}

export default function ExplorePage({ user, onLogout }: ExplorePageProps) {
  const navigate = useNavigate();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicCommitments();
        setCommitments(data);
      } catch (err: unknown) {
        console.error("[ExplorePage] Load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load goals");
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
              <p className="text-xs text-gray-300">Explore public goals</p>
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
              Dashboard
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Users className="h-6 w-6 text-accent" />
              Public Goals
            </h2>
            <p className="text-gray-400 mt-1">
              Browse goals from other users and place bets on their success
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              <span className="text-gray-300">Loading public goals...</span>
            </div>
          ) : commitments.length === 0 ? (
            <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
              <CardContent className="py-12 text-center">
                <div className="flex justify-center mb-4">
                  <DuckLogo size={80} animate className="opacity-70" />
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-2">
                  The pond is empty... 🦆
                </h3>
                <p className="text-gray-400">
                  Be the first duck to make a public goal!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {commitments.map((commitment) => (
                <Card
                  key={commitment.id}
                  className="border-primary/20 bg-card/60 backdrop-blur-xl cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => navigate(`/commitments/${commitment.id}`)}
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
                      <span className="block mt-1">
                        by {commitment.owner_display_name || "Unknown"}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-primary/30 text-xs">
                        {commitment.category}
                      </Badge>
                      {commitment.prediction_probability !== null && (
                        <span className="text-sm text-primary font-semibold flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {(commitment.prediction_probability * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    {commitment.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {commitment.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

