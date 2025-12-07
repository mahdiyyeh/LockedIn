// src/pages/AuthPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { DuckLogo, DuckIcon } from "@/components/DuckLogo";
import { toast } from "sonner";
import { login, register } from "../api";
import type { User } from "../types";

interface AuthPageProps {
  onAuthSuccess: (user: User, token: string) => void;
  onBackToLanding: () => void;
}

export default function AuthPage({
  onAuthSuccess,
  onBackToLanding,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(null);
    setConfirmPassword("");
    setDisplayName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in email and password.");
      return;
    }

    if (mode === "signup") {
      if (!displayName) {
        setError("Please enter your display name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (mode === "login") {
        const response = await login({ email, password });
        toast.success("Logged in successfully!");
        onAuthSuccess(response.user, response.token);
      } else {
        const response = await register({
          email,
          password,
          display_name: displayName,
        });
        toast.success("Account created successfully!");
        onAuthSuccess(response.user, response.token);
      }
    } catch (err: unknown) {
      console.error("[AuthPage] Auth error:", err);
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#050816] via-[#0a0f2e] to-[#2d0b5c]">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-card/10 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#2d0b5c] shadow-glow">
              <DuckLogo size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                LockedIn
              </h1>
              <p className="text-xs text-gray-300">Sign in to your dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onBackToLanding}
            className="text-gray-100 hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Auth card */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-primary/30 bg-card/80 shadow-glow">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-gray-50">
              <DuckIcon size={20} />
              {mode === "login" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {mode === "login"
                ? "Log in to see your goals and AI predictions."
                : "Sign up to start tracking goals with AI assistance."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2 text-left">
                  <Label htmlFor="displayName" className="text-gray-200">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className=""
                    placeholder="Your name"
                  />
                </div>
              )}

              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="text-gray-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className=""
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="password" className="text-gray-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className=""
                  placeholder="••••••••"
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2 text-left">
                  <Label htmlFor="confirmPassword" className="text-gray-200">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className=""
                    placeholder="••••••••"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login" ? "Logging in..." : "Creating account..."}
                  </>
                ) : mode === "login" ? (
                  "Log in"
                ) : (
                  "Sign up"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-300">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={toggleMode}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={toggleMode}
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
