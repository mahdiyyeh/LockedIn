// src/pages/CreateCommitmentPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogOut,
  ArrowLeft,
  Loader2,
  Sparkles,
  Brain,
  CheckCircle,
} from "lucide-react";
import { DuckLogo, DuckIcon } from "@/components/DuckLogo";
import { toast } from "sonner";
import {
  createCommitment,
  generateAIQuestions,
  submitAIAnswer,
  getAIPrediction,
} from "../api";
import type { User, PredictionResult } from "../types";

interface CreateCommitmentPageProps {
  user: User;
  onLogout: () => void;
}

type Step = "form" | "questions" | "prediction";

export default function CreateCommitmentPage({
  user,
  onLogout,
}: CreateCommitmentPageProps) {
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("personal");
  const [deadline, setDeadline] = useState("");
  const [visibility, setVisibility] = useState("public");

  // Flow state
  const [step, setStep] = useState<Step>("form");
  const [commitmentId, setCommitmentId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Loading states
  const [creating, setCreating] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !deadline) {
      toast.error("Please fill in title and deadline");
      return;
    }

    try {
      setCreating(true);

      const commitment = await createCommitment({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        deadline: new Date(deadline).toISOString(),
        visibility,
      });

      setCommitmentId(commitment.id);
      toast.success("Goal created!");

      // Generate AI questions
      setLoadingQuestions(true);
      try {
        const aiQuestions = await generateAIQuestions(commitment.id);
        setQuestions(aiQuestions);
        setStep("questions");
      } catch (err) {
        console.error("Failed to generate questions:", err);
        toast.error("AI questions unavailable. You can still get a prediction.");
        setStep("questions");
      } finally {
        setLoadingQuestions(false);
      }
    } catch (err: unknown) {
      console.error("Create error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !commitmentId) return;

    try {
      setSubmittingAnswer(true);
      await submitAIAnswer(commitmentId, currentAnswer.trim());
      setAnswers([...answers, currentAnswer.trim()]);
      setCurrentAnswer("");

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
      toast.error("Failed to submit answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleGetPrediction = async () => {
    if (!commitmentId) return;

    try {
      setLoadingPrediction(true);
      const result = await getAIPrediction(commitmentId);
      setPrediction(result);
      setStep("prediction");
      toast.success("AI prediction generated!");
    } catch (err) {
      console.error("Failed to get prediction:", err);
      toast.error("Failed to generate prediction");
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handleFinish = () => {
    if (commitmentId) {
      navigate(`/commitments/${commitmentId}`);
    } else {
      navigate("/dashboard");
    }
  };

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
              <p className="text-xs text-gray-300">New Goal</p>
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
        <div className="container mx-auto px-4 max-w-2xl">
          {step === "form" && (
            <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <DuckIcon size={20} />
                  Create a New Goal
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Define your goal and let AI help predict your success
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCommitment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-200">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Complete my thesis draft"
                      className="bg-background/60 text-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-200">
                      Description
                    </Label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add more details about your goal..."
                      className="min-h-[100px] w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm text-gray-100 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-gray-200">
                        Category
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-background/60 text-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="study">Study</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visibility" className="text-gray-200">
                        Visibility
                      </Label>
                      <Select value={visibility} onValueChange={setVisibility}>
                        <SelectTrigger className="bg-background/60 text-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-gray-200">
                      Deadline *
                    </Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="bg-background/60 text-gray-100"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={creating || loadingQuestions}
                  >
                    {creating || loadingQuestions ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {creating ? "Creating..." : "Generating AI questions..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create & Get AI Questions
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === "questions" && (
            <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Brain className="h-5 w-5 text-accent" />
                  AI Follow-up Questions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Answer these questions to help AI predict your success more accurately
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No questions available. Click below to get your prediction.
                  </p>
                ) : (
                  <>
                    {/* Show answered questions */}
                    {answers.map((answer, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2"
                      >
                        <p className="text-sm text-accent font-medium">
                          Q{idx + 1}: {questions[idx]}
                        </p>
                        <p className="text-sm text-gray-300">A: {answer}</p>
                      </div>
                    ))}

                    {/* Current question */}
                    {currentQuestionIndex < questions.length &&
                      answers.length === currentQuestionIndex && (
                        <div className="space-y-4">
                          <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
                            <p className="text-accent font-medium">
                              Question {currentQuestionIndex + 1} of {questions.length}
                            </p>
                            <p className="text-gray-100 mt-2">
                              {questions[currentQuestionIndex]}
                            </p>
                          </div>

                          <textarea
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            className="min-h-[80px] w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm text-gray-100 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />

                          <Button
                            onClick={handleSubmitAnswer}
                            disabled={!currentAnswer.trim() || submittingAnswer}
                            className="bg-accent text-accent-foreground hover:bg-accent/90"
                          >
                            {submittingAnswer ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Answer"
                            )}
                          </Button>
                        </div>
                      )}
                  </>
                )}

                <div className="pt-4 border-t border-primary/20">
                  <Button
                    onClick={handleGetPrediction}
                    disabled={loadingPrediction}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loadingPrediction ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating prediction...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get AI Prediction
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    You can get a prediction at any time, even without answering all
                    questions
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "prediction" && prediction && (
            <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  AI Prediction Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="text-6xl font-bold text-primary mb-2">
                    {(prediction.probability * 100).toFixed(0)}%
                  </div>
                  <p className="text-gray-300">Predicted success probability</p>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm ${
                        prediction.confidence_label === "high"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : prediction.confidence_label === "medium"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {prediction.confidence_label} confidence
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h4 className="text-sm font-medium text-accent mb-2">
                    AI Explanation
                  </h4>
                  <p className="text-gray-300 text-sm">{prediction.explanation}</p>
                </div>

                <Button
                  onClick={handleFinish}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  View Goal Details
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

