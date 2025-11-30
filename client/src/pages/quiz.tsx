import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { QuizResponse } from "@shared/schema";
import { NavBar } from "@/components/NavBar";

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
  {
    id: 8,
    key: "favoriteMovie" as const,
    type: "text" as const,
    question: "What's your favorite movie?",
    placeholder: "e.g., The Lord of the Rings, Before Sunrise, The Darjeeling Limited",
  },
  {
    id: 9,
    key: "favoriteBook" as const,
    type: "text" as const,
    question: "What's your favorite book?",
    placeholder: "e.g., Harry Potter, Eat Pray Love, Wild",
  },
  {
    id: 10,
    key: "dreamMoment" as const,
    type: "textarea" as const,
    question: "Describe your dream moment",
    description: "Describe the dream moment you picture — even if it's just one sentence.",
    placeholder: "Picture yourself there... What are you doing? What do you see, hear, or feel?",
  },
  {
    id: 11,
    key: "numberOfTravelers" as const,
    question: "How many travelers?",
    description: "This will help us plan your budget accurately.",
    options: [
      { value: 1, label: "Just me (1)" },
      { value: 2, label: "2 travelers" },
      { value: 3, label: "3 travelers" },
      { value: 4, label: "4 travelers" },
      { value: 5, label: "5-6 travelers" },
      { value: 7, label: "7+ travelers" },
    ],
  },
  {
    id: 12,
    key: "tripLengthPreference" as const,
    question: "Do you have a preference for how long the trip is?",
    options: [
      { value: "1-3 days", label: "1-3 days (quick getaway)" },
      { value: "4-7 days", label: "4-7 days (one week)" },
      { value: "1-2 weeks", label: "1-2 weeks" },
      { value: "2-3 weeks", label: "2-3 weeks" },
      { value: "3+ weeks", label: "3+ weeks (extended trip)" },
      { value: "flexible", label: "I'm flexible" },
    ],
  },
];

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const totalSteps = questions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAnswer = (key: keyof QuizAnswers, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const quizData: QuizResponse = answers as QuizResponse;

    sessionStorage.setItem("quizData", JSON.stringify(quizData));
    setLocation("/quiz/results");
  };

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.key];
  const isLastQuestion = currentStep === questions.length - 1;
  
  const canProceed = () => {
    if (!currentQuestion) return false;
    const answer = currentAnswer;
    
    if (currentQuestion.type === "text" || currentQuestion.type === "textarea") {
      return typeof answer === "string" && answer.trim().length > 0;
    }
    return !!answer;
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
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
              {currentQuestion.question}
            </CardTitle>
            {currentQuestion.description && (
              <CardDescription>
                {currentQuestion.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === "text" ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={(currentAnswer as string) || ""}
                  onChange={(e) => handleAnswer(currentQuestion.key, e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="text-base"
                  maxLength={200}
                  data-testid={`input-${currentQuestion.key}`}
                />
              </div>
            ) : currentQuestion.type === "textarea" ? (
              <div className="space-y-2">
                <Textarea
                  value={(currentAnswer as string) || ""}
                  onChange={(e) => handleAnswer(currentQuestion.key, e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="min-h-32 text-base"
                  maxLength={500}
                  data-testid={`input-${currentQuestion.key}`}
                />
                <p className="text-sm text-muted-foreground text-right">
                  {((currentAnswer as string) || "").length}/500
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={String(option.value)}
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
              disabled={!canProceed()}
              className="ml-auto"
              data-testid="button-submit-quiz"
            >
              Get My Recommendations
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
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
