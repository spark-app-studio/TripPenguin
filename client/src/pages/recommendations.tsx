import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { PenguinLogo } from "@/components/PenguinLogo";
import { ProgressStepper } from "@/components/ProgressStepper";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  ChevronRight, 
  Sparkles, 
  Plane,
  Car,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import type { ItineraryRecommendation, StaycationRecommendation } from "@shared/schema";

export default function Recommendations() {
  const [, setLocation] = useLocation();
  const [quizData, setQuizData] = useState<any>(null);
  const [gettingStartedData, setGettingStartedData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<ItineraryRecommendation[] | StaycationRecommendation[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Analyzing your preferences...");

  const isStaycation = gettingStartedData?.tripType === "staycation";

  // Mutation for destination (international/domestic) recommendations
  const destinationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai/destination-recommendations", data);
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendations(data.recommendations);
    },
    onError: (error) => {
      console.error("Failed to get recommendations:", error);
    }
  });

  // Mutation for staycation recommendations
  const staycationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai/staycation-recommendations", data);
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendations(data.recommendations);
    },
    onError: (error) => {
      console.error("Failed to get staycation recommendations:", error);
    }
  });

  // Load quiz data from sessionStorage
  useEffect(() => {
    const quizDataStr = sessionStorage.getItem("quizData");
    const gettingStartedDataStr = sessionStorage.getItem("gettingStartedData");
    
    if (quizDataStr) {
      try {
        setQuizData(JSON.parse(quizDataStr));
      } catch (e) {
        console.error("Failed to parse quiz data", e);
      }
    }
    
    if (gettingStartedDataStr) {
      try {
        setGettingStartedData(JSON.parse(gettingStartedDataStr));
      } catch (e) {
        console.error("Failed to parse getting started data", e);
      }
    }
  }, []);

  // Simulate loading progress for UX
  useEffect(() => {
    if (destinationMutation.isPending || staycationMutation.isPending) {
      const messages = [
        "Analyzing your preferences...",
        "Finding perfect destinations...",
        "Calculating budgets...",
        "Crafting personalized itineraries...",
        "Almost ready..."
      ];
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        setLoadingProgress(progress);
        
        const messageIndex = Math.min(Math.floor(progress / 20), messages.length - 1);
        setLoadingMessage(messages[messageIndex]);
      }, 800);

      return () => clearInterval(interval);
    } else if (recommendations) {
      setLoadingProgress(100);
    }
  }, [destinationMutation.isPending, staycationMutation.isPending, recommendations]);

  // Build extended quiz request from gettingStartedData
  const buildExtendedQuizRequest = () => {
    if (!gettingStartedData) return null;
    
    // Map common fields that both old quiz format (quizData) and new format (gettingStartedData) provide
    const baseRequest = {
      tripType: gettingStartedData.tripType as "international" | "domestic" | "staycation",
      numberOfTravelers: (gettingStartedData.adults || 1) + (gettingStartedData.kids || 0),
      adults: gettingStartedData.adults || 1,
      kids: gettingStartedData.kids || 0,
      childAges: gettingStartedData.childAges || [],
      accessibilityNeeds: gettingStartedData.accessibilityNeeds || [],
      departureLocation: gettingStartedData.departureLocation || "",
    };
    
    // Add trip-type specific fields
    if (gettingStartedData.tripType === "staycation") {
      return {
        ...baseRequest,
        timeAvailable: gettingStartedData.timeAvailable || "full-day",
        travelDistance: gettingStartedData.travelDistance || "2-3hrs",
        staycationGoal: gettingStartedData.staycationGoal || [],
        staycationBudget: gettingStartedData.staycationBudget || "150-300",
      };
    } else if (gettingStartedData.tripType === "domestic") {
      return {
        ...baseRequest,
        usRegion: gettingStartedData.usRegion,
        tripLength: gettingStartedData.tripLength,
        tripGoal: quizData?.tripGoal,
        placeType: quizData?.placeType,
        dayPace: quizData?.dayPace,
        spendingPriority: quizData?.spendingPriority,
        postcardImage: gettingStartedData.postcardImage,
        favoriteMedia: gettingStartedData.favoriteMedia,
        kidActivities: gettingStartedData.kidActivities || [],
      };
    } else {
      // International
      return {
        ...baseRequest,
        internationalRegion: gettingStartedData.internationalRegion,
        tripLength: gettingStartedData.tripLength,
        tripGoal: quizData?.tripGoal,
        placeType: quizData?.placeType,
        dayPace: quizData?.dayPace,
        spendingPriority: quizData?.spendingPriority,
        postcardImage: gettingStartedData.internationalPostcard,
        favoriteMedia: gettingStartedData.favoriteMedia,
        kidActivities: gettingStartedData.kidActivities || [],
      };
    }
  };

  // Auto-fetch recommendations when quiz data is loaded
  useEffect(() => {
    if (gettingStartedData && !recommendations && !destinationMutation.isPending && !staycationMutation.isPending) {
      const requestData = buildExtendedQuizRequest();
      if (!requestData) return;
      
      if (isStaycation) {
        staycationMutation.mutate(requestData);
      } else {
        destinationMutation.mutate(requestData);
      }
    }
  }, [quizData, gettingStartedData, recommendations]);

  const handleSelectItinerary = (recommendation: ItineraryRecommendation | StaycationRecommendation) => {
    setSelectedId(recommendation.id);
    
    // Store quiz metadata for the planner
    const numberOfTravelers = gettingStartedData 
      ? (gettingStartedData.adults || 1) + (gettingStartedData.kids || 0)
      : quizData?.numberOfTravelers || 1;
    
    sessionStorage.setItem("quizNumberOfTravelers", numberOfTravelers.toString());
    sessionStorage.setItem("quizTripLength", gettingStartedData?.tripLength || quizData?.tripLengthPreference || "4-7 days");
    
    // Set trip source for planner - needed for both staycation and regular trips
    sessionStorage.setItem("tripSource", "quiz");
    
    if (isStaycation) {
      // Store staycation using the dedicated key that trip-planner expects
      const staycation = recommendation as StaycationRecommendation;
      sessionStorage.setItem("selectedStaycation", JSON.stringify(staycation));
      sessionStorage.setItem("tripType", "staycation");
    } else {
      // Store the selected itinerary
      sessionStorage.setItem("selectedItinerary", JSON.stringify(recommendation));
    }
    
    // Navigate to planner
    setTimeout(() => {
      setLocation("/planner");
    }, 300);
  };

  const handleRetry = () => {
    setRecommendations(null);
    setLoadingProgress(0);
    
    const requestData = buildExtendedQuizRequest();
    if (!requestData) return;
    
    if (isStaycation) {
      staycationMutation.mutate(requestData);
    } else {
      destinationMutation.mutate(requestData);
    }
  };

  const isLoading = destinationMutation.isPending || staycationMutation.isPending;
  const hasError = destinationMutation.isError || staycationMutation.isError;

  // Render loading state
  if (isLoading || (!recommendations && !hasError)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <PenguinLogo size="xl" className="mx-auto mb-4 animate-bounce" />
            <h1 className="text-2xl font-bold font-serif mb-2">Creating Your Perfect Trip</h1>
            <p className="text-muted-foreground">{loadingMessage}</p>
          </div>
          
          <Progress value={loadingProgress} className="mb-4" />
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 animate-pulse text-primary" />
            <span>AI is crafting personalized recommendations just for you</span>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold font-serif mb-2">Oops! Something went wrong</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't generate your recommendations. Please try again.
          </p>
          <Button onClick={handleRetry} className="gap-2" data-testid="button-retry">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Render recommendations
  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProgressStepper currentStep={1} completedSteps={[]} />

        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Your Perfect {isStaycation ? "Day Trip" : "Adventure"} Awaits
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Based on your preferences, here are three personalized {isStaycation ? "day trip" : "itinerary"} options crafted just for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {recommendations?.map((rec, index) => {
            const isSelected = selectedId === rec.id;
            
            if (isStaycation) {
              const staycation = rec as StaycationRecommendation;
              return (
                <Card 
                  key={staycation.id}
                  className={`relative cursor-pointer transition-all hover-elevate ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleSelectItinerary(staycation)}
                  data-testid={`card-recommendation-${index}`}
                >
                  {staycation.isCurveball && (
                    <Badge className="absolute -top-2 -right-2 bg-primary" data-testid={`badge-curveball-${index}`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Hidden Gem
                    </Badge>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-5 h-5 text-primary" />
                      <Badge variant="secondary">{staycation.tripDuration}</Badge>
                    </div>
                    <CardTitle className="text-xl font-serif" data-testid={`text-title-${index}`}>
                      {staycation.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2" data-testid={`text-tagline-${index}`}>
                      {staycation.vibeTagline}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium" data-testid={`text-destination-${index}`}>
                        {staycation.destination.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span data-testid={`text-distance-${index}`}>{staycation.destination.distance}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium" data-testid={`text-cost-${index}`}>
                        ${staycation.totalCost.min.toLocaleString()} - ${staycation.totalCost.max.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {staycation.destination.description}
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full gap-2" 
                      variant={isSelected ? "default" : "outline"}
                      data-testid={`button-select-${index}`}
                    >
                      {isSelected ? "Selected" : "Choose This Trip"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            } else {
              const itinerary = rec as ItineraryRecommendation;
              const cities = itinerary.cities.map(c => c.cityName).join(" → ");
              
              return (
                <Card 
                  key={itinerary.id}
                  className={`relative cursor-pointer transition-all hover-elevate ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleSelectItinerary(itinerary)}
                  data-testid={`card-recommendation-${index}`}
                >
                  {itinerary.isCurveball && (
                    <Badge className="absolute -top-2 -right-2 bg-primary" data-testid={`badge-curveball-${index}`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Curveball
                    </Badge>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Plane className="w-5 h-5 text-primary" />
                      <Badge variant="secondary">{itinerary.totalNights} nights</Badge>
                    </div>
                    <CardTitle className="text-xl font-serif" data-testid={`text-title-${index}`}>
                      {itinerary.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2" data-testid={`text-tagline-${index}`}>
                      {itinerary.vibeTagline}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="font-medium" data-testid={`text-cities-${index}`}>{cities}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span data-testid={`text-best-time-${index}`}>Best: {itinerary.bestTimeToVisit}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium" data-testid={`text-cost-${index}`}>
                        ${itinerary.totalCost.min.toLocaleString()} - ${itinerary.totalCost.max.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 pt-2">
                      {itinerary.cities.slice(0, 3).map((city, cityIndex) => (
                        <Badge key={cityIndex} variant="outline" className="text-xs">
                          {city.cityName} ({city.stayLengthNights}n)
                        </Badge>
                      ))}
                      {itinerary.cities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{itinerary.cities.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full gap-2" 
                      variant={isSelected ? "default" : "outline"}
                      data-testid={`button-select-${index}`}
                    >
                      {isSelected ? "Selected" : "Choose This Itinerary"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            }
          })}
        </div>

        <div className="text-center mt-8">
          <Button 
            variant="ghost" 
            onClick={handleRetry}
            className="gap-2"
            data-testid="button-generate-new"
          >
            <RefreshCw className="w-4 h-4" />
            Generate New Options
          </Button>
        </div>
      </div>
    </div>
  );
}
