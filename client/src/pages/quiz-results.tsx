import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, MapPin, DollarSign, Calendar, Shuffle } from "lucide-react";
import type { QuizResponse, DestinationRecommendation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function QuizResults() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);

  useEffect(() => {
    const savedQuiz = sessionStorage.getItem("quizData");
    if (!savedQuiz) {
      setLocation("/quiz");
      return;
    }
    setQuizData(JSON.parse(savedQuiz));
  }, [setLocation]);

  const recommendationsMutation = useMutation({
    mutationFn: async (quiz: QuizResponse) => {
      const res = await apiRequest("POST", "/api/ai/destination-recommendations", quiz);
      const data = await res.json() as { recommendations: DestinationRecommendation[] };
      return data.recommendations;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get recommendations",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (quizData && !recommendationsMutation.data && !recommendationsMutation.isPending) {
      recommendationsMutation.mutate(quizData);
    }
  }, [quizData]);

  const handleStartBudget = (destination: DestinationRecommendation) => {
    sessionStorage.setItem("selectedDestination", JSON.stringify(destination));
    
    // Also pass quiz data for trip planning (numberOfTravelers and tripLengthPreference)
    const quizDataJson = sessionStorage.getItem("quizData");
    if (quizDataJson) {
      try {
        const quizData = JSON.parse(quizDataJson);
        if (quizData.numberOfTravelers) {
          sessionStorage.setItem("quizNumberOfTravelers", String(quizData.numberOfTravelers));
        }
        if (quizData.tripLengthPreference) {
          sessionStorage.setItem("quizTripLength", quizData.tripLengthPreference);
        }
      } catch (error) {
        console.error("Failed to parse quiz data:", error);
      }
    }
    
    setLocation("/trip-planner");
  };

  if (!quizData) {
    return null;
  }

  if (recommendationsMutation.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <div>
            <h2 className="text-2xl font-bold font-inter mb-2">
              Finding Your Perfect Destinations...
            </h2>
            <p className="text-muted-foreground font-lora">
              Our AI is analyzing your preferences to create personalized recommendations
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (recommendationsMutation.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Unable to Generate Recommendations</CardTitle>
            <CardDescription>
              We encountered an issue generating your personalized destinations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setLocation("/quiz")} className="w-full">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recommendations = recommendationsMutation.data || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-5xl font-bold font-inter">
              Your Perfect Destinations
            </h1>
          </div>
          <p className="text-lg text-muted-foreground font-lora max-w-2xl mx-auto">
            Based on your adventure type, we've curated three amazing destinations just for you
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {recommendations.map((destination, index) => (
            <Card
              key={index}
              className="flex flex-col overflow-hidden hover-elevate"
              data-testid={`card-destination-${index}`}
            >
              <div className="relative h-48 bg-muted">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <MapPin className="w-12 h-12" />
                </div>
                {destination.isCurveball && (
                  <Badge className="absolute top-3 right-3 bg-primary" data-testid="badge-curveball">
                    <Shuffle className="w-3 h-3 mr-1" />
                    Curveball Surprise
                  </Badge>
                )}
              </div>

              <CardHeader>
                <CardTitle className="text-2xl font-lora" data-testid={`text-city-${index}`}>
                  {destination.cityName}
                </CardTitle>
                <CardDescription className="text-base" data-testid={`text-country-${index}`}>
                  {destination.countryName}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col space-y-4">
                <p className="text-sm text-foreground" data-testid={`text-description-${index}`}>
                  {destination.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground" data-testid={`text-why-match-${index}`}>
                      {destination.whyMatch}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground" data-testid={`text-budget-${index}`}>
                      Estimated daily budget: ${destination.estimatedDailyBudget}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground" data-testid={`text-best-time-${index}`}>
                      Best time: {destination.bestTimeToVisit}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleStartBudget(destination)}
                  className="w-full mt-auto"
                  data-testid={`button-start-budget-${index}`}
                >
                  Start Smart Budget
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Not quite right? You can always start over or skip directly to planning.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setLocation("/quiz")} data-testid="button-retake-quiz">
              Retake Quiz
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-back-home">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
