import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, MapPin, DollarSign, Calendar, Shuffle, Plane, TrendingUp, Clock, Car, Star, Package } from "lucide-react";
import type { QuizResponse, ItineraryRecommendation, StaycationRecommendation, ExtendedQuizResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PenguinLogo } from "@/components/PenguinLogo";
import { ProgressStepper } from "@/components/ProgressStepper";

type TripType = "international" | "domestic" | "staycation" | null;

interface GettingStartedData {
  tripType: TripType;
  adults: number;
  kids: number;
  childAges: number[];
  timeAvailable?: string;
  travelDistance?: string;
  staycationGoal?: string[];
  staycationBudget?: string;
  departureLocation?: string;
  tripLength?: string;
  usRegion?: string;
  internationalRegion?: string;
  dayFullness?: string;
  budgetStyle?: string;
  postcardImage?: string;
  favoriteMedia?: string;
  kidActivities?: string[];
  accessibilityNeeds?: string[];
}

export default function QuizResults() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [gettingStartedData, setGettingStartedData] = useState<GettingStartedData | null>(null);
  const [tripType, setTripType] = useState<TripType>(null);

  useEffect(() => {
    const savedQuiz = sessionStorage.getItem("quizData");
    const savedGettingStarted = sessionStorage.getItem("gettingStartedData");
    
    if (!savedQuiz && !savedGettingStarted) {
      setLocation("/quiz");
      return;
    }
    
    if (savedQuiz) {
      setQuizData(JSON.parse(savedQuiz));
    }
    
    if (savedGettingStarted) {
      const gsData = JSON.parse(savedGettingStarted) as GettingStartedData;
      setGettingStartedData(gsData);
      setTripType(gsData.tripType);
    }
  }, [setLocation]);

  // Mutation for itinerary recommendations (international/domestic)
  const itineraryMutation = useMutation({
    mutationFn: async (input: { quiz?: QuizResponse; gsData?: GettingStartedData }) => {
      // Build ExtendedQuizResponse format that backend expects
      let extendedQuiz: ExtendedQuizResponse;
      
      if (input.gsData) {
        // New Getting Started flow - use gsData with tripType
        // Map dayFullness to dayPace enum
        const mapDayPace = (dayFullness?: string): "relaxed" | "balanced" | "packed" | undefined => {
          if (!dayFullness) return undefined;
          if (dayFullness === "relaxed" || dayFullness === "balanced" || dayFullness === "packed") {
            return dayFullness;
          }
          return "balanced";
        };
        
        extendedQuiz = {
          tripType: input.gsData.tripType as "international" | "domestic" | "staycation",
          numberOfTravelers: input.gsData.adults + input.gsData.kids,
          adults: input.gsData.adults,
          kids: input.gsData.kids,
          childAges: input.gsData.childAges || [],
          usRegion: input.gsData.usRegion,
          tripLength: input.gsData.tripLength,
          internationalRegion: input.gsData.internationalRegion,
          dayPace: mapDayPace(input.gsData.dayFullness),
          postcardImage: input.gsData.postcardImage,
          favoriteMedia: input.gsData.favoriteMedia,
          kidActivities: input.gsData.kidActivities || [],
          accessibilityNeeds: input.gsData.accessibilityNeeds || [],
        };
      } else if (input.quiz) {
        // Legacy quiz flow - convert to ExtendedQuizResponse with default tripType
        extendedQuiz = {
          tripType: "international", // Default for legacy quiz
          numberOfTravelers: input.quiz.numberOfTravelers,
          adults: input.quiz.numberOfTravelers,
          kids: 0,
          childAges: [],
          tripLength: input.quiz.tripLengthPreference,
          dayPace: input.quiz.dayPace,
          spendingPriority: input.quiz.spendingPriority,
          postcardImage: input.quiz.dreamMoment,
          favoriteMedia: `${input.quiz.favoriteMovie}, ${input.quiz.favoriteBook}`,
          tripGoal: input.quiz.tripGoal,
          placeType: input.quiz.placeType,
        };
      } else {
        throw new Error("No quiz data available");
      }
      
      const res = await apiRequest("POST", "/api/ai/destination-recommendations", extendedQuiz);
      const responseData = await res.json() as { recommendations: ItineraryRecommendation[] };
      return responseData.recommendations;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get recommendations",
        variant: "destructive",
      });
    },
  });

  // Mutation for staycation recommendations
  const staycationMutation = useMutation({
    mutationFn: async (gsData: GettingStartedData) => {
      // Build the extended quiz request for staycations
      // Ensure arrays are always arrays (not undefined) for Zod validation
      const extendedQuiz: ExtendedQuizResponse = {
        tripType: "staycation",
        numberOfTravelers: gsData.adults + gsData.kids,
        adults: gsData.adults,
        kids: gsData.kids,
        childAges: gsData.childAges || [],
        timeAvailable: gsData.timeAvailable as "afternoon" | "full-day" | "weekend" | undefined,
        travelDistance: gsData.travelDistance as "home" | "2-3hrs" | undefined,
        staycationGoal: gsData.staycationGoal || [],
        staycationBudget: gsData.staycationBudget as "0-100" | "150-300" | "400-700" | "700+" | undefined,
        departureLocation: gsData.departureLocation || "",
        kidActivities: gsData.kidActivities || [],
        accessibilityNeeds: gsData.accessibilityNeeds || [],
      };
      
      const res = await apiRequest("POST", "/api/ai/staycation-recommendations", extendedQuiz);
      const data = await res.json() as { recommendations: StaycationRecommendation[] };
      return data.recommendations;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get staycation recommendations",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (tripType === "staycation" && gettingStartedData && !staycationMutation.data && !staycationMutation.isPending) {
      staycationMutation.mutate(gettingStartedData);
    } else if ((tripType === "international" || tripType === "domestic") && gettingStartedData && !itineraryMutation.data && !itineraryMutation.isPending) {
      // Getting Started flow with tripType
      itineraryMutation.mutate({ gsData: gettingStartedData });
    } else if (!tripType && quizData && !itineraryMutation.data && !itineraryMutation.isPending) {
      // Legacy quiz flow without tripType
      itineraryMutation.mutate({ quiz: quizData });
    }
  }, [tripType, quizData, gettingStartedData]);

  const handleStartPlanningItinerary = (itinerary: ItineraryRecommendation) => {
    sessionStorage.setItem("selectedItinerary", JSON.stringify(itinerary));
    
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
    
    setLocation("/quiz/refine");
  };

  const handleStartPlanningStaycation = (staycation: StaycationRecommendation) => {
    // Convert staycation to itinerary-compatible format for the refinement page
    const numberOfNights = staycation.tripDuration === "weekend" ? 2 : 
                           staycation.tripDuration === "full-day" ? 1 : 0;
    
    const convertedItinerary: ItineraryRecommendation = {
      id: staycation.id,
      title: staycation.title,
      vibeTagline: staycation.vibeTagline,
      isCurveball: staycation.isCurveball,
      totalCost: staycation.totalCost,
      costBreakdown: {
        flights: 0, // No flights for staycations
        housing: numberOfNights > 0 ? staycation.costBreakdown.misc : 0,
        food: staycation.costBreakdown.food,
        transportation: staycation.costBreakdown.gas + staycation.costBreakdown.parking,
        fun: staycation.costBreakdown.activities,
        preparation: 0,
      },
      cities: [{
        order: 1,
        cityName: staycation.destination.name,
        countryName: "Local Adventure",
        stayLengthNights: Math.max(1, numberOfNights),
        activities: staycation.destination.activities,
        imageQuery: staycation.destination.imageQuery,
      }],
      bestTimeToVisit: staycation.bestTimeToVisit,
      totalNights: Math.max(1, numberOfNights),
    };
    
    sessionStorage.setItem("selectedItinerary", JSON.stringify(convertedItinerary));
    sessionStorage.setItem("selectedStaycation", JSON.stringify(staycation)); // Keep original for reference
    sessionStorage.setItem("tripType", "staycation");
    sessionStorage.setItem("tripSource", "quiz");
    
    if (gettingStartedData) {
      sessionStorage.setItem("quizNumberOfTravelers", String(gettingStartedData.adults + gettingStartedData.kids));
    }
    
    // Go to refinement page just like other trip types
    setLocation("/quiz/refine");
  };

  const handleRemix = () => {
    if (tripType === "staycation" && gettingStartedData) {
      staycationMutation.mutate(gettingStartedData);
    } else if ((tripType === "international" || tripType === "domestic") && gettingStartedData) {
      itineraryMutation.mutate({ gsData: gettingStartedData });
    } else if (quizData) {
      itineraryMutation.mutate({ quiz: quizData });
    }
  };

  const isPending = tripType === "staycation" ? staycationMutation.isPending : itineraryMutation.isPending;
  const isError = tripType === "staycation" ? staycationMutation.isError : itineraryMutation.isError;

  if (!quizData && !gettingStartedData) {
    return null;
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2 cursor-pointer">
                <PenguinLogo size="md" />
                <span className="text-xl font-bold">TripPenguin</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</Link>
                <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
                <Link href="/meet-pebbles" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Meet Pebbles</Link>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
              </nav>

              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="button-login">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" data-testid="button-signup">
                    Sign up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <ProgressStepper currentStep={1} completedSteps={[]} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div>
              <h2 className="text-2xl font-bold font-inter mb-2">
                {tripType === "staycation" 
                  ? "Finding Local Adventures..." 
                  : "Crafting Your Perfect Itineraries..."}
              </h2>
              <p className="text-muted-foreground font-lora">
                Our AI is analyzing your preferences to create personalized adventures
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2 cursor-pointer">
                <PenguinLogo size="md" />
                <span className="text-xl font-bold">TripPenguin</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</Link>
                <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
                <Link href="/meet-pebbles" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Meet Pebbles</Link>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
              </nav>

              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="button-login">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" data-testid="button-signup">
                    Sign up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <ProgressStepper currentStep={1} completedSteps={[]} />
        <div className="flex items-center justify-center px-4 py-12">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Unable to Generate Recommendations</CardTitle>
              <CardDescription>
                We encountered an issue generating your personalized {tripType === "staycation" ? "staycations" : "itineraries"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setLocation("/getting-started")} className="w-full" data-testid="button-try-again">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full"
                data-testid="button-back-home-error"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render Staycation Results
  if (tripType === "staycation") {
    const staycationRecommendations = staycationMutation.data || [];
    const numberOfTravelers = gettingStartedData ? gettingStartedData.adults + gettingStartedData.kids : 1;

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2 cursor-pointer">
                <PenguinLogo size="md" />
                <span className="text-xl font-bold">TripPenguin</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</Link>
                <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
                <Link href="/meet-pebbles" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Meet Pebbles</Link>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
              </nav>

              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="button-login">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" data-testid="button-signup">
                    Sign up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <ProgressStepper currentStep={1} completedSteps={[]} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-5xl font-bold font-inter">
                Your Local Adventures Await
              </h1>
            </div>
            <p className="text-lg text-muted-foreground font-lora max-w-2xl mx-auto">
              Perfect getaways within driving distance - no flights needed, just good times ahead
            </p>
          </div>

          <div className="space-y-8 mb-12">
            {staycationRecommendations.map((staycation, index) => (
              <Card
                key={staycation.id}
                className="overflow-hidden hover-elevate"
                data-testid={`card-staycation-${index}`}
              >
                <CardHeader className="bg-muted/30 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl md:text-3xl font-lora" data-testid={`text-title-${index}`}>
                          {staycation.title}
                        </CardTitle>
                        {staycation.isCurveball && (
                          <Badge className="bg-primary flex-shrink-0" data-testid="badge-curveball">
                            <Shuffle className="w-3 h-3 mr-1" />
                            Hidden Gem
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base" data-testid={`text-tagline-${index}`}>
                        {staycation.vibeTagline}
                      </CardDescription>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-muted-foreground mb-1">Estimated Cost</div>
                      <div className="text-2xl font-bold text-primary" data-testid={`text-cost-${index}`}>
                        ${staycation.totalCost.min.toLocaleString()} - ${staycation.totalCost.max.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        for {numberOfTravelers} {numberOfTravelers === 1 ? "person" : "people"}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Destination Details */}
                    <div className="bg-muted/20 rounded-md p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold" data-testid={`text-destination-${index}`}>
                              {staycation.destination.name}
                            </h3>
                            <Badge variant="outline" className="text-xs capitalize">
                              {staycation.destination.type}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3" data-testid={`text-description-${index}`}>
                            {staycation.destination.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Car className="w-4 h-4 text-primary" />
                              <span data-testid={`text-distance-${index}`}>{staycation.destination.distance}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-primary" />
                              <span className="capitalize" data-testid={`text-duration-${index}`}>{staycation.tripDuration.replace("-", " ")}</span>
                            </div>
                            {staycation.familyFriendlyRating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span data-testid={`text-family-rating-${index}`}>Family-Friendly: {staycation.familyFriendlyRating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Activities */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Things to Do
                      </h3>
                      <div className="grid gap-2 md:grid-cols-2">
                        {staycation.destination.activities.map((activity, actIndex) => (
                          <div
                            key={actIndex}
                            className="flex items-start gap-2 text-sm"
                            data-testid={`text-activity-${index}-${actIndex}`}
                          >
                            <span className="text-primary mt-0.5">•</span>
                            <span className="text-muted-foreground">{activity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggested Itinerary */}
                    {staycation.suggestedItinerary && staycation.suggestedItinerary.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          Suggested Schedule
                        </h3>
                        <div className="space-y-2">
                          {staycation.suggestedItinerary.map((item, schedIndex) => (
                            <div
                              key={schedIndex}
                              className="flex items-start gap-3 text-sm bg-muted/10 rounded-md p-2"
                              data-testid={`text-schedule-${index}-${schedIndex}`}
                            >
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {item.time}
                              </Badge>
                              <div className="flex-1">
                                <p className="font-medium">{item.activity}</p>
                                <p className="text-xs text-muted-foreground">{item.duration}</p>
                                {item.tips && (
                                  <p className="text-xs text-primary/80 mt-1">Tip: {item.tips}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cost Breakdown */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Estimated Cost Breakdown
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(staycation.costBreakdown).map(([category, amount]) => (
                          <div key={category} className="text-center p-2 bg-muted/20 rounded-md">
                            <p className="text-xs text-muted-foreground capitalize mb-1">{category}</p>
                            <p className="font-semibold text-sm" data-testid={`text-breakdown-${index}-${category}`}>
                              ${amount.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Packing List & Best Time */}
                    <div className="flex flex-col md:flex-row gap-4 border-t pt-4">
                      {staycation.packingList && staycation.packingList.length > 0 && (
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            What to Pack
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {staycation.packingList.map((item, packIndex) => (
                              <Badge key={packIndex} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Best time to visit</p>
                          <p className="text-sm font-medium" data-testid={`text-best-time-${index}`}>
                            {staycation.bestTimeToVisit}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={() => handleStartPlanningStaycation(staycation)}
                        size="lg"
                        data-testid={`button-start-planning-${index}`}
                      >
                        Start Planning This Trip
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Remix and Navigation */}
          <div className="text-center space-y-4">
            <Button
              onClick={handleRemix}
              variant="default"
              size="lg"
              disabled={staycationMutation.isPending}
              data-testid="button-remix"
              className="gap-2"
            >
              <Shuffle className="w-4 h-4" />
              Remix - Get New Recommendations
            </Button>
            <p className="text-sm text-muted-foreground">
              Not quite right? Generate new staycation ideas or try a different trip type.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setLocation("/getting-started")} data-testid="button-retake-quiz">
                Start Over
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

  // Render Itinerary Results (International/Domestic)
  const recommendations = itineraryMutation.data || [];
  const numberOfTravelers = quizData?.numberOfTravelers || (gettingStartedData ? gettingStartedData.adults + gettingStartedData.kids : 1);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <PenguinLogo size="md" />
              <span className="text-xl font-bold">TripPenguin</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
              <Link href="/meet-pebbles" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Meet Pebbles</Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" data-testid="button-signup">
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <ProgressStepper currentStep={1} completedSteps={[]} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-5xl font-bold font-inter">
              Your Perfect Multi-City Adventures
            </h1>
          </div>
          <p className="text-lg text-muted-foreground font-lora max-w-2xl mx-auto">
            Based on your adventure type, we've curated three incredible itineraries combining multiple destinations
          </p>
        </div>

        <div className="space-y-8 mb-12">
          {recommendations.map((itinerary, index) => (
            <Card
              key={itinerary.id}
              className="overflow-hidden hover-elevate"
              data-testid={`card-itinerary-${index}`}
            >
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl md:text-3xl font-lora" data-testid={`text-title-${index}`}>
                        {itinerary.title}
                      </CardTitle>
                      {itinerary.isCurveball && (
                        <Badge className="bg-primary flex-shrink-0" data-testid="badge-curveball">
                          <Shuffle className="w-3 h-3 mr-1" />
                          Surprise!
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-base" data-testid={`text-tagline-${index}`}>
                      {itinerary.vibeTagline}
                    </CardDescription>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm text-muted-foreground mb-1">Total Cost Estimate</div>
                    <div className="text-2xl font-bold text-primary" data-testid={`text-cost-${index}`}>
                      ${itinerary.totalCost.min.toLocaleString()} - ${itinerary.totalCost.max.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      for {numberOfTravelers} {numberOfTravelers === 1 ? "traveler" : "travelers"}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Cities */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Your Journey ({itinerary.totalNights} nights)
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {itinerary.cities.map((city, cityIndex) => (
                        <div
                          key={`${itinerary.id}-city-${cityIndex}`}
                          className="bg-muted/20 rounded-md p-4 space-y-3"
                          data-testid={`card-city-${index}-${cityIndex}`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs" data-testid={`badge-order-${index}-${cityIndex}`}>
                                Stop {city.order}
                              </Badge>
                              {city.arrivalAirport && (
                                <Badge variant="outline" className="text-xs" data-testid={`badge-airport-${index}-${cityIndex}`}>
                                  <Plane className="w-3 h-3 mr-1" />
                                  {city.arrivalAirport}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold" data-testid={`text-city-name-${index}-${cityIndex}`}>
                              {city.cityName}, {city.countryName}
                            </h4>
                            <p className="text-xs text-muted-foreground" data-testid={`text-nights-${index}-${cityIndex}`}>
                              {city.stayLengthNights} {city.stayLengthNights === 1 ? "night" : "nights"}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Top Activities:</p>
                            <ul className="text-sm space-y-1">
                              {city.activities.slice(0, 3).map((activity, actIndex) => (
                                <li
                                  key={actIndex}
                                  className="flex items-start gap-2"
                                  data-testid={`text-activity-${index}-${cityIndex}-${actIndex}`}
                                >
                                  <span className="text-primary mt-1">•</span>
                                  <span className="text-muted-foreground">{activity}</span>
                                </li>
                              ))}
                              {city.activities.length > 3 && (
                                <li className="text-xs text-muted-foreground italic">
                                  +{city.activities.length - 3} more activities
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Estimated Cost Breakdown
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {Object.entries(itinerary.costBreakdown).map(([category, amount]) => (
                        <div key={category} className="text-center p-2 bg-muted/20 rounded-md">
                          <p className="text-xs text-muted-foreground capitalize mb-1">{category}</p>
                          <p className="font-semibold text-sm" data-testid={`text-breakdown-${index}-${category}`}>
                            ${amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best Time & Action */}
                  <div className="flex items-center justify-between gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Best time to visit</p>
                        <p className="text-sm font-medium" data-testid={`text-best-time-${index}`}>
                          {itinerary.bestTimeToVisit}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartPlanningItinerary(itinerary)}
                      size="lg"
                      data-testid={`button-customize-${index}`}
                    >
                      Customize Itinerary
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Remix and Navigation */}
        <div className="text-center space-y-4">
          <Button
            onClick={handleRemix}
            variant="default"
            size="lg"
            disabled={itineraryMutation.isPending}
            data-testid="button-remix"
            className="gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Remix - Get New Itineraries
          </Button>
          <p className="text-sm text-muted-foreground">
            Not quite right? Generate new recommendations or start planning from scratch.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setLocation("/getting-started")} data-testid="button-retake-quiz">
              Start Over
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
