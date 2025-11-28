import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ProgressStepper } from "@/components/ProgressStepper";
import { BudgetCategoryCard } from "@/components/BudgetCategoryCard";
import { BudgetAlert } from "@/components/BudgetAlert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useItinerary } from "@/hooks/useItinerary";
import { ChevronRight, DollarSign, TrendingUp, Calendar as CalendarIcon, Sparkles, Loader2, MapPin, Clock, Users, ExternalLink, PiggyBank, Edit, Link, HelpCircle, Wallet, Plane, CheckCircle2, Lock } from "lucide-react";

interface BudgetData {
  flights: { cost: string; notes: string; usePoints: boolean };
  housing: { cost: string; notes: string };
  food: { cost: string; notes: string };
  transportation: { cost: string; notes: string };
  fun: { cost: string; notes: string };
  preparation: { cost: string; notes: string };
  booksMovies: { cost: string; notes: string };
  monthlySavings: string;
  currentSavings: string;
  creditCardPoints: string;
}

interface DestinationDetail {
  cityName: string;
  countryName: string;
  numberOfNights: number;
}

interface Step2PlanProps {
  initialData?: Partial<BudgetData>;
  tripDuration: number;
  numberOfTravelers: number;
  destinations: string[];
  destinationDetails?: DestinationDetail[];
  travelSeason: string;
  onComplete: (data: BudgetData) => void;
  onBack: () => void;
  onViewItinerary?: () => void;
}

interface CategoryBudget {
  category: "flights" | "housing" | "food" | "transportation" | "fun" | "preparation";
  categoryLabel: string;
  estimatedRange: string;
  explanation: string;
  tips: string[];
}

interface BudgetAdviceResponse {
  totalEstimatedRange: string;
  categories: CategoryBudget[];
  generalTips: string[];
}

const budgetTips: Record<string, string[]> = {
  flights: [
    "Book 2-3 months in advance for best prices",
    "Use credit card points to save cash",
    "Consider nearby airports for cheaper fares",
  ],
  housing: [
    "Airbnb or vacation rentals can be cheaper than hotels",
    "Look for places with kitchens to save on food",
    "Book early for better selection and prices",
  ],
  food: [
    "Budget $50-100 per person per day",
    "Mix restaurants with grocery store meals",
    "Lunch is often cheaper than dinner",
  ],
  transportation: [
    "Research public transit passes",
    "Compare train vs. plane for intercity travel",
    "Book train tickets early for discounts",
  ],
  fun: [
    "Many museums offer free days",
    "Walking tours can be free or low-cost",
    "Book popular attractions in advance",
  ],
  preparation: [
    "Don't forget travel insurance",
    "Check if you need a power adapter",
    "Comfortable walking shoes are essential",
  ],
  booksMovies: [
    "Check your local library for free travel guides",
    "Download movies/shows before the flight",
    "Get destination-themed books to build excitement",
  ],
};

export default function Step2Plan({
  initialData,
  tripDuration,
  numberOfTravelers,
  destinations,
  destinationDetails,
  travelSeason,
  onComplete,
  onBack,
  onViewItinerary,
}: Step2PlanProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { 
    itinerary, 
    initializeFromTripData,
    setItinerary 
  } = useItinerary();
  
  useEffect(() => {
    if (!itinerary && destinationDetails && destinationDetails.length > 0) {
      initializeFromTripData({
        tripDuration,
        numberOfTravelers,
        travelSeason,
        selectedDestinations: destinationDetails,
      });
    }
  }, [itinerary, destinationDetails, tripDuration, numberOfTravelers, travelSeason, initializeFromTripData]);

  const displayedDestinations = itinerary?.cities?.map(c => c.cityName) || destinations;
  const displayedDuration = itinerary?.totalNights || tripDuration;
  const displayedDestinationDetails = itinerary?.cities?.map(c => ({
    cityName: c.cityName,
    countryName: c.countryName,
    numberOfNights: c.numberOfNights,
  })) || destinationDetails;
  
  const [budgetData, setBudgetData] = useState<BudgetData>({
    flights: initialData?.flights || { cost: "0", notes: "", usePoints: false },
    housing: initialData?.housing || { cost: "0", notes: "" },
    food: initialData?.food || { cost: "0", notes: "" },
    transportation: initialData?.transportation || { cost: "0", notes: "" },
    fun: initialData?.fun || { cost: "0", notes: "" },
    preparation: initialData?.preparation || { cost: "0", notes: "" },
    booksMovies: initialData?.booksMovies || { cost: "0", notes: "" },
    monthlySavings: initialData?.monthlySavings || "500",
    currentSavings: initialData?.currentSavings || "0",
    creditCardPoints: initialData?.creditCardPoints || "0",
  });

  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<BudgetAdviceResponse | null>(null);
  const [currentAICategory, setCurrentAICategory] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState<Record<string, boolean>>({});

  // AI Budget Advisor mutation for specific category
  const budgetAdvisorMutation = useMutation({
    mutationFn: async ({ category }: { category: string }): Promise<BudgetAdviceResponse> => {
      const response = await apiRequest("POST", "/api/ai/budget-recommendations", {
        destinations,
        travelers: numberOfTravelers,
        tripDuration,
        travelSeason,
        category,
      });
      const data = await response.json();
      return data as BudgetAdviceResponse;
    },
    onSuccess: (data: BudgetAdviceResponse, variables) => {
      setAiAdvice(data);
      setShowAIDialog(true);
      setLoadingCategories((prev) => {
        const updated = { ...prev };
        delete updated[variables.category];
        return updated;
      });
    },
    onError: (error: Error, variables) => {
      toast({
        variant: "destructive",
        title: "AI Budget Advisor Error",
        description: error.message || "Failed to get budget recommendations. Please try again.",
      });
      setLoadingCategories((prev) => {
        const updated = { ...prev };
        delete updated[variables.category];
        return updated;
      });
    },
  });

  const handleGetAIGuidance = (category: string) => {
    setCurrentAICategory(category);
    setLoadingCategories((prev) => ({ ...prev, [category]: true }));
    budgetAdvisorMutation.mutate({ category });
  };

  const updateCategoryField = (
    category: keyof Omit<BudgetData, "monthlySavings" | "currentSavings" | "creditCardPoints">,
    field: string,
    value: string | boolean
  ) => {
    setBudgetData({
      ...budgetData,
      [category]: { ...budgetData[category], [field]: value },
    });
  };

  // Connected account state
  const [linkedAccountBalance, setLinkedAccountBalance] = useState<number | null>(null);
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [useManualSavings, setUseManualSavings] = useState(true);

  // Calculate totals
  const totalEstimated =
    parseFloat(budgetData.flights.cost || "0") +
    parseFloat(budgetData.housing.cost || "0") +
    parseFloat(budgetData.food.cost || "0") +
    parseFloat(budgetData.transportation.cost || "0") +
    parseFloat(budgetData.fun.cost || "0") +
    parseFloat(budgetData.preparation.cost || "0") +
    parseFloat(budgetData.booksMovies.cost || "0");

  // Determine effective current savings (manual input overrides linked account)
  const manualSavingsNum = parseFloat(budgetData.currentSavings || "0");
  const currentSavingsNum = useManualSavings || manualSavingsNum > 0 
    ? manualSavingsNum 
    : (linkedAccountBalance || 0);

  // AI-calculated recommended monthly savings based on trip cost
  const aiRecommendedMonthlySavings = useMemo(() => {
    if (totalEstimated <= 0) return 0;
    
    // Determine target payoff months based on trip cost
    // Smaller trips (< $2000) -> 6 months
    // Medium trips ($2000-$5000) -> 9 months
    // Larger trips ($5000-$10000) -> 12 months
    // Very large trips (> $10000) -> 15 months
    let targetMonths: number;
    if (totalEstimated < 2000) {
      targetMonths = 6;
    } else if (totalEstimated < 5000) {
      targetMonths = 9;
    } else if (totalEstimated < 10000) {
      targetMonths = 12;
    } else {
      targetMonths = 15;
    }
    
    // Calculate recommended monthly savings
    const amountToSave = Math.max(0, totalEstimated - currentSavingsNum);
    const recommended = Math.ceil(amountToSave / targetMonths);
    
    return recommended;
  }, [totalEstimated, currentSavingsNum]);

  // Use user's entered monthly savings if provided, otherwise use AI recommendation
  const monthlySavingsNum = parseFloat(budgetData.monthlySavings || "0") > 0 
    ? parseFloat(budgetData.monthlySavings || "0")
    : aiRecommendedMonthlySavings;
  
  const remainingToSave = Math.max(0, totalEstimated - currentSavingsNum);
  const monthsToSave = monthlySavingsNum > 0 ? Math.ceil(remainingToSave / monthlySavingsNum) : 0;

  const today = new Date();
  const earliestTravelDate = new Date(today);
  earliestTravelDate.setMonth(earliestTravelDate.getMonth() + monthsToSave);

  const savingsProgress = totalEstimated > 0 ? (currentSavingsNum / totalEstimated) * 100 : 0;

  // Stub function to simulate connecting a savings account
  const handleConnectSavingsAccount = async () => {
    setIsLinkingAccount(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock balance between $500 and $5000
    const mockBalance = Math.floor(Math.random() * 4500) + 500;
    setLinkedAccountBalance(mockBalance);
    setUseManualSavings(false);
    
    toast({
      title: "Account Connected",
      description: `Successfully linked your savings account. Balance: $${mockBalance.toLocaleString()}`,
    });
    
    setIsLinkingAccount(false);
  };

  const handleContinue = () => {
    onComplete(budgetData);
  };

  // Placeholder function to estimate flight cost based on destinations
  // This simulates an API call that would normally check flight prices
  // In production, this would use actual flight price APIs
  const estimateFlightCost = useMemo(() => {
    const destinationCities = displayedDestinations;
    const travelers = itinerary?.numberOfTravelers || numberOfTravelers;
    
    if (destinationCities.length === 0) return 0;
    
    // Placeholder estimation logic:
    // Base cost varies by destination type
    // International destinations cost more than domestic
    // Multi-city trips add 10% per additional city
    // Multiply by number of travelers
    
    // List of common US cities for domestic detection
    const usCities = [
      "new york", "los angeles", "chicago", "miami", "seattle", "denver", 
      "austin", "boston", "san francisco", "las vegas", "orlando", "phoenix",
      "atlanta", "dallas", "houston", "philadelphia", "washington", "portland"
    ];
    
    let baseCostPerPerson = 0;
    
    destinationCities.forEach((dest, index) => {
      const destLower = dest.toLowerCase();
      
      // Check if destination is domestic (US city)
      const isDomestic = usCities.some(city => destLower.includes(city));
      
      if (isDomestic) {
        // Domestic: $250-$450 base per person (average for booking 6-12 months ahead)
        baseCostPerPerson += 350;
      } else {
        // International: $900-$1400 base per person
        baseCostPerPerson += 1150;
      }
      
      // Multi-city premium (10% for each additional city after the first)
      if (index > 0) {
        baseCostPerPerson *= 1.1;
      }
    });
    
    // Round to nearest $50
    const totalEstimate = Math.round((baseCostPerPerson * travelers) / 50) * 50;
    
    return totalEstimate;
  }, [displayedDestinations, itinerary?.numberOfTravelers, numberOfTravelers]);

  // Flight savings calculations
  const flightCostFromBudget = parseFloat(budgetData.flights.cost || "0");
  const estimatedFlightCost = flightCostFromBudget > 0 ? flightCostFromBudget : estimateFlightCost;
  
  // Allocate current savings to flights first (until flights are covered)
  const savingsAllocatedToFlights = Math.min(currentSavingsNum, estimatedFlightCost);
  const flightSavingsGap = Math.max(0, estimatedFlightCost - savingsAllocatedToFlights);
  
  // Calculate months needed to save for flights
  const monthsToFlights = monthlySavingsNum > 0 ? Math.ceil(flightSavingsGap / monthlySavingsNum) : 0;
  
  // Calculate earliest flight booking date
  const earliestFlightBookingDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToFlights);
    return date;
  }, [monthsToFlights]);
  
  // Check if flights can be booked today
  const canBookFlightsNow = flightSavingsGap === 0 || new Date() >= earliestFlightBookingDate;
  
  // Calculate percentage of flight cost saved
  const flightSavingsProgress = estimatedFlightCost > 0 
    ? Math.min(100, (savingsAllocatedToFlights / estimatedFlightCost) * 100) 
    : 0;

  // Get season display name
  const getSeasonDisplay = (season: string) => {
    const seasonMap: Record<string, string> = {
      summer: "Summer",
      winter: "Winter",
      spring: "Spring",
      fall: "Fall",
      off_season: "Off-Season",
    };
    return seasonMap[season] || season;
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProgressStepper currentStep={2} completedSteps={[1]} />

        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Plan your Trip and Save
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Build your budget, track your savings, and make your trip debt-free
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Itinerary Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">
                      {itinerary?.title || "Your Itinerary"}
                    </CardTitle>
                    <CardDescription>
                      {displayedDestinations.length > 0 
                        ? `${displayedDestinations.join(" → ")}` 
                        : "No destinations selected yet"}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/itinerary")}
                  className="gap-2"
                  data-testid="button-view-itinerary"
                >
                  <Edit className="w-4 h-4" />
                  View / Edit Detailed Itinerary
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold" data-testid="text-trip-duration">{displayedDuration} {displayedDuration === 1 ? 'night' : 'nights'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Travelers</p>
                    <p className="font-semibold" data-testid="text-travelers">{itinerary?.numberOfTravelers || numberOfTravelers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Season</p>
                    <p className="font-semibold" data-testid="text-season">{getSeasonDisplay(itinerary?.travelSeason || travelSeason)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Destinations</p>
                    <p className="font-semibold" data-testid="text-destination-count">{displayedDestinations.length}</p>
                  </div>
                </div>
              </div>
              
              {/* Dates if available from itinerary */}
              {itinerary?.startDate && itinerary?.endDate && (
                <div className="mt-4 p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <span className="font-medium">Trip Dates:</span>
                    <span>
                      {new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {" — "}
                      {new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Destination details if available */}
              {displayedDestinationDetails && displayedDestinationDetails.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    {displayedDestinationDetails.map((dest, index) => (
                      <div 
                        key={index} 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-background border text-sm"
                        data-testid={`badge-destination-${index}`}
                      >
                        <span className="font-medium">{dest.cityName}</span>
                        <span className="text-muted-foreground">· {dest.numberOfNights} {dest.numberOfNights === 1 ? 'night' : 'nights'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overall Trip Financing Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary" />
                <CardTitle>Trip Financing Summary</CardTitle>
              </div>
              <CardDescription>
                Your overall savings progress and timeline to debt-free travel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Financial Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Estimated Trip Cost */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Total Estimated Trip Cost</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Sum of all budget categories: flights, accommodations, transportation, activities, food, and misc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-primary" data-testid="text-total-estimated">
                    ${totalEstimated.toLocaleString()}
                  </p>
                </div>
                
                {/* Current Savings */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Current Savings</p>
                    {linkedAccountBalance !== null && !useManualSavings && (
                      <span className="text-xs text-green-600 flex items-center gap-0.5">
                        <Link className="w-2.5 h-2.5" />
                        Linked
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-current-savings">
                    ${currentSavingsNum.toLocaleString()}
                  </p>
                </div>
                
                {/* AI-Recommended Monthly Savings */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Amount to Save Each Month</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <Sparkles className="w-3 h-3 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-1">AI-Calculated Recommendation</p>
                        <p className="text-sm">Based on your trip cost, we recommend saving over {totalEstimated < 2000 ? '6' : totalEstimated < 5000 ? '9' : totalEstimated < 10000 ? '12' : '15'} months. You can adjust this in the settings below.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-monthly-savings">
                    ${monthlySavingsNum.toLocaleString()}/mo
                  </p>
                  {parseFloat(budgetData.monthlySavings || "0") === 0 && aiRecommendedMonthlySavings > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI recommended
                    </p>
                  )}
                </div>
                
                {/* Earliest Travel Date */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Earliest Travel Date</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Calculated by estimating how long it will take you to save enough for your entire trip, based on your current savings and monthly savings amount. The goal is to help you avoid going into debt for this trip.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-bold flex items-center gap-1" data-testid="text-earliest-date">
                    <CalendarIcon className="w-4 h-4" />
                    {monthsToSave > 0 
                      ? earliestTravelDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : "Ready now!"
                    }
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {totalEstimated > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Savings Progress</span>
                    <span className="font-medium">{Math.min(100, savingsProgress).toFixed(0)}% saved</span>
                  </div>
                  <Progress value={Math.min(100, savingsProgress)} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {remainingToSave > 0 
                      ? `$${remainingToSave.toLocaleString()} left to save${monthsToSave > 0 ? ` · ${monthsToSave} month${monthsToSave > 1 ? 's' : ''} to go` : ''}`
                      : "You've saved enough for your trip!"
                    }
                  </p>
                </div>
              )}

              {/* Earliest Travel Date Helper Text */}
              {monthsToSave > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">How is this date calculated?</span> We estimate your earliest travel date by dividing the remaining amount you need to save (${remainingToSave.toLocaleString()}) by your monthly savings (${monthlySavingsNum.toLocaleString()}/mo). This helps ensure you can take this trip without going into debt.
                  </p>
                </div>
              )}

              {/* Savings Inputs */}
              <Separator />
              
              {/* Current Savings Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Your Savings</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectSavingsAccount}
                    disabled={isLinkingAccount}
                    className="gap-2"
                    data-testid="button-connect-savings"
                  >
                    {isLinkingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : linkedAccountBalance !== null ? (
                      <>
                        <Wallet className="w-4 h-4" />
                        Reconnect Account
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4" />
                        Connect Savings Account
                      </>
                    )}
                  </Button>
                </div>
                
                {linkedAccountBalance !== null && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          Linked Account Balance: ${linkedAccountBalance.toLocaleString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUseManualSavings(true)}
                        className="text-xs"
                        data-testid="button-use-manual"
                      >
                        Use manual entry instead
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-savings">
                      Current Savings (USD)
                      {linkedAccountBalance !== null && !useManualSavings && (
                        <span className="text-xs text-muted-foreground ml-1">(Override linked value)</span>
                      )}
                    </Label>
                    <Input
                      id="current-savings"
                      type="number"
                      min="0"
                      step="0.01"
                      value={budgetData.currentSavings}
                      onChange={(e) => {
                        setBudgetData({ ...budgetData, currentSavings: e.target.value });
                        if (e.target.value && parseFloat(e.target.value) > 0) {
                          setUseManualSavings(true);
                        }
                      }}
                      placeholder={linkedAccountBalance ? `Linked: $${linkedAccountBalance}` : "0.00"}
                      data-testid="input-current-savings"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly-savings" className="flex items-center gap-1">
                      Monthly Savings (USD)
                      <Tooltip>
                        <TooltipTrigger>
                          <Sparkles className="w-3 h-3 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Leave blank to use AI recommendation: ${aiRecommendedMonthlySavings.toLocaleString()}/mo</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="monthly-savings"
                      type="number"
                      min="0"
                      step="0.01"
                      value={budgetData.monthlySavings}
                      onChange={(e) => setBudgetData({ ...budgetData, monthlySavings: e.target.value })}
                      placeholder={`AI: $${aiRecommendedMonthlySavings}/mo`}
                      data-testid="input-monthly-savings"
                    />
                    {parseFloat(budgetData.monthlySavings || "0") === 0 && aiRecommendedMonthlySavings > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Using AI recommendation. Enter a value to override.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credit-points">Credit Card Points</Label>
                    <Input
                      id="credit-points"
                      type="number"
                      min="0"
                      value={budgetData.creditCardPoints}
                      onChange={(e) => setBudgetData({ ...budgetData, creditCardPoints: e.target.value })}
                      placeholder="Optional"
                      data-testid="input-credit-points"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Alert */}
          <BudgetAlert
            totalEstimated={totalEstimated}
            totalSavings={currentSavingsNum}
          />

          {/* Flight Costs Section - Full Width */}
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Plane className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Flight Costs</CardTitle>
                    <CardDescription>
                      Track your flight savings and book when you're ready
                    </CardDescription>
                  </div>
                </div>
                
                {/* Book Flights Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        size="lg"
                        disabled={!canBookFlightsNow}
                        onClick={() => {
                          toast({
                            title: "Ready to Book!",
                            description: "Opening flight booking options...",
                          });
                        }}
                        className={`gap-2 ${canBookFlightsNow ? 'bg-primary hover:bg-primary/90' : 'opacity-60'}`}
                        data-testid="button-book-flights"
                      >
                        {canBookFlightsNow ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Book the Flights
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            Book the Flights
                          </>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {canBookFlightsNow ? (
                      <p>You've saved enough for flights! Click to explore booking options.</p>
                    ) : (
                      <p>This button becomes active once you've saved enough for flights. The goal is to help you avoid booking flights before the money is actually available so you don't go into debt.</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Flight Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Estimated Flight Cost */}
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Estimated Flight Cost</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Estimated cost for flights booked 6-12 months in advance. {flightCostFromBudget > 0 ? "Using your entered budget." : "Based on your destinations and number of travelers."}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-primary" data-testid="text-estimated-flight-cost">
                    ${estimatedFlightCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    for {itinerary?.numberOfTravelers || numberOfTravelers} traveler{(itinerary?.numberOfTravelers || numberOfTravelers) > 1 ? 's' : ''}
                  </p>
                </div>
                
                {/* Savings Applied to Flights */}
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Savings Applied to Flights</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Your current savings are applied to flights first, then to other categories.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-savings-for-flights">
                    ${savingsAllocatedToFlights.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of ${currentSavingsNum.toLocaleString()} total savings
                  </p>
                </div>
                
                {/* Amount Still Needed */}
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Amount Still Needed</p>
                  </div>
                  <p className={`text-2xl font-bold ${flightSavingsGap === 0 ? 'text-green-600' : 'text-amber-600'}`} data-testid="text-flight-savings-gap">
                    {flightSavingsGap === 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-5 h-5" />
                        $0
                      </span>
                    ) : (
                      `$${flightSavingsGap.toLocaleString()}`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {flightSavingsGap === 0 ? 'Flights are covered!' : 'to save for flights'}
                  </p>
                </div>
                
                {/* Earliest Booking Date */}
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Earliest Booking Date</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Based on your flight savings gap (${flightSavingsGap.toLocaleString()}) and monthly savings (${monthlySavingsNum.toLocaleString()}/mo), this is when you'll have enough saved for flights.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={`text-lg font-bold flex items-center gap-1 ${canBookFlightsNow ? 'text-green-600' : ''}`} data-testid="text-earliest-flight-date">
                    <CalendarIcon className="w-4 h-4" />
                    {canBookFlightsNow 
                      ? "Ready now!" 
                      : earliestFlightBookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }
                  </p>
                  {!canBookFlightsNow && monthsToFlights > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthsToFlights} month{monthsToFlights > 1 ? 's' : ''} away
                    </p>
                  )}
                </div>
              </div>
              
              {/* Flight Savings Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Flight Savings Progress</span>
                  <span className="font-medium">{flightSavingsProgress.toFixed(0)}% saved</span>
                </div>
                <Progress value={flightSavingsProgress} className="h-3" />
              </div>
              
              {/* Helper Text */}
              {!canBookFlightsNow && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-medium">Why is booking disabled?</span> You still need ${flightSavingsGap.toLocaleString()} more for flights. 
                      At ${monthlySavingsNum.toLocaleString()}/month, you'll be ready to book in {monthsToFlights} month{monthsToFlights > 1 ? 's' : ''}. 
                      This helps you avoid going into debt for your trip.
                    </p>
                  </div>
                </div>
              )}
              
              {canBookFlightsNow && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <span className="font-medium">You're ready!</span> You've saved enough to cover your flights. 
                      Book now to lock in prices 6-12 months before your trip for the best deals.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Breakdown */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Budget Breakdown</h2>
            <p className="text-muted-foreground">Estimate costs for each category to build your complete trip budget</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BudgetCategoryCard
                category="flights"
                estimatedCost={budgetData.flights.cost}
                notes={budgetData.flights.notes}
                usePoints={budgetData.flights.usePoints}
                onEstimatedCostChange={(value) => updateCategoryField("flights", "cost", value)}
                onNotesChange={(value) => updateCategoryField("flights", "notes", value)}
                onUsePointsChange={(value) => updateCategoryField("flights", "usePoints", value)}
                tips={budgetTips.flights}
                onGetAIGuidance={() => handleGetAIGuidance("flights")}
                isLoadingAI={loadingCategories["flights"] || false}
              />

              <BudgetCategoryCard
                category="housing"
                estimatedCost={budgetData.housing.cost}
                notes={budgetData.housing.notes}
                onEstimatedCostChange={(value) => updateCategoryField("housing", "cost", value)}
                onNotesChange={(value) => updateCategoryField("housing", "notes", value)}
                tips={budgetTips.housing}
                onGetAIGuidance={() => handleGetAIGuidance("housing")}
                isLoadingAI={loadingCategories["housing"] || false}
              />

              <BudgetCategoryCard
                category="food"
                estimatedCost={budgetData.food.cost}
                notes={budgetData.food.notes}
                onEstimatedCostChange={(value) => updateCategoryField("food", "cost", value)}
                onNotesChange={(value) => updateCategoryField("food", "notes", value)}
                tips={budgetTips.food}
                onGetAIGuidance={() => handleGetAIGuidance("food")}
                isLoadingAI={loadingCategories["food"] || false}
              />

              <BudgetCategoryCard
                category="transportation"
                estimatedCost={budgetData.transportation.cost}
                notes={budgetData.transportation.notes}
                onEstimatedCostChange={(value) => updateCategoryField("transportation", "cost", value)}
                onNotesChange={(value) => updateCategoryField("transportation", "notes", value)}
                tips={budgetTips.transportation}
                onGetAIGuidance={() => handleGetAIGuidance("transportation")}
                isLoadingAI={loadingCategories["transportation"] || false}
              />

              <BudgetCategoryCard
                category="fun"
                estimatedCost={budgetData.fun.cost}
                notes={budgetData.fun.notes}
                onEstimatedCostChange={(value) => updateCategoryField("fun", "cost", value)}
                onNotesChange={(value) => updateCategoryField("fun", "notes", value)}
                tips={budgetTips.fun}
                onGetAIGuidance={() => handleGetAIGuidance("fun")}
                isLoadingAI={loadingCategories["fun"] || false}
              />

              <BudgetCategoryCard
                category="preparation"
                estimatedCost={budgetData.preparation.cost}
                notes={budgetData.preparation.notes}
                onEstimatedCostChange={(value) => updateCategoryField("preparation", "cost", value)}
                onNotesChange={(value) => updateCategoryField("preparation", "notes", value)}
                tips={budgetTips.preparation}
                onGetAIGuidance={() => handleGetAIGuidance("preparation")}
                isLoadingAI={loadingCategories["preparation"] || false}
              />

              <BudgetCategoryCard
                category="booksMovies"
                estimatedCost={budgetData.booksMovies.cost}
                notes={budgetData.booksMovies.notes}
                onEstimatedCostChange={(value) => updateCategoryField("booksMovies", "cost", value)}
                onNotesChange={(value) => updateCategoryField("booksMovies", "notes", value)}
                tips={budgetTips.booksMovies}
                onGetAIGuidance={() => handleGetAIGuidance("booksMovies")}
                isLoadingAI={loadingCategories["booksMovies"] || false}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8">
            <Button
              variant="outline"
              onClick={onBack}
              data-testid="button-back-to-dream"
            >
              Back to Dream
            </Button>
            <Button
              size="lg"
              onClick={handleContinue}
              className="min-h-0"
              data-testid="button-continue-to-book"
            >
              Continue to Booking
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Budget Guidance Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {aiAdvice?.categories?.[0]?.categoryLabel 
                ? `${aiAdvice.categories[0].categoryLabel} Budget Guidance`
                : "AI Budget Guidance"}
            </DialogTitle>
            <DialogDescription>
              {aiAdvice?.categories?.[0]?.categoryLabel 
                ? `Personalized ${aiAdvice.categories[0].categoryLabel.toLowerCase()} recommendations for your trip to ${destinations.join(", ")}`
                : `Here are personalized budget recommendations for your trip to ${destinations.join(", ")}`}
            </DialogDescription>
          </DialogHeader>

          {aiAdvice && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Total Estimated Range */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">
                      Total Estimated Budget
                    </CardDescription>
                    <CardTitle className="text-2xl text-primary" data-testid="text-ai-total-budget">
                      {aiAdvice.totalEstimatedRange}
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Category Recommendations */}
                {aiAdvice.categories && aiAdvice.categories.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Category Breakdown</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {aiAdvice.categories.map((category) => (
                        <Card key={category.category} data-testid={`card-ai-category-${category.category}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                {category.categoryLabel}
                              </CardTitle>
                              <span className="text-primary font-semibold" data-testid={`text-ai-range-${category.category}`}>
                                {category.estimatedRange}
                              </span>
                            </div>
                            <CardDescription>{category.explanation}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Money-Saving Tips:
                              </h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {category.tips && category.tips.map((tip, index) => (
                                  <li key={index} className="text-muted-foreground">
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Tips */}
                {aiAdvice.generalTips && aiAdvice.generalTips.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">General Tips</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {aiAdvice.generalTips.map((tip, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
