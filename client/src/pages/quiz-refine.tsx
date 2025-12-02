import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ItineraryAssistant from "@/components/ItineraryAssistant";
import { 
  Loader2, 
  Trash2, 
  Sparkles, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Plane, 
  Sunrise, 
  Sunset,
  Camera,
  Utensils,
  Mountain,
  Building,
  Music,
  ShoppingBag,
  Pencil,
  Plus,
  Check,
  X,
  Users,
  GripVertical,
  Clock,
  ExternalLink,
  RefreshCw,
  Car,
  Footprints,
  Bus,
  Train,
  Ship,
  Info,
  ChevronDown,
  ChevronUp,
  Coffee,
  Compass,
  Zap
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  ItineraryRecommendation,
  ItineraryAddon,
  ItineraryCitySegment,
  AdjustItineraryDurationRequest,
  ItineraryAddonsRequest,
  ApplyAddonRequest,
  QuizResponse,
  InsertTrip,
  Trip,
  TripWithDestinations,
  TripPersonality,
} from "@shared/schema";
import { tripPersonalitySchema } from "@shared/schema";

type TripType = "international" | "domestic" | "staycation";

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
import { NavBar } from "@/components/NavBar";
import { ProgressStepper } from "@/components/ProgressStepper";

interface ActivityAlternate {
  id: string;
  title: string;
  description: string;
  costEstimate?: number;
  externalLink?: string;
}

interface StructuredActivity {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location?: string;
  costEstimate?: number;
  externalLink?: string;
  isTravel?: boolean;
  travelMode?: string;
  alternates?: ActivityAlternate[];
}

interface DayPlan {
  dayNumber: number;
  dayTitle?: string;
  city: ItineraryCitySegment;
  dayInCity: number;
  totalDaysInCity: number;
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  activities: string[];
  structuredActivities?: StructuredActivity[];
  dailyCostEstimate?: number;
}


function getActivityIcon(activity: string) {
  const lowerActivity = activity.toLowerCase();
  if (lowerActivity.includes("museum") || lowerActivity.includes("gallery") || lowerActivity.includes("art")) {
    return <Building className="w-4 h-4 text-purple-500" />;
  }
  if (lowerActivity.includes("food") || lowerActivity.includes("restaurant") || lowerActivity.includes("cuisine") || lowerActivity.includes("eat") || lowerActivity.includes("dining")) {
    return <Utensils className="w-4 h-4 text-orange-500" />;
  }
  if (lowerActivity.includes("hike") || lowerActivity.includes("nature") || lowerActivity.includes("mountain") || lowerActivity.includes("beach") || lowerActivity.includes("park")) {
    return <Mountain className="w-4 h-4 text-green-500" />;
  }
  if (lowerActivity.includes("tour") || lowerActivity.includes("visit") || lowerActivity.includes("explore") || lowerActivity.includes("see")) {
    return <Camera className="w-4 h-4 text-blue-500" />;
  }
  if (lowerActivity.includes("show") || lowerActivity.includes("concert") || lowerActivity.includes("music") || lowerActivity.includes("entertainment")) {
    return <Music className="w-4 h-4 text-pink-500" />;
  }
  if (lowerActivity.includes("shop") || lowerActivity.includes("market") || lowerActivity.includes("bazaar")) {
    return <ShoppingBag className="w-4 h-4 text-amber-500" />;
  }
  return <Camera className="w-4 h-4 text-primary" />;
}

function getTravelIcon(travelMode?: string) {
  switch (travelMode?.toLowerCase()) {
    case "walk":
      return <Footprints className="w-4 h-4 text-emerald-500" />;
    case "taxi":
    case "car":
    case "uber":
      return <Car className="w-4 h-4 text-yellow-600" />;
    case "bus":
      return <Bus className="w-4 h-4 text-blue-600" />;
    case "train":
    case "subway":
    case "metro":
      return <Train className="w-4 h-4 text-purple-600" />;
    case "ferry":
    case "boat":
      return <Ship className="w-4 h-4 text-cyan-600" />;
    case "flight":
      return <Plane className="w-4 h-4 text-sky-500" />;
    default:
      return <Footprints className="w-4 h-4 text-muted-foreground" />;
  }
}

function getStructuredActivityIcon(activity: StructuredActivity) {
  if (activity.isTravel) {
    return getTravelIcon(activity.travelMode);
  }
  return getActivityIcon(activity.title);
}

function generateSupplementaryActivities(
  city: ItineraryCitySegment,
  dayInCity: number,
  totalDaysInCity: number,
  isArrival: boolean,
  isDeparture: boolean,
  isFirstCity: boolean
): string[] {
  const supplementary: string[] = [];
  const cityName = city.cityName;

  if (isArrival && isFirstCity) {
    supplementary.push(`Arrive in ${cityName} and check into your accommodation`);
    supplementary.push(`Take a leisurely walk to get oriented with the neighborhood`);
    supplementary.push(`Enjoy a welcome dinner at a local restaurant`);
  } else if (isArrival) {
    supplementary.push(`Travel to ${cityName} and settle into your new accommodation`);
    supplementary.push(`Explore the area around your hotel or rental`);
    supplementary.push(`Find a cozy spot for dinner and plan tomorrow's adventures`);
  } else if (isDeparture) {
    supplementary.push(`Morning: Last-minute exploration or revisit a favorite spot`);
    supplementary.push(`Pick up any souvenirs or local specialties to take home`);
    supplementary.push(`Afternoon: Pack up and prepare for travel to your next destination`);
  } else if (dayInCity === totalDaysInCity && !isDeparture) {
    supplementary.push(`Morning: Sleep in or enjoy a relaxed breakfast`);
    supplementary.push(`Revisit a favorite spot or discover a hidden gem`);
    supplementary.push(`Evening: Farewell dinner celebrating your time in ${cityName}`);
  } else {
    const dayActivities = [
      [`Morning coffee at a local cafe in ${cityName}`, `Explore the historic center and main squares`, `Lunch at a highly-rated local eatery`],
      [`Visit a local market or artisan shops`, `Afternoon stroll through scenic neighborhoods`, `Sunset drinks with a view`],
      [`Take a day trip to nearby attractions`, `Sample regional cuisine at a traditional restaurant`, `Evening walk along the waterfront or park`],
      [`Morning yoga or jog in a local park`, `Visit lesser-known museums or galleries`, `Try street food or a food hall for dinner`],
      [`Cooking class featuring local dishes`, `Explore the nightlife scene or evening entertainment`, `Late-night dessert or gelato walk`],
    ];
    const activitySet = dayActivities[(dayInCity - 1) % dayActivities.length];
    supplementary.push(...activitySet);
  }

  return supplementary;
}

function generateDayByDayPlan(itinerary: ItineraryRecommendation): DayPlan[] {
  const dayPlans: DayPlan[] = [];
  let currentDay = 1;
  const usedActivities = new Set<string>();

  for (const city of itinerary.cities) {
    const uniqueCityActivities = city.activities.filter(a => !usedActivities.has(a));
    
    const activitiesPerDay = Math.max(2, Math.ceil(uniqueCityActivities.length / city.stayLengthNights));
    let activityIndex = 0;

    for (let dayInCity = 1; dayInCity <= city.stayLengthNights; dayInCity++) {
      const isArrivalDay = dayInCity === 1;
      const isDepartureDay = dayInCity === city.stayLengthNights && city.order < itinerary.cities.length;
      const isFirstCity = city.order === 1;
      
      const dayActivities: string[] = [];
      
      for (let i = 0; i < activitiesPerDay && activityIndex < uniqueCityActivities.length; i++) {
        const activity = uniqueCityActivities[activityIndex];
        if (!usedActivities.has(activity)) {
          dayActivities.push(activity);
          usedActivities.add(activity);
        }
        activityIndex++;
      }

      if (dayActivities.length < 2) {
        const supplementary = generateSupplementaryActivities(
          city,
          dayInCity,
          city.stayLengthNights,
          isArrivalDay,
          isDepartureDay,
          isFirstCity
        );
        
        for (const supp of supplementary) {
          if (dayActivities.length < 3 && !usedActivities.has(supp)) {
            dayActivities.push(supp);
            usedActivities.add(supp);
          }
        }
      }

      if (dayActivities.length === 0) {
        dayActivities.push(`Free time to explore ${city.cityName} at your own pace`);
      }

      dayPlans.push({
        dayNumber: currentDay,
        city,
        dayInCity,
        totalDaysInCity: city.stayLengthNights,
        isArrivalDay,
        isDepartureDay,
        activities: dayActivities,
      });
      currentDay++;
    }
  }

  return dayPlans;
}

export default function QuizRefine() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();

  // Parse draft ID from URL params
  const draftId = new URLSearchParams(searchString).get("draft");
  
  // Track if we're loading a draft
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!draftId);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId);

  const [currentItinerary, setCurrentItinerary] = useState<ItineraryRecommendation | null>(null);
  const [numberOfTravelers, setNumberOfTravelers] = useState<number>(1);
  const [desiredNights, setDesiredNights] = useState<number>(7);
  const [addons, setAddons] = useState<ItineraryAddon[]>([]);
  const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null);
  
  // Quiz preferences state
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [tripType, setTripType] = useState<TripType>("international");
  
  // Day plans state - stores activities per day directly
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);

  // Editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingTagline, setEditingTagline] = useState(false);
  const [editingTravelers, setEditingTravelers] = useState(false);
  const [editingCity, setEditingCity] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState<{ dayNumber: number; activityIndex: number } | null>(null);
  const [newActivityDay, setNewActivityDay] = useState<number | null>(null);
  const [newActivityText, setNewActivityText] = useState("");
  const [addingCity, setAddingCity] = useState(false);
  const [expandedAlternates, setExpandedAlternates] = useState<Set<string>>(new Set());
  const [newCity, setNewCity] = useState({ cityName: "", countryName: "", nights: 2 });

  // Temporary edit values
  const [tempTitle, setTempTitle] = useState("");
  const [tempTagline, setTempTagline] = useState("");
  const [tempTravelers, setTempTravelers] = useState(1);
  const [tempCity, setTempCity] = useState({ cityName: "", countryName: "", nights: 1 });
  const [tempActivity, setTempActivity] = useState("");

  // AI generation state
  const [aiGenerationComplete, setAiGenerationComplete] = useState(false);
  const aiGenerationTriggeredRef = useRef(false);
  
  // Progressive loading state - tracks which days have been revealed
  const [revealedDays, setRevealedDays] = useState<Set<number>>(new Set());
  const [currentLoadingDay, setCurrentLoadingDay] = useState<number | null>(null);
  const [pebblesMessage, setPebblesMessage] = useState<string>("");
  const progressiveRevealTimeouts = useRef<NodeJS.Timeout[]>([]);
  
  // Cleanup progressive reveal timeouts on unmount
  useEffect(() => {
    return () => {
      progressiveRevealTimeouts.current.forEach(t => clearTimeout(t));
    };
  }, []);
  
  // Pebbles messages for progressive loading
  const pebblesMessages = useMemo(() => [
    "Checking the weather forecast...",
    "Finding the best local spots...",
    "Planning perfect timing for activities...",
    "Adding travel time between locations...",
    "Including must-see attractions...",
    "Making sure you have time to rest...",
    "Adding some hidden gems...",
    "Finalizing your adventure...",
  ], []);
  
  // Trip pace - initialized from quiz, but now user-adjustable via toggle
  // Maps quiz values: "relaxed" → "slow", "balanced" → "moderate", "packed" → "fast"
  const initialPace = useMemo(() => {
    const quizDayPace = quizData?.dayPace;
    if (quizDayPace === "relaxed") return "slow" as const;
    if (quizDayPace === "packed") return "fast" as const;
    return "moderate" as const;
  }, [quizData?.dayPace]);
  
  // User-selected pace (can be changed via toggle)
  const [selectedPace, setSelectedPace] = useState<"slow" | "moderate" | "fast">(initialPace);
  
  // Sync selectedPace with quiz data when it changes
  useEffect(() => {
    setSelectedPace(initialPace);
  }, [initialPace]);
  
  // Use selectedPace instead of derived tripPace
  const tripPace = selectedPace;

  // AI itinerary plan generation mutation
  const aiPlanMutation = useMutation({
    mutationFn: async (paceOverride?: "slow" | "moderate" | "fast") => {
      if (!currentItinerary) throw new Error("No itinerary");
      // Use pace override if provided (for pace toggle), otherwise use derived tripPace
      const effectivePace = paceOverride || tripPace;
      const validatedPersonality = tripPersonalitySchema.parse({ pace: effectivePace });
      const response = await apiRequest("POST", "/api/ai/itinerary-plan", {
        itinerary: currentItinerary,
        numberOfTravelers,
        tripType,
        tripPersonality: validatedPersonality,
        departureLocation: quizData?.departureLocation,
        quizPreferences: {
          tripGoal: quizData?.tripGoal,
          placeType: quizData?.placeType,
          dayPace: quizData?.dayPace,
          spendingPriority: quizData?.spendingPriority,
          // Extended properties from GettingStartedData flow - use type-safe access
          travelersType: (quizData as Record<string, unknown>)?.travelersType,
          kidsAges: (quizData as Record<string, unknown>)?.kidsAges,
          accommodationType: (quizData as Record<string, unknown>)?.accommodationType,
          mustHave: (quizData as Record<string, unknown>)?.mustHave,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.dayPlans && data.dayPlans.length > 0) {
        // Store all day data immediately but reveal progressively
        setDayPlans(prev => {
          const updatedPlans = [...prev];
          for (const aiDay of data.dayPlans) {
            const existingIndex = updatedPlans.findIndex(p => p.dayNumber === aiDay.dayNumber);
            if (existingIndex >= 0) {
              updatedPlans[existingIndex] = {
                ...updatedPlans[existingIndex],
                dayTitle: aiDay.dayTitle,
                activities: aiDay.activities,
                structuredActivities: aiDay.structuredActivities,
                dailyCostEstimate: aiDay.dailyCostEstimate,
              };
            }
          }
          return updatedPlans;
        });
        
        // Clear any existing timeouts before starting new reveal sequence
        progressiveRevealTimeouts.current.forEach(t => clearTimeout(t));
        progressiveRevealTimeouts.current = [];
        
        // Progressive reveal - reveal each day with a delay
        const dayNumbers = data.dayPlans.map((d: { dayNumber: number }) => d.dayNumber).sort((a: number, b: number) => a - b);
        dayNumbers.forEach((dayNum: number, index: number) => {
          const outerTimeout = setTimeout(() => {
            setCurrentLoadingDay(dayNum);
            setPebblesMessage(pebblesMessages[index % pebblesMessages.length]);
            
            const innerTimeout = setTimeout(() => {
              setRevealedDays(prev => new Set([...Array.from(prev), dayNum]));
              // On last day, mark complete
              if (index === dayNumbers.length - 1) {
                setCurrentLoadingDay(null);
                setPebblesMessage("");
                setAiGenerationComplete(true);
                toast({
                  title: "Itinerary complete!",
                  description: "Pebbles has finished planning your adventure.",
                });
              }
            }, 300);
            progressiveRevealTimeouts.current.push(innerTimeout);
          }, index * 600); // 600ms between each day reveal
          progressiveRevealTimeouts.current.push(outerTimeout);
        });
      }
    },
    onError: (error: Error) => {
      console.error("AI plan generation error:", error);
      toast({
        title: "Could not generate activities",
        description: "Using default activities. You can still refine your itinerary manually.",
        variant: "destructive",
      });
      setAiGenerationComplete(true);
    },
  });

  // Track which activity is currently generating new alternatives
  const [generatingAlternativesFor, setGeneratingAlternativesFor] = useState<{
    dayNumber: number;
    activityIndex: number;
  } | null>(null);

  // Mutation for generating new alternatives for an activity
  const generateAlternativesMutation = useMutation({
    mutationFn: async (params: {
      dayNumber: number;
      activityIndex: number;
      activity: StructuredActivity;
      city: DayPlan["city"];
    }) => {
      const response = await apiRequest("POST", "/api/ai/generate-alternative", {
        cityName: params.city.cityName,
        countryName: params.city.countryName,
        currentActivity: {
          title: params.activity.title,
          description: params.activity.description,
          startTime: params.activity.startTime,
          endTime: params.activity.endTime,
        },
        existingAlternates: params.activity.alternates?.map(a => ({ title: a.title })) || [],
        tripType,
        quizPreferences: {
          tripGoal: quizData?.tripGoal,
          dayPace: quizData?.dayPace,
          spendingPriority: quizData?.spendingPriority,
          travelersType: (quizData as Record<string, unknown>)?.travelersType as string | undefined,
          kidsAges: (quizData as Record<string, unknown>)?.kidsAges as string[] | undefined,
        },
      });
      return { ...await response.json(), dayNumber: params.dayNumber, activityIndex: params.activityIndex };
    },
    onSuccess: (data) => {
      if (data.alternates && data.alternates.length > 0) {
        setDayPlans(prev => prev.map(day => {
          if (day.dayNumber === data.dayNumber && day.structuredActivities) {
            const updatedStructuredActivities = [...day.structuredActivities];
            const currentActivity = updatedStructuredActivities[data.activityIndex];
            
            if (currentActivity) {
              updatedStructuredActivities[data.activityIndex] = {
                ...currentActivity,
                alternates: data.alternates,
              };
            }
            
            return { ...day, structuredActivities: updatedStructuredActivities };
          }
          return day;
        }));
        
        toast({
          title: "New alternatives ready!",
          description: `Generated ${data.alternates.length} new options for you.`,
        });
      }
    },
    onError: (error: Error) => {
      console.error("Generate alternatives error:", error);
      toast({
        title: "Could not generate alternatives",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always clear the loading state when mutation completes (success or error)
      setGeneratingAlternativesFor(null);
    },
  });

  const handleGenerateAlternatives = (dayNumber: number, activityIndex: number, activity: StructuredActivity, city: DayPlan["city"]) => {
    setGeneratingAlternativesFor({ dayNumber, activityIndex });
    generateAlternativesMutation.mutate({ dayNumber, activityIndex, activity, city });
  };

  // Normalize activity text for matching - strips punctuation and extra whitespace
  const normalizeActivity = (text: string): string => {
    return text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
  };

  // Match activity using normalized comparison
  const matchesActivity = (existing: string, target: string): boolean => {
    const existingNorm = normalizeActivity(existing);
    const targetNorm = normalizeActivity(target);
    
    // Exact normalized match
    if (existingNorm === targetNorm) return true;
    
    // One contains the other completely (handles "Visit museum" matching "Visit the museum")
    if (existingNorm.includes(targetNorm) && targetNorm.length > existingNorm.length * 0.5) return true;
    if (targetNorm.includes(existingNorm) && existingNorm.length > targetNorm.length * 0.5) return true;
    
    return false;
  };

  // Handle applying changes from the assistant
  const handleApplyAssistantChanges = (changes: { dayNumber: number; action: "add" | "remove" | "replace"; activities: string[] }[]) => {
    let hasUnknownAction = false;
    
    setDayPlans(prev => {
      const updatedPlans = [...prev];
      for (const change of changes) {
        const dayIndex = updatedPlans.findIndex(p => p.dayNumber === change.dayNumber);
        if (dayIndex >= 0) {
          if (change.action === "replace") {
            updatedPlans[dayIndex] = {
              ...updatedPlans[dayIndex],
              activities: change.activities.length > 0 ? change.activities : [`Explore ${updatedPlans[dayIndex].city.cityName}`],
            };
          } else if (change.action === "add") {
            updatedPlans[dayIndex] = {
              ...updatedPlans[dayIndex],
              activities: [...updatedPlans[dayIndex].activities, ...change.activities],
            };
          } else if (change.action === "remove") {
            // Remove activities using fuzzy matching
            const remainingActivities = updatedPlans[dayIndex].activities.filter(
              activity => !change.activities.some(removeTarget => matchesActivity(activity, removeTarget))
            );
            // Keep at least one activity with a day-specific default
            const defaultActivity = updatedPlans[dayIndex].isArrivalDay 
              ? `Arrive and settle in ${updatedPlans[dayIndex].city.cityName}`
              : updatedPlans[dayIndex].isDepartureDay
                ? `Final morning in ${updatedPlans[dayIndex].city.cityName}`
                : `Explore ${updatedPlans[dayIndex].city.cityName}`;
            updatedPlans[dayIndex] = {
              ...updatedPlans[dayIndex],
              activities: remainingActivities.length > 0 ? remainingActivities : [defaultActivity],
            };
          } else {
            console.warn(`Unknown action type: ${change.action}`);
            hasUnknownAction = true;
          }
        }
      }
      return updatedPlans;
    });

    if (hasUnknownAction) {
      toast({
        title: "Some changes could not be applied",
        description: "The assistant suggested a change type that isn't supported yet.",
        variant: "destructive",
      });
    }
  };

  // Update handlers
  const handleUpdateTitle = () => {
    if (!currentItinerary || !tempTitle.trim()) return;
    setCurrentItinerary({ ...currentItinerary, title: tempTitle.trim() });
    setEditingTitle(false);
  };

  const handleUpdateTagline = () => {
    if (!currentItinerary || !tempTagline.trim()) return;
    setCurrentItinerary({ ...currentItinerary, vibeTagline: tempTagline.trim() });
    setEditingTagline(false);
  };

  const handleUpdateTravelers = () => {
    if (tempTravelers < 1 || tempTravelers > 20) return;
    setNumberOfTravelers(tempTravelers);
    setEditingTravelers(false);
  };

  const handleUpdateCity = (cityOrder: number) => {
    if (!currentItinerary || !tempCity.cityName.trim() || !tempCity.countryName.trim()) return;
    
    const updatedCities = currentItinerary.cities.map(city => {
      if (city.order === cityOrder) {
        return {
          ...city,
          cityName: tempCity.cityName.trim(),
          countryName: tempCity.countryName.trim(),
          stayLengthNights: Math.max(1, tempCity.nights),
        };
      }
      return city;
    });

    const newTotalNights = updatedCities.reduce((sum, city) => sum + city.stayLengthNights, 0);
    
    setCurrentItinerary({
      ...currentItinerary,
      cities: updatedCities,
      totalNights: newTotalNights,
    });
    setDesiredNights(newTotalNights);
    setEditingCity(null);
  };

  const handleUpdateActivity = (dayNumber: number, activityIndex: number) => {
    if (!tempActivity.trim()) return;

    setDayPlans(prev => prev.map(day => {
      if (day.dayNumber === dayNumber) {
        const updatedActivities = [...day.activities];
        updatedActivities[activityIndex] = tempActivity.trim();
        
        // Also update structured activities if they exist
        let updatedStructuredActivities = day.structuredActivities;
        if (day.structuredActivities && day.structuredActivities[activityIndex]) {
          updatedStructuredActivities = [...day.structuredActivities];
          updatedStructuredActivities[activityIndex] = {
            ...updatedStructuredActivities[activityIndex],
            title: tempActivity.trim(),
          };
        }
        
        return { 
          ...day, 
          activities: updatedActivities,
          structuredActivities: updatedStructuredActivities,
        };
      }
      return day;
    }));
    setEditingActivity(null);
  };

  const handleDeleteActivity = (dayNumber: number, activityIndex: number) => {
    setDayPlans(prev => prev.map(day => {
      if (day.dayNumber === dayNumber) {
        const updatedActivities = day.activities.filter((_, idx) => idx !== activityIndex);
        if (updatedActivities.length === 0) {
          updatedActivities.push(`Free time to explore ${day.city.cityName}`);
        }
        
        // Also update structured activities if they exist
        let updatedStructuredActivities = day.structuredActivities;
        if (day.structuredActivities) {
          updatedStructuredActivities = day.structuredActivities.filter((_, idx) => idx !== activityIndex);
          if (updatedStructuredActivities.length === 0) {
            updatedStructuredActivities = undefined; // Fall back to string activities
          }
        }
        
        return { 
          ...day, 
          activities: updatedActivities,
          structuredActivities: updatedStructuredActivities,
        };
      }
      return day;
    }));
  };

  const handleAddActivity = (dayNumber: number) => {
    if (!newActivityText.trim()) return;

    setDayPlans(prev => prev.map(day => {
      if (day.dayNumber === dayNumber) {
        const newActivity = newActivityText.trim();
        
        // If structured activities exist, add a new structured activity too
        let updatedStructuredActivities = day.structuredActivities;
        if (day.structuredActivities && day.structuredActivities.length > 0) {
          const lastActivity = day.structuredActivities[day.structuredActivities.length - 1];
          const newStructuredActivity: StructuredActivity = {
            id: `day${dayNumber}-custom-${Date.now()}`,
            startTime: lastActivity?.endTime || "12:00 PM",
            endTime: "1:00 PM",
            title: newActivity,
            description: "Custom activity added by user",
            costEstimate: 0,
          };
          updatedStructuredActivities = [...day.structuredActivities, newStructuredActivity];
        }
        
        return { 
          ...day, 
          activities: [...day.activities, newActivity],
          structuredActivities: updatedStructuredActivities,
        };
      }
      return day;
    }));
    setNewActivityDay(null);
    setNewActivityText("");
  };

  // Swap an activity with one of its alternates
  const handleSwapWithAlternate = (dayNumber: number, activityIndex: number, alternate: ActivityAlternate) => {
    setDayPlans(prev => prev.map(day => {
      if (day.dayNumber === dayNumber && day.structuredActivities) {
        const updatedStructuredActivities = [...day.structuredActivities];
        const currentActivity = updatedStructuredActivities[activityIndex];
        
        if (currentActivity) {
          // Build new alternates list preserving all data across swaps:
          // 1. Add current activity as an alternate (preserving all its data)
          // 2. Keep all existing alternates except the one being swapped to
          // 3. Include any alternates the chosen alternate might have carried
          // This ensures users can continue cycling through all options
          const chosenAlternateAlternates = (alternate as unknown as { alternates?: ActivityAlternate[] }).alternates || [];
          
          // Preserve full current activity data as an alternate
          // ActivityAlternate stores: id, title, description, costEstimate, externalLink
          const currentAsAlternate: ActivityAlternate = {
            id: currentActivity.id,
            title: currentActivity.title,
            description: currentActivity.description || "",
            costEstimate: currentActivity.costEstimate,
            externalLink: currentActivity.externalLink,
          };
          
          // Collect ALL alternates to preserve the full swap history
          const newAlternates: ActivityAlternate[] = [
            // Current activity becomes an alternate (user can swap back)
            currentAsAlternate,
            // Keep all other alternates from the current activity (except the one being used)
            ...(currentActivity.alternates?.filter(alt => alt.id !== alternate.id) || []),
            // Include any alternates the chosen alternate had (preserves nested options)
            ...chosenAlternateAlternates,
          ];
          
          // Deduplicate by id to prevent duplicate alternates after multiple swaps
          const uniqueAlternates = newAlternates.filter((alt, index, self) => 
            index === self.findIndex(a => a.id === alt.id)
          );
          
          // Create the swapped activity - merge alternate onto current activity
          // Missing fields in alternate fallback to current activity data
          const swappedActivity: StructuredActivity = {
            id: alternate.id,
            startTime: currentActivity.startTime,
            endTime: currentActivity.endTime,
            title: alternate.title,
            description: alternate.description || currentActivity.description || "",
            location: currentActivity.location, // Preserve location context from time slot
            costEstimate: alternate.costEstimate ?? currentActivity.costEstimate,
            externalLink: alternate.externalLink || currentActivity.externalLink,
            isTravel: false,
            alternates: uniqueAlternates,
          };
          
          updatedStructuredActivities[activityIndex] = swappedActivity;
        }
        
        // Also update the string activities array
        const updatedActivities = [...day.activities];
        if (updatedActivities[activityIndex]) {
          updatedActivities[activityIndex] = `${currentActivity?.startTime} - ${currentActivity?.endTime}: ${alternate.title}`;
        }
        
        return { 
          ...day, 
          activities: updatedActivities,
          structuredActivities: updatedStructuredActivities,
        };
      }
      return day;
    }));
    
    // Collapse the alternates section after swap
    setExpandedAlternates(prev => {
      const next = new Set(prev);
      const activityId = dayPlans.find(d => d.dayNumber === dayNumber)?.structuredActivities?.[activityIndex]?.id;
      if (activityId) next.delete(activityId);
      return next;
    });
    
    toast({
      title: "Activity swapped",
      description: `Changed to "${alternate.title}"`,
    });
  };

  const handleAddNewCity = () => {
    if (!currentItinerary || !newCity.cityName.trim() || !newCity.countryName.trim()) return;

    const newCitySegment: ItineraryCitySegment = {
      order: currentItinerary.cities.length + 1,
      cityName: newCity.cityName.trim(),
      countryName: newCity.countryName.trim(),
      stayLengthNights: Math.max(1, newCity.nights),
      activities: [`Explore ${newCity.cityName.trim()}`, `Sample local cuisine in ${newCity.cityName.trim()}`],
      imageQuery: `${newCity.cityName.trim()} ${newCity.countryName.trim()} travel`,
    };

    const updatedCities = [...currentItinerary.cities, newCitySegment];
    const newTotalNights = updatedCities.reduce((sum, city) => sum + city.stayLengthNights, 0);

    setCurrentItinerary({
      ...currentItinerary,
      cities: updatedCities,
      totalNights: newTotalNights,
    });
    setDesiredNights(newTotalNights);
    setAddingCity(false);
    setNewCity({ cityName: "", countryName: "", nights: 2 });
  };

  // Load draft from API if draft ID is present
  useEffect(() => {
    const loadDraft = async () => {
      if (draftId) {
        try {
          const response = await fetch(`/api/trips/${draftId}`);
          if (!response.ok) throw new Error("Failed to load draft");
          const trip = await response.json() as TripWithDestinations & { 
            draftItineraryData?: ItineraryRecommendation;
            draftQuizData?: QuizResponse;
          };
          
          if (trip.status !== "draft") {
            toast({
              title: "This trip is not a draft",
              description: "Redirecting to trip planner",
            });
            setLocation(`/trip/${draftId}`);
            return;
          }
          
          // Use draft itinerary data if available
          if (trip.draftItineraryData) {
            const itinerary = trip.draftItineraryData;
            setCurrentItinerary(itinerary);
            setDesiredNights(itinerary.totalNights);
            const initialDayPlans = generateDayByDayPlan(itinerary);
            setDayPlans(initialDayPlans);
          } else if (trip.destinations?.length > 0) {
            // Build itinerary from destinations
            const cities: ItineraryCitySegment[] = trip.destinations
              .sort((a, b) => a.order - b.order)
              .map((dest, idx) => ({
                cityName: dest.cityName,
                countryName: dest.countryName,
                stayLengthNights: dest.numberOfNights,
                order: idx + 1,
                arrivalAirport: dest.arrivalAirport || undefined,
                departureAirport: dest.departureAirport || undefined,
                activities: dest.activities || [],
                imageQuery: `${dest.cityName} ${dest.countryName} travel`,
              }));
            
            const totalNights = cities.reduce((sum, c) => sum + c.stayLengthNights, 0);
            const itinerary: ItineraryRecommendation = {
              id: crypto.randomUUID(),
              title: trip.title || "Your Trip",
              vibeTagline: "Continue planning your adventure",
              isCurveball: false,
              totalCost: { min: 0, max: 0, currency: "USD" },
              costBreakdown: { flights: 0, housing: 0, food: 0, fun: 0, transportation: 0, preparation: 0 },
              cities,
              bestTimeToVisit: "Year-round",
              totalNights,
            };
            setCurrentItinerary(itinerary);
            setDesiredNights(totalNights);
            const initialDayPlans = generateDayByDayPlan(itinerary);
            setDayPlans(initialDayPlans);
          }
          
          setNumberOfTravelers(trip.numberOfTravelers || 1);
          
          // Load quiz data if available (pace is derived from quizData.dayPace automatically)
          if (trip.draftQuizData) {
            setQuizData(trip.draftQuizData);
          }
          
          setCurrentDraftId(draftId);
          setIsLoadingDraft(false);
          
          toast({
            title: "Draft loaded",
            description: "Continue refining your itinerary",
          });
        } catch (error) {
          console.error("Failed to load draft:", error);
          toast({
            title: "Failed to load draft",
            description: "Loading from session instead",
            variant: "destructive",
          });
          setIsLoadingDraft(false);
          loadFromSession();
        }
      } else {
        loadFromSession();
      }
    };
    
    const loadFromSession = () => {
      try {
        const storedItinerary = sessionStorage.getItem("selectedItinerary");
        const storedTravelers = sessionStorage.getItem("quizNumberOfTravelers");
        const storedQuizData = sessionStorage.getItem("quizData");
        const storedGettingStartedData = sessionStorage.getItem("gettingStartedData");
        const storedTripType = sessionStorage.getItem("tripType");

        if (!storedItinerary) {
          toast({
            title: "No itinerary found",
            description: "Please complete the quiz first",
            variant: "destructive",
          });
          setLocation("/quiz");
          return;
        }

        const itinerary = JSON.parse(storedItinerary) as ItineraryRecommendation;
        const travelers = storedTravelers ? parseInt(storedTravelers, 10) : 1;

        setCurrentItinerary(itinerary);
        setNumberOfTravelers(travelers);
        setDesiredNights(itinerary.totalNights);
        
        // Load quiz preferences from quizData (pace is derived from quizData.dayPace automatically)
        if (storedQuizData) {
          const quiz = JSON.parse(storedQuizData) as QuizResponse;
          setQuizData(quiz);
        }
        
        // Load trip type - check multiple sources in order of priority:
        // 1. Direct tripType key (set by quiz-results for staycation)
        // 2. Getting started data (new flow)
        // 3. Default to international (legacy quiz fallback)
        if (storedTripType && (storedTripType === "international" || storedTripType === "domestic" || storedTripType === "staycation")) {
          setTripType(storedTripType as TripType);
        } else if (storedGettingStartedData) {
          const gsData = JSON.parse(storedGettingStartedData) as GettingStartedData;
          if (gsData.tripType) {
            setTripType(gsData.tripType);
          }
        }
        // Otherwise, keep default "international"
        
        // Initialize day plans from the itinerary
        const initialDayPlans = generateDayByDayPlan(itinerary);
        setDayPlans(initialDayPlans);
      } catch (error) {
        console.error("Failed to load itinerary:", error);
        toast({
          title: "Error loading itinerary",
          description: "Please try again",
          variant: "destructive",
        });
        setLocation("/quiz");
      }
    };
    
    loadDraft();
  }, [draftId, setLocation, toast]);
  
  // Regenerate day plans when cities change (e.g., add/edit/delete city)
  useEffect(() => {
    if (currentItinerary && dayPlans.length > 0) {
      // Check if cities structure changed (different number of cities or nights)
      const currentTotalNights = dayPlans.reduce((_, day) => Math.max(_, day.dayNumber), 0);
      if (currentTotalNights !== currentItinerary.totalNights) {
        const newDayPlans = generateDayByDayPlan(currentItinerary);
        setDayPlans(newDayPlans);
      }
    }
  }, [currentItinerary?.totalNights, currentItinerary?.cities.length]);

  // Auto-generate AI activities on page load (once)
  useEffect(() => {
    if (currentItinerary && dayPlans.length > 0 && !aiGenerationTriggeredRef.current) {
      aiGenerationTriggeredRef.current = true;
      aiPlanMutation.mutate();
    }
  }, [currentItinerary, dayPlans.length]);

  const adjustDurationMutation = useMutation({
    mutationFn: async (request: AdjustItineraryDurationRequest) => {
      const response = await apiRequest("POST", "/api/ai/adjust-itinerary-duration", request);
      const data = (await response.json()) as { itinerary: ItineraryRecommendation };
      return data.itinerary;
    },
    onSuccess: (updatedItinerary) => {
      setCurrentItinerary(updatedItinerary);
      setAddons([]);
      setSelectedAddonId(null);
      toast({
        title: "Itinerary updated",
        description: `Your trip is now ${updatedItinerary.totalNights} nights`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to adjust duration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchAddonsMutation = useMutation({
    mutationFn: async (request: ItineraryAddonsRequest) => {
      const response = await apiRequest("POST", "/api/ai/itinerary-addons", request);
      const data = (await response.json()) as { addons: ItineraryAddon[] };
      return data.addons;
    },
    onSuccess: (newAddons) => {
      setAddons(newAddons);
      setSelectedAddonId(null);
      toast({
        title: "Add-ons generated",
        description: `${newAddons.length} options available`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate add-ons",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const applyAddonMutation = useMutation({
    mutationFn: async (request: ApplyAddonRequest) => {
      const response = await apiRequest("POST", "/api/ai/apply-addon", request);
      const data = (await response.json()) as { itinerary: ItineraryRecommendation };
      return data.itinerary;
    },
    onSuccess: (updatedItinerary) => {
      setCurrentItinerary(updatedItinerary);
      setDesiredNights(updatedItinerary.totalNights);
      setAddons([]);
      setSelectedAddonId(null);
      toast({
        title: "Add-on applied",
        description: `Your trip is now ${updatedItinerary.totalNights} nights`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to apply add-on",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create trip mutation for finalizing itinerary
  const createTripMutation = useMutation({
    mutationFn: async (data: InsertTrip) => {
      const response = await apiRequest("POST", "/api/trips", data);
      return response.json() as Promise<Trip>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: InsertTrip & { draftItineraryData: unknown; draftQuizData: unknown }) => {
      const response = await apiRequest("POST", "/api/trips", data);
      return response.json() as Promise<Trip>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
  });

  const isBusy =
    adjustDurationMutation.isPending ||
    fetchAddonsMutation.isPending ||
    applyAddonMutation.isPending ||
    createTripMutation.isPending ||
    saveDraftMutation.isPending;

  const handleDeleteCity = (cityOrder: number) => {
    if (!currentItinerary) return;
    if (currentItinerary.cities.length <= 1) {
      toast({
        title: "Cannot delete city",
        description: "At least one city is required",
        variant: "destructive",
      });
      return;
    }

    const updatedCities = currentItinerary.cities
      .filter((city) => city.order !== cityOrder)
      .map((city, index) => ({ ...city, order: index + 1 }));

    const newTotalNights = updatedCities.reduce((sum, city) => sum + city.stayLengthNights, 0);

    setCurrentItinerary({
      ...currentItinerary,
      cities: updatedCities,
      totalNights: newTotalNights,
    });
    setDesiredNights(newTotalNights);
    setAddons([]);
    setSelectedAddonId(null);
  };

  const handleAdjustDuration = () => {
    if (!currentItinerary) return;
    adjustDurationMutation.mutate({
      itinerary: currentItinerary,
      newTotalNights: desiredNights,
      numberOfTravelers,
      allowCityRemoval: true,
    });
  };

  const handleGenerateAddons = () => {
    if (!currentItinerary) return;
    fetchAddonsMutation.mutate({
      itinerary: currentItinerary,
      numberOfTravelers,
    });
  };

  const handleApplyAddon = () => {
    if (!currentItinerary || !selectedAddonId) return;
    const addon = addons.find((a) => a.id === selectedAddonId);
    if (!addon) return;

    applyAddonMutation.mutate({
      itinerary: currentItinerary,
      addon,
      numberOfTravelers,
    });
  };

  const handleSaveDraft = async () => {
    if (!currentItinerary) return;
    
    // Sync dayPlans activities back to the itinerary cities
    const syncedCities = currentItinerary.cities.map(city => {
      const cityActivities: string[] = [];
      dayPlans.forEach(day => {
        if (day.city.order === city.order) {
          cityActivities.push(...day.activities);
        }
      });
      return { ...city, activities: cityActivities.length > 0 ? cityActivities : city.activities };
    });
    
    const syncedItinerary = { ...currentItinerary, cities: syncedCities };
    
    try {
      const travelSeason = ((quizData as Record<string, unknown>)?.travelSeason as string) || "summer";
      
      if (currentDraftId) {
        // Update existing draft
        await apiRequest("PATCH", `/api/trips/${currentDraftId}`, {
          title: currentItinerary.title,
          numberOfTravelers,
          tripDuration: currentItinerary.totalNights,
          draftItineraryData: syncedItinerary,
          draftQuizData: { ...(quizData ?? {}), tripPace: tripPace },
        });
        
        // Delete existing destinations and recreate
        const existingDestinations = await fetch(`/api/destinations/trip/${currentDraftId}`).then(r => r.json());
        for (const dest of existingDestinations) {
          await apiRequest("DELETE", `/api/destinations/${dest.id}`);
        }
        
        // Create new destinations
        for (let i = 0; i < syncedCities.length; i++) {
          const city = syncedCities[i];
          await apiRequest("POST", "/api/destinations", {
            tripId: currentDraftId,
            cityName: city.cityName,
            countryName: city.countryName,
            numberOfNights: city.stayLengthNights,
            imageUrl: "",
            order: i,
            arrivalAirport: city.arrivalAirport,
            departureAirport: city.departureAirport,
            activities: city.activities || [],
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
        
        toast({
          title: "Draft updated",
          description: "Your changes have been saved.",
        });
      } else {
        // Create new draft trip
        const draftPayload = {
          title: currentItinerary.title,
          travelers: numberOfTravelers > 1 ? "family_friends" : "just_me",
          numberOfTravelers,
          travelSeason,
          tripDuration: currentItinerary.totalNights,
          status: "draft" as const,
          draftItineraryData: syncedItinerary,
          draftQuizData: { ...(quizData ?? {}), tripPace: tripPace },
        };
        
        const newDraft = await saveDraftMutation.mutateAsync(draftPayload);
        
        // Create destinations for the draft trip
        for (let i = 0; i < syncedCities.length; i++) {
          const city = syncedCities[i];
          await apiRequest("POST", "/api/destinations", {
            tripId: newDraft.id,
            cityName: city.cityName,
            countryName: city.countryName,
            numberOfNights: city.stayLengthNights,
            imageUrl: "",
            order: i,
            arrivalAirport: city.arrivalAirport,
            departureAirport: city.departureAirport,
            activities: city.activities || [],
          });
        }
        
        toast({
          title: "Draft saved",
          description: "You can continue refining this itinerary later from My Trips.",
        });
      }
      
      // Navigate to trips list
      setLocation("/trips");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast({
        title: "Failed to save draft",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleFinalize = async () => {
    if (!currentItinerary) return;
    
    // Sync dayPlans activities back to the itinerary cities
    const syncedCities = currentItinerary.cities.map(city => {
      const cityActivities: string[] = [];
      dayPlans.forEach(day => {
        if (day.city.order === city.order) {
          cityActivities.push(...day.activities);
        }
      });
      return { ...city, activities: cityActivities.length > 0 ? cityActivities : city.activities };
    });
    
    try {
      // Get travel season from quiz data or default
      const travelSeason = ((quizData as Record<string, unknown>)?.travelSeason as string) || "summer";
      
      let tripId: string;
      
      if (currentDraftId) {
        // Convert draft to active trip
        await apiRequest("PATCH", `/api/trips/${currentDraftId}`, {
          title: currentItinerary.title,
          numberOfTravelers,
          tripDuration: currentItinerary.totalNights,
          status: "active",
          draftItineraryData: null,
          draftQuizData: null,
        });
        
        // Delete existing destinations and recreate
        const existingDestinations = await fetch(`/api/destinations/trip/${currentDraftId}`).then(r => r.json());
        for (const dest of existingDestinations) {
          await apiRequest("DELETE", `/api/destinations/${dest.id}`);
        }
        
        // Create new destinations
        for (let i = 0; i < syncedCities.length; i++) {
          const city = syncedCities[i];
          await apiRequest("POST", "/api/destinations", {
            tripId: currentDraftId,
            cityName: city.cityName,
            countryName: city.countryName,
            numberOfNights: city.stayLengthNights,
            imageUrl: "",
            order: i,
            arrivalAirport: city.arrivalAirport,
            departureAirport: city.departureAirport,
            activities: city.activities || [],
          });
        }
        
        tripId = currentDraftId;
        queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      } else {
        // Create new trip in database
        const tripPayload: InsertTrip = {
          title: currentItinerary.title,
          travelers: numberOfTravelers > 1 ? "family_friends" : "just_me",
          numberOfTravelers,
          travelSeason,
          tripDuration: currentItinerary.totalNights,
        };
        
        const newTrip = await createTripMutation.mutateAsync(tripPayload);
        tripId = newTrip.id;
        
        // Create destinations for the trip
        for (let i = 0; i < syncedCities.length; i++) {
          const city = syncedCities[i];
          await apiRequest("POST", "/api/destinations", {
            tripId: newTrip.id,
            cityName: city.cityName,
            countryName: city.countryName,
            numberOfNights: city.stayLengthNights,
            imageUrl: "",
            order: i,
            arrivalAirport: city.arrivalAirport,
            departureAirport: city.departureAirport,
            activities: city.activities || [],
          });
        }
      }
      
      // Store synced itinerary in session for step 2 to use
      const syncedItinerary = { ...currentItinerary, cities: syncedCities };
      sessionStorage.setItem("selectedItinerary", JSON.stringify(syncedItinerary));
      sessionStorage.setItem("quizNumberOfTravelers", String(numberOfTravelers));
      sessionStorage.setItem("tripSource", "quiz");
      
      toast({
        title: "Itinerary saved",
        description: "Your trip has been created. Now let's plan your budget!",
      });
      
      // Navigate to step 2 (Save & Book) with the trip
      setLocation(`/trip/${tripId}`);
    } catch (error) {
      console.error("Failed to save itinerary:", error);
      toast({
        title: "Failed to save itinerary",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (!currentItinerary) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <ProgressStepper currentStep={1} completedSteps={[]} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const totalNightsMatch = desiredNights === currentItinerary.totalNights;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <ProgressStepper currentStep={1} completedSteps={[]} />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customize Your Itinerary</h1>
          <p className="text-muted-foreground">
            Adjust your trip duration, remove cities, or add extensions before finalizing
          </p>
        </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            {/* Editable Title */}
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-xl font-semibold"
                  placeholder="Trip title"
                  autoFocus
                  data-testid="input-edit-title"
                />
                <Button size="icon" onClick={handleUpdateTitle} data-testid="button-save-title">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingTitle(false)} data-testid="button-cancel-title">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <CardTitle 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => {
                  setTempTitle(currentItinerary.title);
                  setEditingTitle(true);
                }}
                data-testid="text-trip-title"
              >
                {currentItinerary.title}
                <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
              </CardTitle>
            )}

            {/* Editable Tagline */}
            {editingTagline ? (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={tempTagline}
                  onChange={(e) => setTempTagline(e.target.value)}
                  className="text-sm"
                  placeholder="Trip description"
                  data-testid="input-edit-tagline"
                />
                <Button size="icon" onClick={handleUpdateTagline} data-testid="button-save-tagline">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingTagline(false)} data-testid="button-cancel-tagline">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <CardDescription 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => {
                  setTempTagline(currentItinerary.vibeTagline);
                  setEditingTagline(true);
                }}
                data-testid="text-trip-tagline"
              >
                {currentItinerary.vibeTagline}
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Nights:</span>{" "}
                <span className="font-semibold">{currentItinerary.totalNights}</span>
              </div>
              
              {/* Editable Travelers */}
              <div>
                <span className="text-muted-foreground">Travelers:</span>{" "}
                {editingTravelers ? (
                  <span className="inline-flex items-center gap-1">
                    <Input
                      type="number"
                      value={tempTravelers}
                      onChange={(e) => setTempTravelers(parseInt(e.target.value) || 1)}
                      className="w-16 h-7 text-sm"
                      min={1}
                      max={20}
                      data-testid="input-edit-travelers"
                    />
                    <Button size="icon" className="h-6 w-6" onClick={handleUpdateTravelers} data-testid="button-save-travelers">
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingTravelers(false)} data-testid="button-cancel-travelers">
                      <X className="w-3 h-3" />
                    </Button>
                  </span>
                ) : (
                  <span 
                    className="font-semibold cursor-pointer hover:text-primary inline-flex items-center gap-1 group"
                    onClick={() => {
                      setTempTravelers(numberOfTravelers);
                      setEditingTravelers(true);
                    }}
                    data-testid="text-travelers"
                  >
                    {numberOfTravelers}
                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </span>
                )}
              </div>
              
              <div>
                <span className="text-muted-foreground">Cost Range:</span>{" "}
                <span className="font-semibold">
                  ${currentItinerary.totalCost.min.toLocaleString()} - $
                  {currentItinerary.totalCost.max.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Best Time:</span>{" "}
                <span className="font-semibold">{currentItinerary.bestTimeToVisit}</span>
              </div>
            </div>

            {/* Cities Overview - Now Editable */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Destinations ({currentItinerary.cities.length} cities)
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingCity(true)}
                  disabled={addingCity}
                  data-testid="button-add-city"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add City
                </Button>
              </div>

              {/* Add New City Form */}
              {addingCity && (
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <h4 className="font-medium text-sm">Add New Destination</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="City name"
                      value={newCity.cityName}
                      onChange={(e) => setNewCity({ ...newCity, cityName: e.target.value })}
                      data-testid="input-new-city-name"
                    />
                    <Input
                      placeholder="Country"
                      value={newCity.countryName}
                      onChange={(e) => setNewCity({ ...newCity, countryName: e.target.value })}
                      data-testid="input-new-city-country"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Nights"
                        value={newCity.nights}
                        onChange={(e) => setNewCity({ ...newCity, nights: parseInt(e.target.value) || 1 })}
                        min={1}
                        max={14}
                        className="w-20"
                        data-testid="input-new-city-nights"
                      />
                      <span className="text-sm text-muted-foreground">nights</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddNewCity} data-testid="button-confirm-add-city">
                      <Check className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setAddingCity(false);
                      setNewCity({ cityName: "", countryName: "", nights: 2 });
                    }} data-testid="button-cancel-add-city">
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* City Chips - Now Editable */}
              <div className="space-y-2">
                {currentItinerary.cities.map((city) => (
                  <div key={city.order}>
                    {editingCity === city.order ? (
                      <div className="p-3 rounded-lg border bg-muted/30 space-y-2" data-testid={`city-edit-form-${city.order}`}>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="City name"
                            value={tempCity.cityName}
                            onChange={(e) => setTempCity({ ...tempCity, cityName: e.target.value })}
                            data-testid={`input-city-name-${city.order}`}
                          />
                          <Input
                            placeholder="Country"
                            value={tempCity.countryName}
                            onChange={(e) => setTempCity({ ...tempCity, countryName: e.target.value })}
                            data-testid={`input-city-country-${city.order}`}
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={tempCity.nights}
                              onChange={(e) => setTempCity({ ...tempCity, nights: parseInt(e.target.value) || 1 })}
                              min={1}
                              max={14}
                              className="w-20"
                              data-testid={`input-city-nights-${city.order}`}
                            />
                            <span className="text-sm text-muted-foreground">nights</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateCity(city.order)} data-testid={`button-save-city-${city.order}`}>
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingCity(null)} data-testid={`button-cancel-city-${city.order}`}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 hover-elevate"
                        data-testid={`city-chip-${city.order}`}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span 
                          className="font-medium text-sm cursor-pointer hover:text-primary flex items-center gap-1 group"
                          onClick={() => {
                            setTempCity({
                              cityName: city.cityName,
                              countryName: city.countryName,
                              nights: city.stayLengthNights,
                            });
                            setEditingCity(city.order);
                          }}
                          data-testid={`text-city-${city.order}`}
                        >
                          {city.cityName}, {city.countryName}
                          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {city.stayLengthNights} night{city.stayLengthNights !== 1 ? "s" : ""}
                        </Badge>
                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setTempCity({
                                cityName: city.cityName,
                                countryName: city.countryName,
                                nights: city.stayLengthNights,
                              });
                              setEditingCity(city.order);
                            }}
                            data-testid={`button-edit-city-${city.order}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCity(city.order)}
                            disabled={currentItinerary.cities.length <= 1 || isBusy}
                            data-testid={`button-delete-city-${city.order}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Personality - Adjustable Pace Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Trip Pace
            </CardTitle>
            <CardDescription>
              Adjust how many activities you want each day
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">Daily Pace</span>
              <div className="flex gap-2">
                <Button
                  variant={tripPace === "slow" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (tripPace !== "slow") {
                      setSelectedPace("slow");
                      setRevealedDays(new Set());
                      setAiGenerationComplete(false);
                      aiPlanMutation.mutate("slow");
                    }
                  }}
                  disabled={aiPlanMutation.isPending}
                  className="flex-1"
                  data-testid="button-pace-slow"
                >
                  <span className="flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5" />
                    Slow
                  </span>
                </Button>
                <Button
                  variant={tripPace === "moderate" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (tripPace !== "moderate") {
                      setSelectedPace("moderate");
                      setRevealedDays(new Set());
                      setAiGenerationComplete(false);
                      aiPlanMutation.mutate("moderate");
                    }
                  }}
                  disabled={aiPlanMutation.isPending}
                  className="flex-1"
                  data-testid="button-pace-moderate"
                >
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    Moderate
                  </span>
                </Button>
                <Button
                  variant={tripPace === "fast" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (tripPace !== "fast") {
                      setSelectedPace("fast");
                      setRevealedDays(new Set());
                      setAiGenerationComplete(false);
                      aiPlanMutation.mutate("fast");
                    }
                  }}
                  disabled={aiPlanMutation.isPending}
                  className="flex-1"
                  data-testid="button-pace-fast"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Fast
                  </span>
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              {tripPace === "slow" && (
                <p>2-3 activities per day with extended rest periods. Perfect for relaxation and deep exploration.</p>
              )}
              {tripPace === "moderate" && (
                <p>3-4 activities per day with balanced rest time. A comfortable mix of sightseeing and downtime.</p>
              )}
              {tripPace === "fast" && (
                <p>5-6 activities per day to maximize your time. Ideal for those who want to see and do everything.</p>
              )}
            </div>
            {aiPlanMutation.isPending && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Regenerating activities for new pace...
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Itinerary Assistant */}
        {currentItinerary && (
          <ItineraryAssistant
            itinerary={currentItinerary}
            numberOfTravelers={numberOfTravelers}
            tripType={tripType}
            quizPreferences={{
              tripGoal: quizData?.tripGoal,
              placeType: quizData?.placeType,
              dayPace: quizData?.dayPace,
              spendingPriority: quizData?.spendingPriority,
              // Extended properties from GettingStartedData flow - use type-safe access
              travelersType: (quizData as Record<string, unknown>)?.travelersType as string | undefined,
              kidsAges: (quizData as Record<string, unknown>)?.kidsAges as string[] | undefined,
              accommodationType: (quizData as Record<string, unknown>)?.accommodationType as string | undefined,
              mustHave: (quizData as Record<string, unknown>)?.mustHave as string | undefined,
            }}
            currentDayPlans={dayPlans.map(day => ({
              dayNumber: day.dayNumber,
              cityName: day.city.cityName,
              countryName: day.city.countryName,
              isArrivalDay: day.isArrivalDay,
              isDepartureDay: day.isDepartureDay,
              activities: day.activities,
            }))}
            onApplyChanges={handleApplyAssistantChanges}
          />
        )}

        {/* Pebbles AI Generation Status */}
        {(aiPlanMutation.isPending || (currentLoadingDay !== null)) && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl">🐧</span>
                  </div>
                  <Loader2 className="w-4 h-4 animate-spin text-primary absolute -bottom-1 -right-1" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-primary">
                    {aiPlanMutation.isPending 
                      ? "Pebbles is planning your adventure..." 
                      : `Building Day ${currentLoadingDay}...`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {aiPlanMutation.isPending 
                      ? "Creating personalized activities based on your preferences"
                      : pebblesMessage || "Preparing your activities..."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Day-by-Day Itinerary Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Day-by-Day Itinerary
            </CardTitle>
            <CardDescription>
              Your complete trip broken down by day with recommended activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              let currentCityOrder = 0;

              return dayPlans.map((day, index) => {
                const isNewCity = day.city.order !== currentCityOrder;
                currentCityOrder = day.city.order;

                return (
                  <div key={day.dayNumber}>
                    {isNewCity && index > 0 && (
                      <div className="flex items-center gap-2 my-4 text-muted-foreground">
                        <Plane className="w-4 h-4" />
                        <Separator className="flex-1" />
                        <span className="text-xs uppercase tracking-wide">
                          Travel to {day.city.cityName}
                        </span>
                        <Separator className="flex-1" />
                        <Plane className="w-4 h-4 rotate-90" />
                      </div>
                    )}
                    
                    <div 
                      className="p-4 rounded-lg border bg-card"
                      data-testid={`day-${day.dayNumber}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            {day.dayNumber}
                          </div>
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              {day.city.cityName}, {day.city.countryName}
                              {day.dayTitle && (
                                <span className="text-muted-foreground font-normal">
                                  - {day.dayTitle}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>
                                Day {day.dayInCity} of {day.totalDaysInCity} in this city
                              </span>
                              {day.isArrivalDay && day.city.order === 1 && (
                                <Badge variant="outline" className="text-xs">
                                  <Sunrise className="w-3 h-3 mr-1" />
                                  Trip Start
                                </Badge>
                              )}
                              {day.isArrivalDay && day.city.order > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  <Plane className="w-3 h-3 mr-1" />
                                  Arrival
                                </Badge>
                              )}
                              {day.isDepartureDay && (
                                <Badge variant="outline" className="text-xs">
                                  <Sunset className="w-3 h-3 mr-1" />
                                  Departure
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Activities for this day - Progressive loading */}
                      <div className="ml-13 space-y-2">
                        {/* Show loading state if day is not yet revealed and AI is generating */}
                        {(aiPlanMutation.isPending || !revealedDays.has(day.dayNumber)) && !aiGenerationComplete ? (
                          <div className="p-4 rounded-md bg-muted/30 border border-dashed">
                            <div className="flex items-center gap-3">
                              {currentLoadingDay === day.dayNumber ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                  <div>
                                    <p className="text-sm font-medium">Building activities for Day {day.dayNumber}...</p>
                                    <p className="text-xs text-muted-foreground">{pebblesMessage || "Almost there..."}</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                                  <p className="text-sm text-muted-foreground">Waiting to plan Day {day.dayNumber}...</p>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                        <>
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <h5 className="text-sm font-medium text-muted-foreground">Activities:</h5>
                            <Badge variant="secondary" className="text-xs">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {day.dailyCostEstimate !== undefined && day.dailyCostEstimate > 0 
                                ? `Est. $${day.dailyCostEstimate}/person`
                                : "Cost TBD"
                              }
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setNewActivityDay(day.dayNumber);
                                setNewActivityText("");
                              }}
                              data-testid={`button-add-activity-day-${day.dayNumber}`}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Add Activity Form - Only shows for this specific day */}
                        {newActivityDay === day.dayNumber && (
                          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 mb-2">
                            <Input
                              placeholder="Enter new activity..."
                              value={newActivityText}
                              onChange={(e) => setNewActivityText(e.target.value)}
                              className="flex-1 h-8 text-sm"
                              autoFocus
                              data-testid={`input-new-activity-day-${day.dayNumber}`}
                            />
                            <Button
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleAddActivity(day.dayNumber)}
                              disabled={!newActivityText.trim()}
                              data-testid={`button-save-new-activity-day-${day.dayNumber}`}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                setNewActivityDay(null);
                                setNewActivityText("");
                              }}
                              data-testid={`button-cancel-new-activity-day-${day.dayNumber}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                        <div className="grid gap-2">
                          {/* Use structured activities if available, otherwise fall back to string activities */}
                          {day.structuredActivities && day.structuredActivities.length > 0 ? (
                            day.structuredActivities.map((structuredAct, actIndex) => {
                              const isExpanded = expandedAlternates.has(structuredAct.id);
                              
                              return (
                                <div key={structuredAct.id} className="space-y-1">
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <div
                                        className={`flex items-start gap-3 p-3 rounded-md group hover-elevate cursor-pointer ${
                                          structuredAct.isTravel 
                                            ? 'bg-muted/20 border-l-2 border-muted-foreground/30' 
                                            : 'bg-muted/30'
                                        }`}
                                        data-testid={`day-${day.dayNumber}-structured-activity-${actIndex}`}
                                      >
                                        {getStructuredActivityIcon(structuredAct)}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-muted-foreground font-medium">
                                              {structuredAct.startTime} - {structuredAct.endTime}
                                            </span>
                                            {structuredAct.costEstimate !== undefined && structuredAct.costEstimate > 0 && !structuredAct.isTravel && (
                                              <Badge variant="outline" className="text-xs py-0 h-5">
                                                ${structuredAct.costEstimate}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className={`text-sm ${structuredAct.isTravel ? 'text-muted-foreground italic' : ''}`}>
                                            {structuredAct.title}
                                          </p>
                                          {structuredAct.location && !structuredAct.isTravel && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                              <MapPin className="w-3 h-3" />
                                              {structuredAct.location}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {structuredAct.externalLink && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(structuredAct.externalLink, '_blank');
                                              }}
                                              data-testid={`button-external-link-${day.dayNumber}-${actIndex}`}
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteActivity(day.dayNumber, actIndex);
                                            }}
                                            data-testid={`button-delete-structured-activity-${day.dayNumber}-${actIndex}`}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-80" align="start">
                                      <div className="space-y-2">
                                        <h4 className="font-semibold">{structuredAct.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          {structuredAct.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {structuredAct.startTime} - {structuredAct.endTime}
                                          </span>
                                          {structuredAct.costEstimate !== undefined && (
                                            <span className="flex items-center gap-1">
                                              <DollarSign className="w-3 h-3" />
                                              {structuredAct.costEstimate === 0 ? 'Free' : `$${structuredAct.costEstimate}`}
                                            </span>
                                          )}
                                        </div>
                                        {structuredAct.location && (
                                          <p className="text-xs flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-muted-foreground" />
                                            {structuredAct.location}
                                          </p>
                                        )}
                                        {structuredAct.externalLink && (
                                          <a 
                                            href={structuredAct.externalLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            Visit Website
                                          </a>
                                        )}
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                  
                                  {/* Alternate Activities */}
                                  {structuredAct.alternates && structuredAct.alternates.length > 0 && !structuredAct.isTravel && (
                                    <Collapsible 
                                      open={isExpanded}
                                      onOpenChange={(open) => {
                                        setExpandedAlternates(prev => {
                                          const next = new Set(prev);
                                          if (open) {
                                            next.add(structuredAct.id);
                                          } else {
                                            next.delete(structuredAct.id);
                                          }
                                          return next;
                                        });
                                      }}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 text-xs ml-7 text-muted-foreground"
                                          data-testid={`button-alternates-${day.dayNumber}-${actIndex}`}
                                        >
                                          <RefreshCw className="w-3 h-3 mr-1" />
                                          Alternate Activities ({structuredAct.alternates.length})
                                          {isExpanded ? (
                                            <ChevronUp className="w-3 h-3 ml-1" />
                                          ) : (
                                            <ChevronDown className="w-3 h-3 ml-1" />
                                          )}
                                        </Button>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent className="ml-7 mt-1 space-y-1">
                                        {structuredAct.alternates.map((alt) => (
                                          <HoverCard key={alt.id}>
                                            <HoverCardTrigger asChild>
                                              <div 
                                                className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-dashed border-muted-foreground/20 hover-elevate cursor-pointer"
                                                data-testid={`alternate-${alt.id}`}
                                              >
                                                <RefreshCw className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-sm flex-1">{alt.title}</span>
                                                {alt.costEstimate !== undefined && (
                                                  <Badge variant="outline" className="text-xs py-0 h-5">
                                                    {alt.costEstimate === 0 ? 'Free' : `$${alt.costEstimate}`}
                                                  </Badge>
                                                )}
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-6 text-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSwapWithAlternate(day.dayNumber, actIndex, alt);
                                                  }}
                                                  data-testid={`button-use-alternate-${alt.id}`}
                                                >
                                                  <Check className="w-3 h-3 mr-1" />
                                                  Use This
                                                </Button>
                                                {alt.externalLink && (
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      window.open(alt.externalLink, '_blank');
                                                    }}
                                                    data-testid={`button-external-link-${alt.id}`}
                                                  >
                                                    <ExternalLink className="w-3 h-3" />
                                                  </Button>
                                                )}
                                              </div>
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-72" align="start">
                                              <div className="space-y-2">
                                                <h4 className="font-semibold text-sm">{alt.title}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                  {alt.description}
                                                </p>
                                                {alt.costEstimate !== undefined && (
                                                  <p className="text-xs flex items-center gap-1">
                                                    <DollarSign className="w-3 h-3" />
                                                    {alt.costEstimate === 0 ? 'Free' : `$${alt.costEstimate} per person`}
                                                  </p>
                                                )}
                                                {alt.externalLink && (
                                                  <a 
                                                    href={alt.externalLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                                                  >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Visit Website
                                                  </a>
                                                )}
                                                <Button
                                                  variant="default"
                                                  size="sm"
                                                  className="w-full mt-2"
                                                  onClick={() => handleSwapWithAlternate(day.dayNumber, actIndex, alt)}
                                                  data-testid={`button-use-alternate-hover-${alt.id}`}
                                                >
                                                  <Check className="w-3 h-3 mr-1" />
                                                  Use This Instead
                                                </Button>
                                              </div>
                                            </HoverCardContent>
                                          </HoverCard>
                                        ))}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-xs w-full mt-2 border border-dashed border-muted-foreground/30"
                                          onClick={() => handleGenerateAlternatives(day.dayNumber, actIndex, structuredAct, day.city)}
                                          disabled={generatingAlternativesFor?.dayNumber === day.dayNumber && generatingAlternativesFor?.activityIndex === actIndex}
                                          data-testid={`button-generate-alternatives-${day.dayNumber}-${actIndex}`}
                                        >
                                          {generatingAlternativesFor?.dayNumber === day.dayNumber && generatingAlternativesFor?.activityIndex === actIndex ? (
                                            <>
                                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="w-3 h-3 mr-1" />
                                              Generate New Options
                                            </>
                                          )}
                                        </Button>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )}
                                  
                                  {/* Generate alternatives button for activities without alternates */}
                                  {(!structuredAct.alternates || structuredAct.alternates.length === 0) && !structuredAct.isTravel && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs ml-7 text-muted-foreground"
                                      onClick={() => handleGenerateAlternatives(day.dayNumber, actIndex, structuredAct, day.city)}
                                      disabled={generatingAlternativesFor?.dayNumber === day.dayNumber && generatingAlternativesFor?.activityIndex === actIndex}
                                      data-testid={`button-generate-alternatives-empty-${day.dayNumber}-${actIndex}`}
                                    >
                                      {generatingAlternativesFor?.dayNumber === day.dayNumber && generatingAlternativesFor?.activityIndex === actIndex ? (
                                        <>
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                          Generating alternatives...
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3 h-3 mr-1" />
                                          Generate Alternatives
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              );
                            })
                          ) : day.activities.length > 0 ? (
                            day.activities.map((activity, actIndex) => {
                              const isEditing = editingActivity?.dayNumber === day.dayNumber && 
                                               editingActivity?.activityIndex === actIndex;

                              return isEditing ? (
                                <div
                                  key={actIndex}
                                  className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                                  data-testid={`day-${day.dayNumber}-activity-edit-${actIndex}`}
                                >
                                  <Input
                                    value={tempActivity}
                                    onChange={(e) => setTempActivity(e.target.value)}
                                    className="flex-1 h-8 text-sm"
                                    autoFocus
                                    data-testid={`input-edit-activity-${day.dayNumber}-${actIndex}`}
                                  />
                                  <Button
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleUpdateActivity(day.dayNumber, actIndex)}
                                    data-testid={`button-save-activity-${day.dayNumber}-${actIndex}`}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => setEditingActivity(null)}
                                    data-testid={`button-cancel-activity-${day.dayNumber}-${actIndex}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  key={actIndex}
                                  className="flex items-start gap-3 p-3 rounded-md bg-muted/30 group hover-elevate"
                                  data-testid={`day-${day.dayNumber}-activity-${actIndex}`}
                                >
                                  {getActivityIcon(activity)}
                                  <span 
                                    className="text-sm flex-1 cursor-pointer"
                                    onClick={() => {
                                      setTempActivity(activity);
                                      setEditingActivity({
                                        dayNumber: day.dayNumber,
                                        activityIndex: actIndex,
                                      });
                                    }}
                                    data-testid={`text-activity-${day.dayNumber}-${actIndex}`}
                                  >
                                    {activity}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        setTempActivity(activity);
                                        setEditingActivity({
                                          dayNumber: day.dayNumber,
                                          activityIndex: actIndex,
                                        });
                                      }}
                                      data-testid={`button-edit-activity-${day.dayNumber}-${actIndex}`}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteActivity(day.dayNumber, actIndex)}
                                      data-testid={`button-delete-activity-${day.dayNumber}-${actIndex}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-sm text-muted-foreground italic p-3 rounded-md bg-muted/30">
                              Free time to explore at your own pace
                            </div>
                          )}
                        </div>
                        </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adjust Trip Duration</CardTitle>
            <CardDescription>
              Change the total length of your trip. We'll regenerate the itinerary to match.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Total Nights</label>
                <span className="text-sm font-semibold">{desiredNights}</span>
              </div>
              <Slider
                value={[desiredNights]}
                onValueChange={(values) => setDesiredNights(values[0])}
                min={1}
                max={30}
                step={1}
                disabled={isBusy}
                data-testid="slider-duration"
              />
            </div>
            {!totalNightsMatch && (
              <p className="text-sm text-amber-600">
                Current itinerary: {currentItinerary.totalNights} nights. Click regenerate to
                adjust.
              </p>
            )}
            <Button
              onClick={handleAdjustDuration}
              disabled={isBusy || totalNightsMatch}
              data-testid="button-adjust-duration"
            >
              {adjustDurationMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Regenerate Itinerary
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Add-On Options
            </CardTitle>
            <CardDescription>
              Extend your trip with AI-recommended additions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {addons.length === 0 ? (
              <Button
                onClick={handleGenerateAddons}
                disabled={isBusy}
                data-testid="button-generate-addons"
              >
                {fetchAddonsMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Generate Add-Ons
              </Button>
            ) : (
              <>
                <div className="grid gap-4">
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedAddonId === addon.id
                          ? "border-primary bg-primary/5"
                          : "hover-elevate"
                      }`}
                      onClick={() => setSelectedAddonId(addon.id)}
                      data-testid={`addon-${addon.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{addon.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {addon.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              +{addon.deltaNights} night{addon.deltaNights !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="w-3 h-3" />
                              {addon.deltaCost.min.toLocaleString()} - $
                              {addon.deltaCost.max.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Added:</strong> {addon.suggestedAddition}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApplyAddon}
                    disabled={!selectedAddonId || isBusy}
                    data-testid="button-apply-addon"
                  >
                    {applyAddonMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Apply Selected Add-On
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddons([]);
                      setSelectedAddonId(null);
                    }}
                    disabled={isBusy}
                    data-testid="button-clear-addons"
                  >
                    Clear
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/quiz/results")}
            disabled={isBusy}
            data-testid="button-back"
          >
            Back to Results
          </Button>
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isBusy}
            data-testid="button-save-draft"
          >
            {saveDraftMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Draft...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
          <Button onClick={handleFinalize} disabled={isBusy} data-testid="button-finalize">
            {createTripMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Finalize Itinerary"
            )}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
