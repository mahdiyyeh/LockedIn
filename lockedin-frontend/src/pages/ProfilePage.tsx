// src/pages/ProfilePage.tsx
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
  ArrowLeft,
  Loader2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Coins,
  User as UserIcon,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Fish,
} from "lucide-react";
import { DuckLogo, DuckIcon } from "@/components/DuckLogo";
import { getMyStats } from "../api";
import type { User, UserStats } from "../types";
import { SuccessPieChart, SuccessLineChart, DuckMeter } from "../components/StatsCharts";

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
}

export default function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyStats();
        setStats(data);
      } catch (err: unknown) {
        console.error("[ProfilePage] Load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
              <p className="text-xs text-gray-300">Profile & Stats</p>
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
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              <span className="text-gray-300">Loading your stats...</span>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Profile header */}
              <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                      <UserIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-100 text-xl">
                        {stats.display_name}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {stats.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-accent" />
                    <span className="text-2xl font-bold text-primary">
                      {stats.balance}
                    </span>
                    <span className="text-gray-400">points</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stats cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Completed</p>
                        <p className="text-3xl font-bold text-emerald-400">
                          {stats.completed_count}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-emerald-400/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Failed</p>
                        <p className="text-3xl font-bold text-red-400">
                          {stats.failed_count}
                        </p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-400/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">In Progress</p>
                        <p className="text-3xl font-bold text-primary">
                          {stats.pending_count}
                        </p>
                      </div>
                      <DuckIcon size={32} className="opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Success rate */}
              <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-100">
                    <BarChart3 className="h-5 w-5 text-accent" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-bold text-primary">
                      {(stats.success_rate * 100).toFixed(0)}%
                    </div>
                    <div className="flex-1">
                      <div className="h-4 rounded-full bg-primary/20 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                          style={{ width: `${stats.success_rate * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Based on {stats.completed_count + stats.failed_count} resolved
                        goals
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visualization Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Pie Chart */}
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <PieChartIcon className="h-5 w-5 text-accent" />
                      Completion Breakdown
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Visual split of completed vs failed goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SuccessPieChart
                      completed={stats.completed_count}
                      failed={stats.failed_count}
                      successRate={stats.success_rate}
                    />
                  </CardContent>
                </Card>

                {/* Line Chart */}
                <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <LineChartIcon className="h-5 w-5 text-accent" />
                      Success Rate Trend
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      How your success rate has evolved
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SuccessLineChart
                      completed={stats.completed_count}
                      failed={stats.failed_count}
                      successRate={stats.success_rate}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Duck Meter - Full width */}
              <Card className="border-primary/20 bg-card/60 backdrop-blur-xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-100">
                    <Fish className="h-5 w-5 text-accent" />
                    Duck-O-Meter 🦆
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Is your commitment duck swimming happily or struggling to stay afloat?
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <DuckMeter successRate={stats.success_rate} />
                </CardContent>
              </Card>

              {/* AI accuracy (placeholder) */}
              <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-100">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    AI Prediction Accuracy
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    How well did AI predictions match your actual outcomes?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.completed_count + stats.failed_count === 0 ? (
                    <p className="text-gray-400">
                      Complete some goals to see AI prediction accuracy.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Badge
                          className={
                            stats.success_rate >= 0.6
                              ? "bg-emerald-500/20 text-emerald-300"
                              : stats.success_rate >= 0.4
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-red-500/20 text-red-300"
                          }
                        >
                          {stats.success_rate >= 0.6
                            ? "Great track record!"
                            : stats.success_rate >= 0.4
                            ? "Room for improvement"
                            : "Keep pushing!"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">
                        Your actual success rate is {(stats.success_rate * 100).toFixed(0)}%. 
                        The more goals you complete, the better AI can predict your outcomes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

