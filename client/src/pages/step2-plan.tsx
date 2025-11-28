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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, DollarSign, TrendingUp, Calendar as CalendarIcon, Sparkles, Loader2, MapPin, Clock, Users, ExternalLink, PiggyBank, Edit, Link, HelpCircle, Wallet, Plane, CheckCircle2, Lock, CreditCard, Gift, Star, RefreshCw, AlertTriangle } from "lucide-react";

interface BudgetData {
  flights: { cost: string; notes: string; usePoints: boolean; pointsToUse: string };
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

// Mock credit card offers data
const mockCreditCardOffers = [
  {
    id: "chase-sapphire",
    name: "Chase Sapphire Preferred",
    bonus: "60,000 points",
    bonusValue: "$750",
    requirement: "after $4,000 spend in 3 months",
    annualFee: "$95",
    url: "https://example.com/chase-sapphire"
  },
  {
    id: "amex-gold",
    name: "American Express Gold",
    bonus: "75,000 points",
    bonusValue: "$900",
    requirement: "after $6,000 spend in 6 months",
    annualFee: "$250",
    url: "https://example.com/amex-gold"
  },
  {
    id: "capital-one-venture",
    name: "Capital One Venture X",
    bonus: "75,000 miles",
    bonusValue: "$750",
    requirement: "after $4,000 spend in 3 months",
    annualFee: "$395",
    url: "https://example.com/venture-x"
  }
];

// Points to dollar conversion rate (1 point = $0.012, typical for travel cards)
const POINTS_CONVERSION_RATE = 0.012;

// Accommodation option interface
interface AccommodationOption {
  id: string;
  type: "hotel" | "airbnb";
  name: string;
  nightlyCost: number;
  description: string;
  rating: number;
  url: string;
}

// Generate mock accommodation options for a destination
function generateMockAccommodations(cityName: string, countryName: string): AccommodationOption[] {
  // Generate consistent but varied options based on city name
  const cityHash = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isInternational = !["New York", "Los Angeles", "Chicago", "Miami", "Seattle", "Denver", "Austin", "Boston", "San Francisco", "Las Vegas", "Orlando", "Phoenix", "Atlanta", "Dallas", "Houston"].some(
    city => cityName.toLowerCase().includes(city.toLowerCase())
  );
  
  // Base prices vary by destination type
  const hotelBase = isInternational ? 180 : 140;
  const airbnbBase = isInternational ? 120 : 90;
  
  const hotelNames = [
    `${cityName} Grand Hotel`,
    `The ${cityName} Palace`,
    `${cityName} Marriott Downtown`,
    `Hilton ${cityName} Center`,
    `${cityName} Plaza Hotel`
  ];
  
  const airbnbNames = [
    `Charming Studio in ${cityName} Center`,
    `Modern Apartment Near ${cityName} Attractions`,
    `Cozy Home in Historic ${cityName}`,
    `Stylish Loft in ${cityName} Downtown`,
    `${cityName} Family-Friendly Apartment`
  ];
  
  const hotelDescriptions = [
    "Luxurious rooms with stunning city views, on-site restaurant, and spa services.",
    "Elegant accommodations with rooftop pool, gym, and complimentary breakfast.",
    "Modern hotel with excellent location, business center, and concierge service."
  ];
  
  const airbnbDescriptions = [
    "Fully equipped kitchen, washer/dryer, fast WiFi. Perfect for families.",
    "Stylish space with local character, walkable to major attractions.",
    "Spacious and comfortable, great for groups. Superhost with 100+ reviews."
  ];
  
  return [
    {
      id: `${cityName.toLowerCase().replace(/\s/g, '-')}-hotel-1`,
      type: "hotel",
      name: hotelNames[cityHash % hotelNames.length],
      nightlyCost: Math.round((hotelBase + (cityHash % 80)) / 10) * 10,
      description: hotelDescriptions[cityHash % hotelDescriptions.length],
      rating: 4 + (cityHash % 10) / 10,
      url: `https://example.com/book/${cityName.toLowerCase().replace(/\s/g, '-')}-hotel`
    },
    {
      id: `${cityName.toLowerCase().replace(/\s/g, '-')}-airbnb-1`,
      type: "airbnb",
      name: airbnbNames[cityHash % airbnbNames.length],
      nightlyCost: Math.round((airbnbBase + (cityHash % 60)) / 10) * 10,
      description: airbnbDescriptions[cityHash % airbnbDescriptions.length],
      rating: 4.5 + (cityHash % 5) / 10,
      url: `https://example.com/airbnb/${cityName.toLowerCase().replace(/\s/g, '-')}`
    },
    {
      id: `${cityName.toLowerCase().replace(/\s/g, '-')}-${(cityHash % 2 === 0) ? 'hotel' : 'airbnb'}-2`,
      type: (cityHash % 2 === 0) ? "hotel" : "airbnb",
      name: (cityHash % 2 === 0) 
        ? hotelNames[(cityHash + 1) % hotelNames.length]
        : airbnbNames[(cityHash + 1) % airbnbNames.length],
      nightlyCost: Math.round(((cityHash % 2 === 0 ? hotelBase : airbnbBase) + ((cityHash + 30) % 70)) / 10) * 10,
      description: (cityHash % 2 === 0) 
        ? hotelDescriptions[(cityHash + 1) % hotelDescriptions.length]
        : airbnbDescriptions[(cityHash + 1) % airbnbDescriptions.length],
      rating: 4.2 + (cityHash % 8) / 10,
      url: `https://example.com/book/${cityName.toLowerCase().replace(/\s/g, '-')}-option-2`
    }
  ];
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
    flights: initialData?.flights || { cost: "0", notes: "", usePoints: false, pointsToUse: "0" },
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

  // Connected credit card points state
  const [connectedPointsBalance, setConnectedPointsBalance] = useState<number | null>(null);
  const [isConnectingCard, setIsConnectingCard] = useState(false);
  const [pointsLastUpdated, setPointsLastUpdated] = useState<Date | null>(null);

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

  // Accommodation selection state
  // Maps cityName -> selected AccommodationOption id (or null if not selected)
  const [selectedAccommodations, setSelectedAccommodations] = useState<Record<string, string | null>>({});
  
  // Generate accommodation options for each destination
  const accommodationsByCity = useMemo(() => {
    const result: Record<string, { options: AccommodationOption[]; nights: number }> = {};
    if (displayedDestinationDetails) {
      displayedDestinationDetails.forEach((dest) => {
        result[dest.cityName] = {
          options: generateMockAccommodations(dest.cityName, dest.countryName),
          nights: dest.numberOfNights
        };
      });
    }
    return result;
  }, [displayedDestinationDetails]);

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

  // Stub function to simulate connecting credit card account to fetch points
  const handleConnectCardAccount = async () => {
    setIsConnectingCard(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock points balance between 45,000 and 150,000
    const mockPoints = Math.floor(Math.random() * 105000) + 45000;
    setConnectedPointsBalance(mockPoints);
    setPointsLastUpdated(new Date());
    
    // Auto-fill pointsToUse with connected balance if empty
    if (!budgetData.flights.pointsToUse || budgetData.flights.pointsToUse === "0") {
      setBudgetData({
        ...budgetData,
        flights: { ...budgetData.flights, pointsToUse: mockPoints.toString() }
      });
    }
    
    toast({
      title: "Card Connected",
      description: `Successfully linked your card. Points balance: ${mockPoints.toLocaleString()}`,
    });
    
    setIsConnectingCard(false);
  };

  // Toggle use points - reset points when disabled
  const handleToggleUsePoints = (enabled: boolean) => {
    setBudgetData({
      ...budgetData,
      flights: {
        ...budgetData.flights,
        usePoints: enabled,
        pointsToUse: enabled ? budgetData.flights.pointsToUse : "0"
      }
    });
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
  const baseEstimatedFlightCost = flightCostFromBudget > 0 ? flightCostFromBudget : estimateFlightCost;
  
  // Points calculations - only apply if usePoints is enabled
  const pointsToUse = budgetData.flights.usePoints 
    ? parseInt(budgetData.flights.pointsToUse || "0", 10) 
    : 0;
  const availablePoints = connectedPointsBalance || 0;
  const effectivePointsToUse = Math.min(pointsToUse, availablePoints > 0 ? availablePoints : pointsToUse);
  const pointsDollarValue = effectivePointsToUse * POINTS_CONVERSION_RATE;
  
  // Calculate points required to fully cover flights
  const pointsRequiredForFullCoverage = Math.ceil(baseEstimatedFlightCost / POINTS_CONVERSION_RATE);
  const pointsCoveragePercentage = baseEstimatedFlightCost > 0 
    ? Math.min(100, (pointsDollarValue / baseEstimatedFlightCost) * 100) 
    : 0;
  
  // Net flight cost after applying points
  const estimatedFlightCost = Math.max(0, baseEstimatedFlightCost - pointsDollarValue);
  
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
  
  // Calculate percentage of flight cost saved (cash portion only)
  const flightSavingsProgress = estimatedFlightCost > 0 
    ? Math.min(100, (savingsAllocatedToFlights / estimatedFlightCost) * 100) 
    : 0;

  // Accommodation cost calculations
  const estimatedAccommodationCost = useMemo(() => {
    // If user has manually entered housing cost, use that
    const housingBudget = parseFloat(budgetData.housing.cost || "0");
    if (housingBudget > 0) {
      return housingBudget;
    }
    
    // Otherwise estimate based on typical rates
    let totalCost = 0;
    if (displayedDestinationDetails) {
      displayedDestinationDetails.forEach((dest) => {
        const isInternational = !["New York", "Los Angeles", "Chicago", "Miami", "Seattle", "Denver", "Austin", "Boston", "San Francisco", "Las Vegas", "Orlando", "Phoenix", "Atlanta", "Dallas", "Houston"].some(
          city => dest.cityName.toLowerCase().includes(city.toLowerCase())
        );
        // Average nightly rate for 4-star accommodations
        const avgNightlyRate = isInternational ? 175 : 150;
        totalCost += avgNightlyRate * dest.numberOfNights;
      });
    }
    return totalCost;
  }, [budgetData.housing.cost, displayedDestinationDetails]);

  // Calculate actual accommodation cost based on selections
  const selectedAccommodationCost = useMemo(() => {
    let totalCost = 0;
    let allSelected = true;
    
    if (displayedDestinationDetails) {
      displayedDestinationDetails.forEach((dest) => {
        const selectedId = selectedAccommodations[dest.cityName];
        if (selectedId && accommodationsByCity[dest.cityName]) {
          const selected = accommodationsByCity[dest.cityName].options.find(opt => opt.id === selectedId);
          if (selected) {
            totalCost += selected.nightlyCost * dest.numberOfNights;
          }
        } else {
          allSelected = false;
        }
      });
    }
    
    return { cost: totalCost, allSelected };
  }, [selectedAccommodations, accommodationsByCity, displayedDestinationDetails]);

  // Final accommodation cost - use selected if all are chosen, otherwise AI estimate
  const finalAccommodationCost = selectedAccommodationCost.allSelected && selectedAccommodationCost.cost > 0
    ? selectedAccommodationCost.cost
    : estimatedAccommodationCost;

  // Combined flight + accommodation savings calculations
  const totalFlightsAndAccommodation = estimatedFlightCost + finalAccommodationCost;
  const savingsAfterFlights = Math.max(0, currentSavingsNum - estimatedFlightCost);
  const savingsAllocatedToAccommodation = Math.min(savingsAfterFlights, finalAccommodationCost);
  const accommodationSavingsGap = Math.max(0, finalAccommodationCost - savingsAllocatedToAccommodation);
  const combinedSavingsGap = flightSavingsGap + accommodationSavingsGap;
  
  // Calculate months needed to save for both flights and accommodation
  const monthsToCombined = monthlySavingsNum > 0 ? Math.ceil(combinedSavingsGap / monthlySavingsNum) : 0;
  
  // Calculate earliest accommodation booking date (after flights + accommodations are covered)
  const earliestAccommodationBookingDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToCombined);
    return date;
  }, [monthsToCombined]);
  
  // Check if accommodations can be booked today
  const canBookAccommodationNow = combinedSavingsGap === 0 || new Date() >= earliestAccommodationBookingDate;
  
  // Calculate percentage of accommodation cost saved
  const accommodationSavingsProgress = finalAccommodationCost > 0 
    ? Math.min(100, (savingsAllocatedToAccommodation / finalAccommodationCost) * 100) 
    : 0;

  // Handle accommodation selection
  const handleSelectAccommodation = (cityName: string, optionId: string) => {
    setSelectedAccommodations(prev => ({
      ...prev,
      [cityName]: prev[cityName] === optionId ? null : optionId
    }));
  };

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

              <Separator />

              {/* Flight Points Subsection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Flight Points</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="use-points" className="text-sm">Use points for flights?</Label>
                    <Switch
                      id="use-points"
                      checked={budgetData.flights.usePoints}
                      onCheckedChange={handleToggleUsePoints}
                      data-testid="switch-use-points"
                    />
                  </div>
                </div>

                {budgetData.flights.usePoints && (
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
                    {/* Points Balance & Input */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="points-to-use">Points to Use</Label>
                        <Input
                          id="points-to-use"
                          type="number"
                          min="0"
                          value={budgetData.flights.pointsToUse}
                          onChange={(e) => setBudgetData({
                            ...budgetData,
                            flights: { ...budgetData.flights, pointsToUse: e.target.value }
                          })}
                          placeholder="Enter points amount"
                          data-testid="input-points-to-use"
                        />
                        <p className="text-xs text-muted-foreground">
                          {pointsRequiredForFullCoverage.toLocaleString()} points needed for full coverage
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Connected Balance</Label>
                        {connectedPointsBalance !== null ? (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold text-primary">
                                  {connectedPointsBalance.toLocaleString()} pts
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ≈ ${(connectedPointsBalance * POINTS_CONVERSION_RATE).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} value
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleConnectCardAccount}
                                disabled={isConnectingCard}
                                className="gap-1"
                                data-testid="button-refresh-points"
                              >
                                <RefreshCw className={`w-4 h-4 ${isConnectingCard ? 'animate-spin' : ''}`} />
                                Refresh
                              </Button>
                            </div>
                            {pointsLastUpdated && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last updated: {pointsLastUpdated.toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={handleConnectCardAccount}
                            disabled={isConnectingCard}
                            className="w-full gap-2"
                            data-testid="button-connect-card"
                          >
                            {isConnectingCard ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                Connect Card to Fetch Points
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Points Coverage Info */}
                    {pointsToUse > 0 && (
                      <div className="p-3 rounded-lg bg-background border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Points Coverage</span>
                          <Badge variant={pointsCoveragePercentage >= 100 ? "default" : "secondary"}>
                            {pointsCoveragePercentage.toFixed(0)}% of flights
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Points value</p>
                            <p className="font-semibold text-green-600">
                              ${pointsDollarValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Remaining cash needed</p>
                            <p className="font-semibold">
                              ${estimatedFlightCost.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {pointsCoveragePercentage >= 100 && (
                          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Points fully cover your flights!</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Advisory Note */}
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                      <div className="flex items-start gap-2">
                        <Gift className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-700 dark:text-blue-400">
                          <p className="font-medium mb-1">About Credit Card Points</p>
                          <p>Points can significantly help reduce costs for group overseas travel. However, you should only open a credit card for points if you can responsibly handle payments and stay out of debt. Always pay your balance in full each month.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credit Card Offers Panel */}
                {budgetData.flights.usePoints && (
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-background to-muted/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold">Current Credit Card Offers</h4>
                      <Badge variant="secondary" className="text-xs">Featured</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {mockCreditCardOffers.map((offer) => (
                        <div 
                          key={offer.id} 
                          className="p-4 rounded-lg bg-background border hover-elevate transition-all"
                          data-testid={`card-offer-${offer.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-sm">{offer.name}</h5>
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="space-y-1 mb-3">
                            <p className="text-lg font-bold text-primary">{offer.bonus}</p>
                            <p className="text-xs text-muted-foreground">{offer.requirement}</p>
                            <p className="text-sm text-green-600">Est. value: {offer.bonusValue}</p>
                            <p className="text-xs text-muted-foreground">Annual fee: {offer.annualFee}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1"
                            onClick={() => window.open(offer.url, '_blank')}
                            data-testid={`button-view-offer-${offer.id}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Offer
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      These are example offers for illustration purposes. Always research current offers before applying.
                    </p>
                  </div>
                )}
              </div>

              <Separator />
              
              {/* Helper Text */}
              {!canBookFlightsNow && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-medium">Why is booking disabled?</span> You still need ${flightSavingsGap.toLocaleString()} more for flights{budgetData.flights.usePoints && pointsDollarValue > 0 ? ` (after ${pointsToUse.toLocaleString()} points applied)` : ''}. 
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
                      <span className="font-medium">You're ready!</span> You've saved enough to cover your flights{budgetData.flights.usePoints && pointsDollarValue > 0 ? ` (with ${pointsToUse.toLocaleString()} points reducing your cost by $${pointsDollarValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })})` : ''}. 
                      Book now to lock in prices 6-12 months before your trip for the best deals.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accommodation Costs Section */}
          <Card data-testid="card-accommodation-costs">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Accommodation Costs</CardTitle>
                    <CardDescription>Select and compare stays for each destination</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedAccommodationCost.allSelected ? "default" : "secondary"}>
                    {Object.values(selectedAccommodations).filter(Boolean).length} of {displayedDestinationDetails?.length || 0} selected
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estimated Accommodation Costs Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Estimated Accommodation Costs</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          {selectedAccommodationCost.allSelected 
                            ? "This is the total of your selected accommodations."
                            : "This is an AI estimate based on typical 4-star rates for your destinations. Select specific stays below for exact pricing."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-accommodation-cost">
                    ${finalAccommodationCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedAccommodationCost.allSelected ? "from your selections" : "AI estimated"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Savings Allocated</p>
                  </div>
                  <p className={`text-2xl font-bold ${savingsAllocatedToAccommodation >= finalAccommodationCost ? 'text-green-600' : ''}`} data-testid="text-accommodation-savings">
                    ${savingsAllocatedToAccommodation.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (after covering flights)
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Amount Still Needed</p>
                  </div>
                  <p className={`text-2xl font-bold ${accommodationSavingsGap === 0 ? 'text-green-600' : 'text-amber-600'}`} data-testid="text-accommodation-gap">
                    {accommodationSavingsGap === 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-5 h-5" />
                        $0
                      </span>
                    ) : (
                      `$${accommodationSavingsGap.toLocaleString()}`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {accommodationSavingsGap === 0 ? 'Accommodations covered!' : 'to save for stays'}
                  </p>
                </div>
              </div>

              {/* Accommodation Savings Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Accommodation Savings Progress</span>
                  <span className="font-medium">{accommodationSavingsProgress.toFixed(0)}% saved</span>
                </div>
                <Progress value={accommodationSavingsProgress} className="h-3" />
              </div>

              <Separator />

              {/* Itinerary Destinations with Accommodation Options */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Choose Your Stays</h3>
                
                {displayedDestinationDetails && displayedDestinationDetails.length > 0 ? (
                  displayedDestinationDetails.map((dest, idx) => {
                    const cityAccommodations = accommodationsByCity[dest.cityName];
                    const selectedId = selectedAccommodations[dest.cityName];
                    const selectedOption = selectedId && cityAccommodations
                      ? cityAccommodations.options.find(opt => opt.id === selectedId)
                      : null;
                    
                    return (
                      <div 
                        key={dest.cityName} 
                        className="p-4 rounded-lg border bg-muted/20"
                        data-testid={`accommodation-location-${idx}`}
                      >
                        {/* Location Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold">{dest.cityName}, {dest.countryName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {dest.numberOfNights} night{dest.numberOfNights > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {selectedOption && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Selected
                            </Badge>
                          )}
                        </div>

                        {/* Accommodation Options */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {cityAccommodations?.options.map((option) => {
                            const isSelected = selectedId === option.id;
                            const totalCost = option.nightlyCost * dest.numberOfNights;
                            
                            // If an option is selected, only show the selected one
                            if (selectedId && !isSelected) {
                              return null;
                            }
                            
                            return (
                              <div
                                key={option.id}
                                className={`p-4 rounded-lg border transition-all ${
                                  isSelected 
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                    : 'bg-background hover-elevate cursor-pointer'
                                }`}
                                onClick={() => handleSelectAccommodation(dest.cityName, option.id)}
                                data-testid={`accommodation-option-${option.id}`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={option.type === "hotel" ? "secondary" : "outline"} className="text-xs">
                                      {option.type === "hotel" ? "Hotel" : "Airbnb"}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-amber-500">
                                      <Star className="w-3 h-3 fill-current" />
                                      <span className="text-xs font-medium">{option.rating.toFixed(1)}</span>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                                <h5 className="font-medium text-sm mb-1">{option.name}</h5>
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                  {option.description}
                                </p>
                                <div className="flex items-end justify-between">
                                  <div>
                                    <p className="text-lg font-bold">${option.nightlyCost}</p>
                                    <p className="text-xs text-muted-foreground">per night</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-primary">${totalCost.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">total for {dest.numberOfNights} night{dest.numberOfNights > 1 ? 's' : ''}</p>
                                  </div>
                                </div>
                                {isSelected ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-3 gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectAccommodation(dest.cityName, option.id);
                                    }}
                                    data-testid={`button-change-${option.id}`}
                                  >
                                    Change Selection
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full mt-3 gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectAccommodation(dest.cityName, option.id);
                                    }}
                                    data-testid={`button-select-${option.id}`}
                                  >
                                    Select This Stay
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full mt-2 gap-1 text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(option.url, '_blank');
                                  }}
                                  data-testid={`button-view-details-${option.id}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View Details
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No destinations added yet. Add destinations to see accommodation options.</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Booking Info Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earliest Date to Book */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Earliest Date to Book Stays</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Based on needing ${totalFlightsAndAccommodation.toLocaleString()} total for flights + accommodations, with ${currentSavingsNum.toLocaleString()} saved and ${monthlySavingsNum.toLocaleString()}/month savings.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={`text-lg font-bold flex items-center gap-1 ${canBookAccommodationNow ? 'text-green-600' : ''}`} data-testid="text-earliest-accommodation-date">
                    <CalendarIcon className="w-4 h-4" />
                    {canBookAccommodationNow 
                      ? "Ready now!" 
                      : earliestAccommodationBookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }
                  </p>
                  {!canBookAccommodationNow && monthsToCombined > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthsToCombined} month{monthsToCombined > 1 ? 's' : ''} away
                    </p>
                  )}
                </div>

                {/* Book Stays Button */}
                <div className="p-4 rounded-lg bg-muted/50 border flex flex-col justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          className="w-full gap-2"
                          size="lg"
                          disabled={!canBookAccommodationNow}
                          data-testid="button-book-stays"
                        >
                          {canBookAccommodationNow ? (
                            <>
                              <MapPin className="w-5 h-5" />
                              Book Your Stays
                            </>
                          ) : (
                            <>
                              <Lock className="w-5 h-5" />
                              Book Stays
                            </>
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canBookAccommodationNow && (
                      <TooltipContent className="max-w-xs">
                        <p>You need ${combinedSavingsGap.toLocaleString()} more before booking. This keeps you debt-free!</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>

              {/* Helper Text */}
              {!canBookAccommodationNow && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-medium">We recommend waiting until {earliestAccommodationBookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> so you can book stays without going into debt. 
                      At your current savings rate, you'll have enough for both flights and accommodations by then.
                    </p>
                  </div>
                </div>
              )}

              {canBookAccommodationNow && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <span className="font-medium">You're ready to book!</span> You have enough saved to cover both flights (${estimatedFlightCost.toLocaleString()}) and accommodations (${finalAccommodationCost.toLocaleString()}). 
                      Book now to secure the best rates and availability.
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
