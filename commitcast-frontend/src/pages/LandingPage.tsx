// src/pages/LandingPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sparkles,
  TrendingUp,
  Calendar,
  Users,
  ArrowRight,
  Brain,
} from "lucide-react";
import { DuckLogo, HeroDuck, DuckIcon } from "@/components/DuckLogo";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGetStarted = () => {
    setIsNavigating(true);
    onGetStarted();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#050816] via-[#0a0f2e] to-[#2d0b5c]">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-card/10 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#2d0b5c] shadow-glow">
              <DuckLogo size={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                LockedIn
              </h1>
              <p className="text-xs text-gray-300">
                Where uncertainty turns into confident action
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-primary/40 text-gray-100 hover:bg-primary/20"
            onClick={handleGetStarted}
            disabled={isNavigating}
          >
            {isNavigating ? "Opening..." : "Login / Sign up"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="container mx-auto max-w-6xl">
          {/* Hero content with duck */}
          <div className="grid gap-8 md:grid-cols-2 items-center mb-16">
            <div className="space-y-6 order-2 md:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary font-medium">
                <Sparkles className="h-4 w-4" />
                Your accountability companion
              </div>

              <h2 className="text-4xl md:text-6xl font-bold text-gray-50 leading-tight">
                Get{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  LockedIn
                </span>
                <br />
                <span className="text-2xl md:text-3xl text-gray-300 font-normal">
                  Let the duck hold you accountable 🦆
                </span>
              </h2>

              <p className="text-gray-300 text-lg md:text-xl max-w-lg">
                Set goals, get AI predictions on your success, and let friends bet on whether you'll crush it. 
                The duck watches. The duck judges. The duck knows.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-glow text-lg px-8 py-6"
                  onClick={handleGetStarted}
                  disabled={isNavigating}
                >
                  {isNavigating ? "Opening..." : "Lock In Now"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Hero Duck */}
            <div className="flex justify-center order-1 md:order-2">
              <HeroDuck className="transform hover:scale-105 transition-transform duration-300" />
            </div>
          </div>

          {/* Features grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/30 bg-card/60 backdrop-blur-xl hover:border-primary/50 transition-colors group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-50">
                  <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  AI Predictions
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Our AI asks smart questions about your task, then predicts your success probability.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/30 bg-card/60 backdrop-blur-xl hover:border-primary/50 transition-colors group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-50">
                  <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  Social Betting
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Friends bet virtual points on your goals. Stakes make success sweeter.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/30 bg-card/60 backdrop-blur-xl hover:border-primary/50 transition-colors group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-50">
                  <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  Duck-O-Meter
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Track your success rate with our legendary duck status indicator.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/30 bg-card/60 backdrop-blur-xl hover:border-primary/50 transition-colors group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-50">
                  <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  Community
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Share goals publicly. Get support. Stay accountable together.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-card/10 backdrop-blur-lg py-6">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          LockedIn — Powered by SpoonOS 🦆
        </div>
      </footer>
    </div>
  );
}
