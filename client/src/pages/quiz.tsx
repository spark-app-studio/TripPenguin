import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { QuizResponse } from "@shared/schema";

type QuizAnswers = Partial<QuizResponse>;

const questions = [
  {
    id: 1,
    key: "tripGoal" as const,
    question: "What do you want MOST from this trip?",
    options: [
      { value: "rest", label: "Rest + wake up slow" },
      { value: "culture", label: "Culture + history + learning" },
      { value: "thrill", label: "Thrill + adventure + movement" },
      { value: "magic", label: "Magic + wonder + once-in-a-lifetime moments" },
    ],
  },
  {
    id: 2,
    key: "placeType" as const,
    question: "Which place makes your heart jump?",
    options: [
      { value: "ocean", label: "Ocean + turquoise water" },
      { value: "mountains", label: "Mountains + dramatic nature" },
      { value: "ancientCities", label: "Ancient cities + old streets" },
      { value: "modernSkyline", label: "Modern skyline + neon nightlife" },
    ],
  },
  {
    id: 3,
    key: "temperature" as const,
    question: "What temperature do you prefer for this dream?",
    options: [
      { value: "warm", label: "Warm + sunny" },
      { value: "cool", label: "Cool + crisp" },
      { value: "flexible", label: "I'm flexible — depends on the experience" },
    ],
  },
  {
    id: 4,
    key: "dayPace" as const,
    question: "How full do you want your days?",
    options: [
      { value: "relaxed", label: "70% chill / 30% planned" },
      { value: "balanced", label: "50/50 balance" },
      { value: "packed", label: "30% chill / 70% planned" },
    ],
  },
  {
    id: 5,
    key: "spendingPriority" as const,
    question: "What do you value most spending on?",
    options: [
      { value: "food", label: "Food + cafés + bakery moments" },
      { value: "experiences", label: "Experiences + excursions" },
      { value: "comfort", label: "Comfort + views" },
      { value: "souvenirs", label: "Meaningful souvenirs + memory items" },
    ],
  },
  {
    id: 6,
    key: "desiredEmotion" as const,
    question: "What's one emotion you want to feel on this trip that you don't feel enough right now?",
    options: [
      { value: "wonder", label: "Wonder" },
      { value: "freedom", label: "Freedom" },
      { value: "connection", label: "Connection" },
      { value: "awe", label: "Awe" },
    ],
  },
  {
    id: 7,
    key: "region" as const,
    question: "What region calls to you most right now?",
    options: [
      { value: "europe", label: "Europe" },
      { value: "asia", label: "Asia" },
      { value: "southAmerica", label: "South America" },
      { value: "tropicalIslands", label: "Tropical Islands" },
      { value: "surprise", label: "Not sure — surprise me" },
    ],
  },
];

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [dreamMoment, setDreamMoment] = useState("");

  const totalSteps = questions.length + 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAnswer = (key: keyof QuizAnswers, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const quizData: QuizResponse = {
      ...answers,
      dreamMoment,
    } as QuizResponse;

    sessionStorage.setItem("quizData", JSON.stringify(quizData));
    setLocation("/quiz/results");
  };

  const currentQuestion = currentStep < questions.length ? questions[currentStep] : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.key] : null;
  const isLastQuestion = currentStep === questions.length;
  const canProceed = currentQuestion ? !!currentAnswer : dreamMoment.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold font-inter mb-2">
                Find Your Adventure Type
              </h1>
              <p className="text-muted-foreground font-lora">
                Answer a few questions to discover your perfect destination
              </p>
            </div>
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
          <p className="text-sm text-muted-foreground mt-2">
            Question {currentStep + 1} of {totalSteps}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-lora">
              {currentQuestion ? currentQuestion.question : "Describe your dream moment"}
            </CardTitle>
            {isLastQuestion && (
              <CardDescription>
                Describe the dream moment you picture — even if it's just one sentence.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(currentQuestion.key, option.value)}
                    className={`w-full text-left p-4 rounded-md border-2 transition-all hover-elevate ${
                      currentAnswer === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                    data-testid={`option-${option.value}`}
                  >
                    <Label className="cursor-pointer text-base font-inter">
                      {option.label}
                    </Label>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={dreamMoment}
                  onChange={(e) => setDreamMoment(e.target.value)}
                  placeholder="Picture yourself there... What are you doing? What do you see, hear, or feel?"
                  className="min-h-32 text-base"
                  maxLength={500}
                  data-testid="input-dream-moment"
                />
                <p className="text-sm text-muted-foreground text-right">
                  {dreamMoment.length}/500
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed}
              className="ml-auto"
              data-testid="button-submit-quiz"
            >
              Get My Recommendations
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="ml-auto"
              data-testid="button-next"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
