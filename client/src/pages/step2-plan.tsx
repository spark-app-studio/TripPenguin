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
import { BookingButton, BookingStatusBadge, SavingsProgressIndicator } from "@/components/BookingButton";
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
import { useTripBudget, CategoryCosts } from "@/hooks/useTripBudget";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, DollarSign, TrendingUp, Calendar as CalendarIcon, Sparkles, Loader2, MapPin, Clock, Users, ExternalLink, PiggyBank, Edit, Link, HelpCircle, Wallet, Plane, CheckCircle2, Lock, CreditCard, Gift, Star, RefreshCw, AlertTriangle, Utensils, Briefcase, Package, Shirt, Zap, Droplets, Compass, FileText, ShoppingCart, Check, X, BookOpen, Film, Tv, Map, Play } from "lucide-react";

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

// Transportation option interface
interface TransportOption {
  id: string;
  type: "metro" | "train" | "bus" | "rideshare" | "taxi" | "shuttle";
  name: string;
  cost: number;
  description: string;
  duration: string;
  url: string;
}

// Transportation segment interface
interface TransportSegment {
  id: string;
  segmentType: "airport-arrival" | "within-city" | "city-to-city" | "airport-departure";
  fromLocation: string;
  toLocation: string;
  options: TransportOption[];
}

// Generate mock transport options for different segment types
function generateTransportOptions(
  segmentType: "airport-arrival" | "within-city" | "city-to-city" | "airport-departure",
  cityName: string,
  toCity?: string,
  numberOfNights?: number
): TransportOption[] {
  const cityHash = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isInternational = !["New York", "Los Angeles", "Chicago", "Miami", "Seattle", "Denver", "Austin", "Boston", "San Francisco", "Las Vegas", "Orlando", "Phoenix", "Atlanta", "Dallas", "Houston"].some(
    city => cityName.toLowerCase().includes(city.toLowerCase())
  );

  const citySlug = cityName.toLowerCase().replace(/\s/g, '-');
  
  if (segmentType === "airport-arrival" || segmentType === "airport-departure") {
    const baseShuttleCost = isInternational ? 25 : 18;
    const baseRideshareCost = isInternational ? 35 : 25;
    const baseTaxiCost = isInternational ? 55 : 40;
    
    return [
      {
        id: `${citySlug}-${segmentType}-shuttle`,
        type: "shuttle",
        name: `${cityName} Airport Shuttle`,
        cost: Math.round((baseShuttleCost + (cityHash % 15)) / 5) * 5,
        description: "Shared shuttle service with multiple stops. Book online for best rates.",
        duration: "45-60 min",
        url: `https://example.com/shuttle/${citySlug}-airport`
      },
      {
        id: `${citySlug}-${segmentType}-rideshare`,
        type: "rideshare",
        name: "Uber/Lyft",
        cost: Math.round((baseRideshareCost + (cityHash % 20)) / 5) * 5,
        description: "On-demand rideshare. Prices vary by time of day and demand.",
        duration: "25-40 min",
        url: "https://example.com/rideshare"
      },
      {
        id: `${citySlug}-${segmentType}-taxi`,
        type: "taxi",
        name: `${cityName} Taxi`,
        cost: Math.round((baseTaxiCost + (cityHash % 25)) / 5) * 5,
        description: "Traditional taxi service. Fixed rates often available from airport.",
        duration: "25-40 min",
        url: `https://example.com/taxi/${citySlug}`
      }
    ];
  }
  
  if (segmentType === "within-city") {
    const nights = numberOfNights || 3;
    const baseMetroCost = isInternational ? 8 : 5;
    const baseBusCost = isInternational ? 6 : 4;
    const baseRideshareBudget = isInternational ? 15 : 12;
    
    return [
      {
        id: `${citySlug}-metro-pass`,
        type: "metro",
        name: `${cityName} Metro/Subway Pass`,
        cost: Math.round((baseMetroCost * nights + (cityHash % 10)) / 5) * 5,
        description: `${nights}-day unlimited metro pass. Covers all subway and light rail lines.`,
        duration: "Unlimited rides",
        url: `https://example.com/transit/${citySlug}-metro`
      },
      {
        id: `${citySlug}-bus-pass`,
        type: "bus",
        name: `${cityName} Bus Pass`,
        cost: Math.round((baseBusCost * nights + (cityHash % 8)) / 5) * 5,
        description: `${nights}-day unlimited bus pass. Extensive network coverage.`,
        duration: "Unlimited rides",
        url: `https://example.com/transit/${citySlug}-bus`
      },
      {
        id: `${citySlug}-rideshare-budget`,
        type: "rideshare",
        name: "Rideshare Budget",
        cost: Math.round((baseRideshareBudget * nights + (cityHash % 20)) / 5) * 5,
        description: `Estimated budget for ${nights} days of occasional Uber/Lyft rides.`,
        duration: "As needed",
        url: "https://example.com/rideshare"
      }
    ];
  }
  
  if (segmentType === "city-to-city" && toCity) {
    const toCityHash = toCity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const combinedHash = cityHash + toCityHash;
    const toCitySlug = toCity.toLowerCase().replace(/\s/g, '-');
    
    const baseTrainCost = isInternational ? 80 : 50;
    const baseBusCost = isInternational ? 35 : 25;
    const baseFlightCost = isInternational ? 150 : 100;
    
    return [
      {
        id: `${citySlug}-to-${toCitySlug}-train`,
        type: "train",
        name: `Train: ${cityName} → ${toCity}`,
        cost: Math.round((baseTrainCost + (combinedHash % 60)) / 5) * 5,
        description: "High-speed or regional train. Scenic views and comfortable seating.",
        duration: `${2 + (combinedHash % 4)}h ${(combinedHash % 6) * 10}min`,
        url: `https://example.com/trains/${citySlug}-to-${toCitySlug}`
      },
      {
        id: `${citySlug}-to-${toCitySlug}-bus`,
        type: "bus",
        name: `Bus: ${cityName} → ${toCity}`,
        cost: Math.round((baseBusCost + (combinedHash % 30)) / 5) * 5,
        description: "Intercity coach bus. WiFi and power outlets available.",
        duration: `${3 + (combinedHash % 5)}h ${(combinedHash % 6) * 10}min`,
        url: `https://example.com/buses/${citySlug}-to-${toCitySlug}`
      },
      {
        id: `${citySlug}-to-${toCitySlug}-flight`,
        type: "shuttle",
        name: `Regional Flight: ${cityName} → ${toCity}`,
        cost: Math.round((baseFlightCost + (combinedHash % 100)) / 10) * 10,
        description: "Short domestic/regional flight. Fastest option for longer distances.",
        duration: `${1 + (combinedHash % 2)}h ${(combinedHash % 4) * 15}min`,
        url: `https://example.com/flights/${citySlug}-to-${toCitySlug}`
      }
    ];
  }
  
  return [];
}

// Generate all transport segments for the itinerary
function generateTransportSegments(destinations: { cityName: string; countryName: string; numberOfNights: number }[]): TransportSegment[] {
  if (!destinations || destinations.length === 0) return [];
  
  const segments: TransportSegment[] = [];
  
  // Airport arrival to first city
  const firstCity = destinations[0];
  segments.push({
    id: `arrival-${firstCity.cityName.toLowerCase().replace(/\s/g, '-')}`,
    segmentType: "airport-arrival",
    fromLocation: `${firstCity.cityName} Airport`,
    toLocation: firstCity.cityName,
    options: generateTransportOptions("airport-arrival", firstCity.cityName)
  });
  
  // For each destination
  destinations.forEach((dest, idx) => {
    // Within city transport
    segments.push({
      id: `within-${dest.cityName.toLowerCase().replace(/\s/g, '-')}`,
      segmentType: "within-city",
      fromLocation: dest.cityName,
      toLocation: dest.cityName,
      options: generateTransportOptions("within-city", dest.cityName, undefined, dest.numberOfNights)
    });
    
    // City to city transport (if not the last city)
    if (idx < destinations.length - 1) {
      const nextCity = destinations[idx + 1];
      segments.push({
        id: `${dest.cityName.toLowerCase().replace(/\s/g, '-')}-to-${nextCity.cityName.toLowerCase().replace(/\s/g, '-')}`,
        segmentType: "city-to-city",
        fromLocation: dest.cityName,
        toLocation: nextCity.cityName,
        options: generateTransportOptions("city-to-city", dest.cityName, nextCity.cityName)
      });
    }
  });
  
  // Airport departure from last city
  const lastCity = destinations[destinations.length - 1];
  segments.push({
    id: `departure-${lastCity.cityName.toLowerCase().replace(/\s/g, '-')}`,
    segmentType: "airport-departure",
    fromLocation: lastCity.cityName,
    toLocation: `${lastCity.cityName} Airport`,
    options: generateTransportOptions("airport-departure", lastCity.cityName)
  });
  
  return segments;
}

// Activity option interface
interface ActivityOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: string;
  type: "main-attraction" | "unique" | "food-experience" | "outdoor" | "cultural" | "relaxation";
  url: string;
}

// Day activities interface
interface DayActivities {
  dayNumber: number;
  cityName: string;
  activities: ActivityOption[];
}

// Activity pace type (from quiz)
type ActivityPace = "relaxed" | "balanced" | "packed";

// Generate mock activities for a city
function generateMockActivities(
  cityName: string, 
  countryName: string, 
  numberOfNights: number,
  pace: ActivityPace = "balanced"
): DayActivities[] {
  const cityHash = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const citySlug = cityName.toLowerCase().replace(/\s/g, '-');
  const isInternational = !["New York", "Los Angeles", "Chicago", "Miami", "Seattle", "Denver", "Austin", "Boston", "San Francisco", "Las Vegas", "Orlando", "Phoenix", "Atlanta", "Dallas", "Houston"].some(
    city => cityName.toLowerCase().includes(city.toLowerCase())
  );
  
  // Determine activities per day based on pace
  const activitiesPerDay = pace === "relaxed" ? 2 : pace === "balanced" ? 3 : 4;
  
  // City-specific main attractions
  const mainAttractions: Record<string, ActivityOption[]> = {
    default: [
      { id: `${citySlug}-main-1`, name: `${cityName} City Tour`, description: "Comprehensive guided tour covering major landmarks and hidden gems.", cost: isInternational ? 45 : 35, duration: "3 hours", type: "main-attraction", url: `https://example.com/tours/${citySlug}` },
      { id: `${citySlug}-main-2`, name: `${cityName} Museum`, description: "World-class museum with extensive collections and interactive exhibits.", cost: isInternational ? 25 : 20, duration: "2-3 hours", type: "main-attraction", url: `https://example.com/museum/${citySlug}` },
      { id: `${citySlug}-main-3`, name: `${cityName} Observation Deck`, description: "Panoramic views of the city skyline from the highest point.", cost: isInternational ? 35 : 25, duration: "1-2 hours", type: "main-attraction", url: `https://example.com/views/${citySlug}` },
    ]
  };
  
  // Unique/niche activities
  const uniqueActivities: ActivityOption[] = [
    { id: `${citySlug}-unique-1`, name: `Hidden ${cityName} Walking Tour`, description: "Discover secret spots and local favorites off the beaten path.", cost: isInternational ? 30 : 25, duration: "2.5 hours", type: "unique", url: `https://example.com/hidden/${citySlug}` },
    { id: `${citySlug}-unique-2`, name: "Local Artisan Workshop", description: "Hands-on experience with traditional local crafts and artisans.", cost: isInternational ? 55 : 45, duration: "2 hours", type: "unique", url: `https://example.com/artisan/${citySlug}` },
    { id: `${citySlug}-unique-3`, name: "Street Art & Graffiti Tour", description: "Explore vibrant urban art scenes with a local guide.", cost: isInternational ? 20 : 15, duration: "2 hours", type: "unique", url: `https://example.com/streetart/${citySlug}` },
  ];
  
  // Food experiences
  const foodExperiences: ActivityOption[] = [
    { id: `${citySlug}-food-1`, name: `${cityName} Food Tour`, description: "Sample local delicacies and learn about culinary traditions.", cost: isInternational ? 75 : 60, duration: "3 hours", type: "food-experience", url: `https://example.com/foodtour/${citySlug}` },
    { id: `${citySlug}-food-2`, name: "Cooking Class", description: "Learn to prepare authentic local dishes with expert chefs.", cost: isInternational ? 85 : 70, duration: "3 hours", type: "food-experience", url: `https://example.com/cooking/${citySlug}` },
    { id: `${citySlug}-food-3`, name: "Market & Tasting Experience", description: "Explore local markets and taste fresh, regional products.", cost: isInternational ? 40 : 30, duration: "2 hours", type: "food-experience", url: `https://example.com/market/${citySlug}` },
  ];
  
  // Outdoor activities
  const outdoorActivities: ActivityOption[] = [
    { id: `${citySlug}-outdoor-1`, name: `${cityName} Park & Gardens`, description: "Relax in beautiful green spaces and botanical gardens.", cost: isInternational ? 10 : 0, duration: "2 hours", type: "outdoor", url: `https://example.com/parks/${citySlug}` },
    { id: `${citySlug}-outdoor-2`, name: "Bike Tour", description: "Explore the city on two wheels with guided bike tour.", cost: isInternational ? 35 : 30, duration: "3 hours", type: "outdoor", url: `https://example.com/biketour/${citySlug}` },
    { id: `${citySlug}-outdoor-3`, name: "Waterfront Experience", description: "Enjoy scenic waterfront areas, boat rides, or beach time.", cost: isInternational ? 25 : 20, duration: "2-3 hours", type: "outdoor", url: `https://example.com/waterfront/${citySlug}` },
  ];
  
  // Cultural activities
  const culturalActivities: ActivityOption[] = [
    { id: `${citySlug}-cultural-1`, name: "Historical Walking Tour", description: "Deep dive into the city's rich history and heritage.", cost: isInternational ? 25 : 20, duration: "2.5 hours", type: "cultural", url: `https://example.com/history/${citySlug}` },
    { id: `${citySlug}-cultural-2`, name: "Local Performance Show", description: "Experience traditional music, dance, or theater performance.", cost: isInternational ? 50 : 40, duration: "2 hours", type: "cultural", url: `https://example.com/shows/${citySlug}` },
    { id: `${citySlug}-cultural-3`, name: "Art Gallery Visit", description: "Explore contemporary and classical art collections.", cost: isInternational ? 18 : 15, duration: "1.5 hours", type: "cultural", url: `https://example.com/gallery/${citySlug}` },
  ];
  
  // Relaxation activities
  const relaxationActivities: ActivityOption[] = [
    { id: `${citySlug}-relax-1`, name: "Spa & Wellness Experience", description: "Rejuvenate with local spa treatments and wellness rituals.", cost: isInternational ? 90 : 75, duration: "2-3 hours", type: "relaxation", url: `https://example.com/spa/${citySlug}` },
    { id: `${citySlug}-relax-2`, name: "Sunset Cruise", description: "Relaxing evening cruise with stunning sunset views.", cost: isInternational ? 55 : 45, duration: "2 hours", type: "relaxation", url: `https://example.com/cruise/${citySlug}` },
    { id: `${citySlug}-relax-3`, name: "Café & Neighborhood Stroll", description: "Leisurely exploration of charming neighborhoods and cafés.", cost: isInternational ? 15 : 10, duration: "2 hours", type: "relaxation", url: `https://example.com/stroll/${citySlug}` },
  ];
  
  // Combine all activities
  const allActivities = [
    ...(mainAttractions[cityName.toLowerCase()] || mainAttractions.default),
    ...uniqueActivities,
    ...foodExperiences,
    ...outdoorActivities,
    ...culturalActivities,
    ...relaxationActivities
  ];
  
  // Generate activities for each day
  const dayActivities: DayActivities[] = [];
  
  for (let day = 1; day <= numberOfNights; day++) {
    // Rotate through activities to give variety each day
    const startIndex = ((day - 1) * activitiesPerDay + cityHash) % allActivities.length;
    const dayOptions: ActivityOption[] = [];
    
    for (let i = 0; i < Math.min(activitiesPerDay + 2, allActivities.length); i++) {
      const activity = allActivities[(startIndex + i) % allActivities.length];
      // Create unique ID for this day's activity
      dayOptions.push({
        ...activity,
        id: `${activity.id}-day${day}`
      });
    }
    
    dayActivities.push({
      dayNumber: day,
      cityName,
      activities: dayOptions
    });
  }
  
  return dayActivities;
}

// Restaurant/Food option interface
interface FoodOption {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  estimatedCost: number; // per person
  type: "restaurant" | "food-tour" | "tasting" | "cooking-class" | "market" | "street-food";
  reservationRequired: boolean;
  reservationAdvance?: string; // e.g., "2 weeks in advance"
  url: string;
}

// Day food options interface
interface DayFoodOptions {
  dayNumber: number;
  cityName: string;
  options: FoodOption[];
}

// Generate mock food options for a city
function generateMockFoodOptions(
  cityName: string, 
  countryName: string, 
  numberOfNights: number
): DayFoodOptions[] {
  const citySlug = cityName.toLowerCase().replace(/\s/g, '-');
  const isInternational = !["New York", "Los Angeles", "Chicago", "Miami", "Seattle", "Denver", "Austin", "Boston", "San Francisco", "Las Vegas", "Orlando", "Phoenix", "Atlanta", "Dallas", "Houston"].some(
    city => cityName.toLowerCase().includes(city.toLowerCase())
  );
  
  // Restaurant options pool
  const restaurants: FoodOption[] = [
    { 
      id: `${citySlug}-rest-1`, 
      name: `${cityName} Bistro`, 
      description: "Upscale local cuisine with seasonal ingredients and stunning ambiance.", 
      cuisine: isInternational ? "Local Fusion" : "American Contemporary",
      priceRange: "$$$", 
      estimatedCost: isInternational ? 65 : 55, 
      type: "restaurant",
      reservationRequired: true,
      reservationAdvance: "2 weeks in advance",
      url: `https://example.com/restaurants/${citySlug}-bistro`
    },
    { 
      id: `${citySlug}-rest-2`, 
      name: "The Local Kitchen", 
      description: "Cozy neighborhood spot known for authentic regional dishes and warm service.", 
      cuisine: isInternational ? "Traditional Local" : "Farm-to-Table",
      priceRange: "$$", 
      estimatedCost: isInternational ? 40 : 35, 
      type: "restaurant",
      reservationRequired: false,
      url: `https://example.com/restaurants/${citySlug}-local-kitchen`
    },
    { 
      id: `${citySlug}-rest-3`, 
      name: "Fine Dining at The Grand", 
      description: "Award-winning fine dining experience with tasting menus and wine pairings.", 
      cuisine: "Fine Dining",
      priceRange: "$$$$", 
      estimatedCost: isInternational ? 120 : 95, 
      type: "restaurant",
      reservationRequired: true,
      reservationAdvance: "3-4 weeks in advance",
      url: `https://example.com/restaurants/${citySlug}-grand`
    },
    { 
      id: `${citySlug}-rest-4`, 
      name: "Casual Eats Corner", 
      description: "Relaxed spot perfect for lunch with quick, tasty options and outdoor seating.", 
      cuisine: "Casual Dining",
      priceRange: "$", 
      estimatedCost: isInternational ? 20 : 15, 
      type: "restaurant",
      reservationRequired: false,
      url: `https://example.com/restaurants/${citySlug}-casual`
    },
    { 
      id: `${citySlug}-rest-5`, 
      name: "Rooftop Bar & Grill", 
      description: "Scenic rooftop dining with city views and creative cocktails.", 
      cuisine: "Modern Grill",
      priceRange: "$$$", 
      estimatedCost: isInternational ? 55 : 45, 
      type: "restaurant",
      reservationRequired: true,
      reservationAdvance: "1 week in advance",
      url: `https://example.com/restaurants/${citySlug}-rooftop`
    },
  ];
  
  // Food experiences pool
  const foodExperiences: FoodOption[] = [
    { 
      id: `${citySlug}-tour-1`, 
      name: `${cityName} Food Walking Tour`, 
      description: "3-hour guided tour sampling the best local flavors across 6-8 stops.", 
      cuisine: "Various Local",
      priceRange: "$$", 
      estimatedCost: isInternational ? 85 : 70, 
      type: "food-tour",
      reservationRequired: true,
      reservationAdvance: "3-5 days in advance",
      url: `https://example.com/tours/${citySlug}-food`
    },
    { 
      id: `${citySlug}-tasting-1`, 
      name: "Wine & Cheese Tasting", 
      description: "Curated selection of regional wines paired with artisanal cheeses.", 
      cuisine: "Wine & Cheese",
      priceRange: "$$", 
      estimatedCost: isInternational ? 55 : 45, 
      type: "tasting",
      reservationRequired: true,
      reservationAdvance: "2-3 days in advance",
      url: `https://example.com/tastings/${citySlug}`
    },
    { 
      id: `${citySlug}-cooking-1`, 
      name: "Local Cooking Class", 
      description: "Hands-on cooking experience learning traditional recipes from local chefs.", 
      cuisine: "Traditional Local",
      priceRange: "$$$", 
      estimatedCost: isInternational ? 95 : 80, 
      type: "cooking-class",
      reservationRequired: true,
      reservationAdvance: "1 week in advance",
      url: `https://example.com/cooking/${citySlug}`
    },
    { 
      id: `${citySlug}-market-1`, 
      name: "Morning Market Tour", 
      description: "Explore local markets, sample fresh produce, and learn about regional ingredients.", 
      cuisine: "Market Fresh",
      priceRange: "$", 
      estimatedCost: isInternational ? 35 : 25, 
      type: "market",
      reservationRequired: false,
      url: `https://example.com/markets/${citySlug}`
    },
    { 
      id: `${citySlug}-street-1`, 
      name: "Street Food Adventure", 
      description: "Guided evening tour of the best street food vendors and hidden gems.", 
      cuisine: "Street Food",
      priceRange: "$", 
      estimatedCost: isInternational ? 40 : 30, 
      type: "street-food",
      reservationRequired: false,
      url: `https://example.com/streetfood/${citySlug}`
    },
  ];
  
  // Generate food options for each day
  const dayFoodOptions: DayFoodOptions[] = [];
  const allOptions = [...restaurants, ...foodExperiences];
  const cityHash = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let day = 1; day <= numberOfNights; day++) {
    // Each day gets 3-4 restaurant options + 1-2 food experiences
    const startIndex = ((day - 1) * 4 + cityHash) % restaurants.length;
    const expStartIndex = ((day - 1) + cityHash) % foodExperiences.length;
    
    const dayOptions: FoodOption[] = [];
    
    // Add 3-4 restaurants for variety
    for (let i = 0; i < 4; i++) {
      const restaurant = restaurants[(startIndex + i) % restaurants.length];
      dayOptions.push({
        ...restaurant,
        id: `${restaurant.id}-day${day}`
      });
    }
    
    // Add 1-2 food experiences
    for (let i = 0; i < 2; i++) {
      const experience = foodExperiences[(expStartIndex + i) % foodExperiences.length];
      dayOptions.push({
        ...experience,
        id: `${experience.id}-day${day}`
      });
    }
    
    dayFoodOptions.push({
      dayNumber: day,
      cityName,
      options: dayOptions
    });
  }
  
  return dayFoodOptions;
}

// Get food type label
function getFoodTypeLabel(type: FoodOption["type"]): string {
  switch (type) {
    case "restaurant": return "Restaurant";
    case "food-tour": return "Food Tour";
    case "tasting": return "Tasting";
    case "cooking-class": return "Cooking Class";
    case "market": return "Market Tour";
    case "street-food": return "Street Food";
    default: return "Dining";
  }
}

// Get food type color
function getFoodTypeColor(type: FoodOption["type"]): string {
  switch (type) {
    case "restaurant": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "food-tour": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "tasting": return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
    case "cooking-class": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "market": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "street-food": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

// Trip Preparation Item Interface
interface PrepItem {
  id: string;
  category: "luggage" | "clothing" | "electronics" | "toiletries" | "gear" | "documents";
  name: string;
  description: string;
  estimatedCost: number;
  priority: "essential" | "recommended" | "optional";
  url: string;
}

// Generate preparation items based on destinations, season, and travel style
function generatePrepItems(
  destinations: DestinationDetail[],
  season: string,
  tripDuration: number,
  dayPace: "relaxed" | "balanced" | "packed"
): PrepItem[] {
  const items: PrepItem[] = [];
  
  // Determine if international
  const isInternational = destinations.some(d => 
    !["USA", "United States", "US", "United States of America"].includes(d.countryName)
  );
  
  // Determine if trip needs warm or cold weather gear
  const isWarmWeather = ["summer", "spring"].includes(season.toLowerCase());
  const isColdWeather = ["winter", "fall", "off_season"].includes(season.toLowerCase());
  
  // Determine travel style (minimalist for relaxed, more prepared for packed)
  const isMinimalist = dayPace === "relaxed";
  const isHeavyPacker = dayPace === "packed";
  
  // LUGGAGE
  if (tripDuration <= 5) {
    items.push({
      id: "luggage-carry-on",
      category: "luggage",
      name: "Carry-On Suitcase",
      description: "22x14x9 inches, fits overhead bins. Perfect for shorter trips.",
      estimatedCost: 120,
      priority: "essential",
      url: "https://example.com/travel-gear/carry-on-suitcase"
    });
  } else {
    items.push({
      id: "luggage-checked",
      category: "luggage",
      name: "Medium Checked Suitcase",
      description: "25-28 inch expandable suitcase with spinner wheels.",
      estimatedCost: 180,
      priority: "essential",
      url: "https://example.com/travel-gear/checked-suitcase"
    });
  }
  
  items.push({
    id: "luggage-daypack",
    category: "luggage",
    name: "Travel Daypack",
    description: "Foldable 20L daypack for sightseeing and day trips.",
    estimatedCost: 35,
    priority: "recommended",
    url: "https://example.com/travel-gear/daypack"
  });
  
  if (!isMinimalist) {
    items.push({
      id: "luggage-packing-cubes",
      category: "gear",
      name: "Packing Cubes Set",
      description: "6-piece set to organize clothing and maximize suitcase space.",
      estimatedCost: 25,
      priority: "recommended",
      url: "https://example.com/travel-gear/packing-cubes"
    });
  }
  
  // CLOTHING - Based on season
  if (isWarmWeather) {
    items.push({
      id: "clothing-sun-hat",
      category: "clothing",
      name: "Packable Sun Hat",
      description: "UPF 50+ protection, folds flat for packing.",
      estimatedCost: 28,
      priority: "recommended",
      url: "https://example.com/travel-clothing/sun-hat"
    });
    items.push({
      id: "clothing-quick-dry-shorts",
      category: "clothing",
      name: "Quick-Dry Travel Shorts",
      description: "Lightweight, moisture-wicking, wrinkle-resistant.",
      estimatedCost: 45,
      priority: "optional",
      url: "https://example.com/travel-clothing/quick-dry-shorts"
    });
    items.push({
      id: "clothing-sunglasses",
      category: "clothing",
      name: "Polarized Sunglasses",
      description: "UV400 protection with durable travel case.",
      estimatedCost: 35,
      priority: "recommended",
      url: "https://example.com/travel-gear/sunglasses"
    });
  }
  
  if (isColdWeather) {
    items.push({
      id: "clothing-packable-jacket",
      category: "clothing",
      name: "Packable Down Jacket",
      description: "Lightweight, compressible, warm to 32°F.",
      estimatedCost: 95,
      priority: "essential",
      url: "https://example.com/travel-clothing/down-jacket"
    });
    items.push({
      id: "clothing-thermal-layers",
      category: "clothing",
      name: "Merino Wool Base Layer",
      description: "Naturally odor-resistant, temperature regulating.",
      estimatedCost: 65,
      priority: "recommended",
      url: "https://example.com/travel-clothing/base-layer"
    });
    items.push({
      id: "clothing-beanie",
      category: "clothing",
      name: "Packable Beanie",
      description: "Warm wool blend, fits in pocket.",
      estimatedCost: 18,
      priority: "optional",
      url: "https://example.com/travel-clothing/beanie"
    });
  }
  
  // Walking shoes for all trips
  items.push({
    id: "clothing-walking-shoes",
    category: "clothing",
    name: "Comfortable Walking Shoes",
    description: "Cushioned, supportive, broken in before trip.",
    estimatedCost: 85,
    priority: "essential",
    url: "https://example.com/travel-footwear/walking-shoes"
  });
  
  // ELECTRONICS
  if (isInternational) {
    items.push({
      id: "electronics-power-adapter",
      category: "electronics",
      name: "Universal Power Adapter",
      description: "Works in 150+ countries with multiple USB ports.",
      estimatedCost: 25,
      priority: "essential",
      url: "https://example.com/travel-electronics/universal-adapter"
    });
    items.push({
      id: "electronics-voltage-converter",
      category: "electronics",
      name: "Voltage Converter",
      description: "For devices not rated for 220V (hair dryers, curling irons).",
      estimatedCost: 35,
      priority: "optional",
      url: "https://example.com/travel-electronics/voltage-converter"
    });
  }
  
  items.push({
    id: "electronics-power-bank",
    category: "electronics",
    name: "Portable Power Bank",
    description: "20,000mAh capacity, TSA-approved for carry-on.",
    estimatedCost: 40,
    priority: "recommended",
    url: "https://example.com/travel-electronics/power-bank"
  });
  
  if (isHeavyPacker) {
    items.push({
      id: "electronics-travel-camera",
      category: "electronics",
      name: "Compact Travel Camera",
      description: "Lightweight mirrorless or high-end compact camera.",
      estimatedCost: 350,
      priority: "optional",
      url: "https://example.com/travel-electronics/camera"
    });
  }
  
  // TOILETRIES
  items.push({
    id: "toiletries-travel-bottles",
    category: "toiletries",
    name: "TSA-Approved Travel Bottles",
    description: "Leakproof silicone bottles, 3.4oz each, clear pouch.",
    estimatedCost: 15,
    priority: "essential",
    url: "https://example.com/travel-toiletries/bottles"
  });
  
  items.push({
    id: "toiletries-hanging-bag",
    category: "toiletries",
    name: "Hanging Toiletry Bag",
    description: "Compact organizer with hook for hotel bathrooms.",
    estimatedCost: 22,
    priority: "recommended",
    url: "https://example.com/travel-toiletries/bag"
  });
  
  if (isWarmWeather) {
    items.push({
      id: "toiletries-sunscreen",
      category: "toiletries",
      name: "Travel Sunscreen SPF 50",
      description: "Reef-safe, TSA-approved size. Apply every 2 hours.",
      estimatedCost: 12,
      priority: "essential",
      url: "https://example.com/travel-toiletries/sunscreen"
    });
  }
  
  // TRAVEL GEAR
  items.push({
    id: "gear-travel-pillow",
    category: "gear",
    name: "Memory Foam Travel Pillow",
    description: "Compressible neck pillow with carrying case.",
    estimatedCost: 30,
    priority: tripDuration > 7 ? "recommended" : "optional",
    url: "https://example.com/travel-gear/neck-pillow"
  });
  
  if (isInternational || tripDuration > 7) {
    items.push({
      id: "gear-money-belt",
      category: "gear",
      name: "RFID-Blocking Money Belt",
      description: "Hidden under-clothing pouch for passport and cash.",
      estimatedCost: 18,
      priority: "recommended",
      url: "https://example.com/travel-gear/money-belt"
    });
  }
  
  items.push({
    id: "gear-luggage-locks",
    category: "gear",
    name: "TSA-Approved Luggage Locks",
    description: "Set of 2 combination locks, TSA-accepted.",
    estimatedCost: 12,
    priority: "recommended",
    url: "https://example.com/travel-gear/locks"
  });
  
  items.push({
    id: "gear-reusable-water-bottle",
    category: "gear",
    name: "Collapsible Water Bottle",
    description: "Foldable, BPA-free, TSA-friendly when empty.",
    estimatedCost: 15,
    priority: "optional",
    url: "https://example.com/travel-gear/water-bottle"
  });
  
  // DOCUMENTS
  if (isInternational) {
    items.push({
      id: "documents-passport-holder",
      category: "documents",
      name: "RFID Passport Holder",
      description: "Blocks scanning, holds passport + cards + boarding pass.",
      estimatedCost: 15,
      priority: "recommended",
      url: "https://example.com/travel-documents/passport-holder"
    });
  }
  
  items.push({
    id: "documents-travel-insurance",
    category: "documents",
    name: "Travel Insurance",
    description: "Coverage for medical emergencies, trip cancellation, lost luggage.",
    estimatedCost: Math.round(tripDuration * 8),
    priority: "essential",
    url: "https://example.com/travel-insurance"
  });
  
  return items;
}

// Get prep category label
function getPrepCategoryLabel(category: PrepItem["category"]): string {
  switch (category) {
    case "luggage": return "Luggage";
    case "clothing": return "Clothing & Apparel";
    case "electronics": return "Electronics";
    case "toiletries": return "Toiletries";
    case "gear": return "Travel Gear";
    case "documents": return "Documents & Insurance";
    default: return "Other";
  }
}

// Get prep category icon color
function getPrepCategoryColor(category: PrepItem["category"]): string {
  switch (category) {
    case "luggage": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "clothing": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "electronics": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "toiletries": return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
    case "gear": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "documents": return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

// Get priority badge variant
function getPriorityBadge(priority: PrepItem["priority"]): { label: string; className: string } {
  switch (priority) {
    case "essential": return { label: "Essential", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
    case "recommended": return { label: "Recommended", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" };
    case "optional": return { label: "Optional", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" };
    default: return { label: "Other", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" };
  }
}

// Books & Movies Recommendation Interface
interface MediaRecommendation {
  id: string;
  type: "book" | "movie" | "documentary" | "tv-series" | "travel-guide";
  title: string;
  creator: string; // Author or Director
  description: string;
  ageGroup: "kids" | "teens" | "adults" | "all-ages";
  relevance: string; // Why it's relevant to the trip
  url: string;
  year?: number;
}

// Generate book and movie recommendations based on destinations
function generateMediaRecommendations(destinations: DestinationDetail[]): MediaRecommendation[] {
  const recommendations: MediaRecommendation[] = [];
  
  // Determine regions for recommendations
  const regions = new Set<string>();
  const countries = new Set<string>();
  
  destinations.forEach(d => {
    countries.add(d.countryName);
    
    // Map countries to regions for recommendations
    if (["France", "Italy", "Spain", "Germany", "UK", "England", "Greece", "Portugal", "Netherlands", "Belgium", "Austria", "Switzerland"].some(c => d.countryName.includes(c))) {
      regions.add("europe");
    }
    if (["Japan", "China", "Thailand", "Vietnam", "South Korea", "India", "Indonesia", "Singapore", "Malaysia"].some(c => d.countryName.includes(c))) {
      regions.add("asia");
    }
    if (["Mexico", "Brazil", "Argentina", "Peru", "Chile", "Colombia", "Costa Rica"].some(c => d.countryName.includes(c))) {
      regions.add("latin-america");
    }
    if (["USA", "United States", "Canada"].some(c => d.countryName.includes(c))) {
      regions.add("north-america");
    }
    if (["Morocco", "Egypt", "South Africa", "Kenya", "Tanzania"].some(c => d.countryName.includes(c))) {
      regions.add("africa");
    }
    if (["Australia", "New Zealand", "Fiji"].some(c => d.countryName.includes(c))) {
      regions.add("oceania");
    }
  });
  
  // Default to general travel if no specific region detected
  if (regions.size === 0) {
    regions.add("general");
  }
  
  // FOR KIDS
  recommendations.push({
    id: "kids-book-1",
    type: "book",
    title: "This Is... Series (by Miroslav Sasek)",
    creator: "Miroslav Sasek",
    description: "Classic illustrated travel books that introduce children to famous cities and countries through charming artwork and fun facts.",
    ageGroup: "kids",
    relevance: "Perfect introduction to world travel for young explorers",
    url: "https://example.com/books/this-is-series",
    year: 1959
  });
  
  recommendations.push({
    id: "kids-movie-1",
    type: "movie",
    title: "Up",
    creator: "Pete Docter (Pixar)",
    description: "An elderly man and a young boy embark on an adventure to South America, discovering that the journey itself is the greatest adventure.",
    ageGroup: "kids",
    relevance: "Inspiring story about adventure, dreams, and the joy of travel",
    url: "https://example.com/movies/up",
    year: 2009
  });
  
  if (regions.has("europe")) {
    recommendations.push({
      id: "kids-movie-europe",
      type: "movie",
      title: "Ratatouille",
      creator: "Brad Bird (Pixar)",
      description: "A rat with culinary dreams becomes a chef in a Parisian restaurant. Beautiful depiction of Paris and French cuisine.",
      ageGroup: "kids",
      relevance: "Fun introduction to French culture and cuisine",
      url: "https://example.com/movies/ratatouille",
      year: 2007
    });
  }
  
  if (regions.has("asia")) {
    recommendations.push({
      id: "kids-movie-asia",
      type: "movie",
      title: "My Neighbor Totoro",
      creator: "Hayao Miyazaki (Studio Ghibli)",
      description: "Two sisters discover magical creatures in the Japanese countryside. A gentle, enchanting film about nature and imagination.",
      ageGroup: "kids",
      relevance: "Beautiful introduction to Japanese culture and countryside",
      url: "https://example.com/movies/totoro",
      year: 1988
    });
  }
  
  // FOR TEENS
  recommendations.push({
    id: "teens-book-1",
    type: "book",
    title: "The Alchemist",
    creator: "Paulo Coelho",
    description: "A young shepherd travels from Spain to Egypt pursuing his dreams. A tale about following your destiny and the journey of self-discovery.",
    ageGroup: "teens",
    relevance: "Inspiring story about pursuing dreams through travel",
    url: "https://example.com/books/alchemist",
    year: 1988
  });
  
  if (regions.has("europe")) {
    recommendations.push({
      id: "teens-movie-europe",
      type: "movie",
      title: "The Grand Budapest Hotel",
      creator: "Wes Anderson",
      description: "A quirky adventure set in a fictional European hotel. Visually stunning with themes of friendship and adventure.",
      ageGroup: "teens",
      relevance: "Whimsical look at European elegance and adventure",
      url: "https://example.com/movies/grand-budapest",
      year: 2014
    });
    
    recommendations.push({
      id: "teens-book-europe",
      type: "book",
      title: "The Book Thief",
      creator: "Markus Zusak",
      description: "A young girl's life in Nazi Germany, narrated by Death. A powerful story about words, humanity, and resilience.",
      ageGroup: "teens",
      relevance: "Understanding European history through compelling narrative",
      url: "https://example.com/books/book-thief",
      year: 2005
    });
  }
  
  if (regions.has("asia")) {
    recommendations.push({
      id: "teens-movie-asia",
      type: "movie",
      title: "Spirited Away",
      creator: "Hayao Miyazaki (Studio Ghibli)",
      description: "A girl enters a spirit world and must work in a bathhouse for gods. Stunning animation and deep cultural themes.",
      ageGroup: "teens",
      relevance: "Immersive journey into Japanese mythology and culture",
      url: "https://example.com/movies/spirited-away",
      year: 2001
    });
  }
  
  if (regions.has("latin-america")) {
    recommendations.push({
      id: "teens-movie-latin",
      type: "movie",
      title: "Coco",
      creator: "Lee Unkrich (Pixar)",
      description: "A boy journeys to the Land of the Dead during Día de los Muertos. Celebrates Mexican culture, family, and music.",
      ageGroup: "teens",
      relevance: "Beautiful exploration of Mexican traditions and family",
      url: "https://example.com/movies/coco",
      year: 2017
    });
  }
  
  // FOR ADULTS
  recommendations.push({
    id: "adults-guide-1",
    type: "travel-guide",
    title: "Lonely Planet Destination Guide",
    creator: "Lonely Planet",
    description: "Comprehensive travel guide with detailed maps, local insights, and practical tips for independent travelers.",
    ageGroup: "adults",
    relevance: "Essential practical information for your destinations",
    url: "https://example.com/guides/lonely-planet"
  });
  
  recommendations.push({
    id: "adults-book-1",
    type: "book",
    title: "A Year in Provence",
    creator: "Peter Mayle",
    description: "Charming account of an English couple's first year living in the south of France, full of humor and cultural observations.",
    ageGroup: "adults",
    relevance: "Delightful preparation for European travel and culture",
    url: "https://example.com/books/year-in-provence",
    year: 1989
  });
  
  if (regions.has("europe")) {
    recommendations.push({
      id: "adults-movie-europe",
      type: "movie",
      title: "Before Sunrise",
      creator: "Richard Linklater",
      description: "Two strangers meet on a train and spend one night walking through Vienna. A beautiful meditation on connection and travel.",
      ageGroup: "adults",
      relevance: "Romantic exploration of European wandering",
      url: "https://example.com/movies/before-sunrise",
      year: 1995
    });
    
    recommendations.push({
      id: "adults-doc-europe",
      type: "documentary",
      title: "Rick Steves' Europe",
      creator: "Rick Steves",
      description: "Travel documentary series exploring European destinations with practical tips and cultural insights.",
      ageGroup: "adults",
      relevance: "Practical and inspiring guide to European travel",
      url: "https://example.com/docs/rick-steves"
    });
    
    recommendations.push({
      id: "adults-book-europe-history",
      type: "book",
      title: "The Pillars of the Earth",
      creator: "Ken Follett",
      description: "Epic historical novel set in 12th-century England, following the building of a cathedral. Rich in medieval history.",
      ageGroup: "adults",
      relevance: "Immersive European medieval history through fiction",
      url: "https://example.com/books/pillars-earth",
      year: 1989
    });
  }
  
  if (regions.has("asia")) {
    recommendations.push({
      id: "adults-book-asia",
      type: "book",
      title: "Shogun",
      creator: "James Clavell",
      description: "Epic novel of an English navigator shipwrecked in feudal Japan. Rich in Japanese culture, history, and samurai traditions.",
      ageGroup: "adults",
      relevance: "Deep dive into Japanese history and culture",
      url: "https://example.com/books/shogun",
      year: 1975
    });
    
    recommendations.push({
      id: "adults-movie-asia",
      type: "movie",
      title: "Lost in Translation",
      creator: "Sofia Coppola",
      description: "Two Americans form an unlikely bond while staying at a Tokyo hotel. Captures the beautiful disorientation of travel.",
      ageGroup: "adults",
      relevance: "Thoughtful exploration of being a stranger in Japan",
      url: "https://example.com/movies/lost-translation",
      year: 2003
    });
    
    recommendations.push({
      id: "adults-doc-asia",
      type: "documentary",
      title: "Jiro Dreams of Sushi",
      creator: "David Gelb",
      description: "Documentary about 85-year-old sushi master Jiro Ono and his legendary Tokyo restaurant.",
      ageGroup: "adults",
      relevance: "Fascinating look at Japanese craftsmanship and cuisine",
      url: "https://example.com/docs/jiro-sushi",
      year: 2011
    });
  }
  
  if (regions.has("latin-america")) {
    recommendations.push({
      id: "adults-book-latin",
      type: "book",
      title: "One Hundred Years of Solitude",
      creator: "Gabriel García Márquez",
      description: "Magical realist masterpiece following seven generations of the Buendía family in fictional Macondo, Colombia.",
      ageGroup: "adults",
      relevance: "Essential Latin American literature and culture",
      url: "https://example.com/books/100-years-solitude",
      year: 1967
    });
    
    recommendations.push({
      id: "adults-movie-latin",
      type: "movie",
      title: "The Motorcycle Diaries",
      creator: "Walter Salles",
      description: "Young Che Guevara's transformative motorcycle journey across South America. Beautiful landscapes and coming-of-age story.",
      ageGroup: "adults",
      relevance: "Epic South American road trip inspiration",
      url: "https://example.com/movies/motorcycle-diaries",
      year: 2004
    });
  }
  
  if (regions.has("africa")) {
    recommendations.push({
      id: "adults-book-africa",
      type: "book",
      title: "Out of Africa",
      creator: "Isak Dinesen",
      description: "Memoir of the author's years running a coffee plantation in Kenya. Lyrical prose about African landscapes and people.",
      ageGroup: "adults",
      relevance: "Classic African travel literature",
      url: "https://example.com/books/out-of-africa",
      year: 1937
    });
    
    recommendations.push({
      id: "adults-doc-africa",
      type: "documentary",
      title: "Planet Earth: Africa",
      creator: "David Attenborough",
      description: "Stunning documentary showcasing Africa's diverse landscapes and wildlife, from deserts to rainforests.",
      ageGroup: "adults",
      relevance: "Breathtaking preview of African wildlife and nature",
      url: "https://example.com/docs/planet-earth-africa"
    });
  }
  
  if (regions.has("oceania")) {
    recommendations.push({
      id: "adults-book-oceania",
      type: "book",
      title: "In a Sunburned Country",
      creator: "Bill Bryson",
      description: "Hilarious and informative account of Bryson's travels through Australia, full of history and quirky observations.",
      ageGroup: "adults",
      relevance: "Entertaining guide to Australian culture and nature",
      url: "https://example.com/books/sunburned-country",
      year: 2000
    });
    
    recommendations.push({
      id: "adults-movie-oceania",
      type: "movie",
      title: "The Lord of the Rings Trilogy",
      creator: "Peter Jackson",
      description: "Epic fantasy filmed entirely in New Zealand. Showcases the country's stunning landscapes from mountains to forests.",
      ageGroup: "adults",
      relevance: "New Zealand's landscapes as Middle-earth",
      url: "https://example.com/movies/lotr",
      year: 2001
    });
  }
  
  // ALL AGES
  recommendations.push({
    id: "all-doc-1",
    type: "documentary",
    title: "Our Planet",
    creator: "Netflix / David Attenborough",
    description: "Stunning nature documentary series exploring the world's most precious habitats and the animals that call them home.",
    ageGroup: "all-ages",
    relevance: "Beautiful exploration of our world's natural wonders",
    url: "https://example.com/docs/our-planet"
  });
  
  recommendations.push({
    id: "all-book-1",
    type: "book",
    title: "Atlas Obscura",
    creator: "Joshua Foer, Dylan Thuras, Ella Morton",
    description: "Guide to the world's hidden wonders - strange places, unusual sites, and little-known marvels around the globe.",
    ageGroup: "all-ages",
    relevance: "Discover unique destinations off the beaten path",
    url: "https://example.com/books/atlas-obscura",
    year: 2016
  });
  
  return recommendations;
}

// Get media type label
function getMediaTypeLabel(type: MediaRecommendation["type"]): string {
  switch (type) {
    case "book": return "Book";
    case "movie": return "Movie";
    case "documentary": return "Documentary";
    case "tv-series": return "TV Series";
    case "travel-guide": return "Travel Guide";
    default: return "Media";
  }
}

// Get media type color
function getMediaTypeColor(type: MediaRecommendation["type"]): string {
  switch (type) {
    case "book": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "movie": return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400";
    case "documentary": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "tv-series": return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
    case "travel-guide": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

// Get age group label
function getAgeGroupLabel(ageGroup: MediaRecommendation["ageGroup"]): string {
  switch (ageGroup) {
    case "kids": return "For Kids";
    case "teens": return "For Teens";
    case "adults": return "For Adults";
    case "all-ages": return "All Ages";
    default: return "";
  }
}

// Get age group color
function getAgeGroupColor(ageGroup: MediaRecommendation["ageGroup"]): string {
  switch (ageGroup) {
    case "kids": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "teens": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
    case "adults": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
    case "all-ages": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
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

  // Transportation selection state
  // Maps segment id -> selected TransportOption id (or null if not selected)
  const [selectedTransport, setSelectedTransport] = useState<Record<string, string | null>>({});
  
  // Generate transport segments for the itinerary
  const transportSegments = useMemo(() => {
    if (!displayedDestinationDetails || displayedDestinationDetails.length === 0) return [];
    return generateTransportSegments(displayedDestinationDetails);
  }, [displayedDestinationDetails]);

  // Activity selection state
  // Maps "cityName-dayNumber-activityId" -> boolean (selected or not)
  const [selectedActivities, setSelectedActivities] = useState<Record<string, boolean>>({});
  
  // Activity pace from quiz (default to balanced)
  const activityPace: ActivityPace = useMemo(() => {
    // Try to get pace from sessionStorage quiz results
    try {
      const quizData = sessionStorage.getItem("trippirate_quiz_results");
      if (quizData) {
        const parsed = JSON.parse(quizData);
        // Check for pace-related quiz answers
        if (parsed.tripPace === "relaxed" || parsed.pace === "relaxed") return "relaxed";
        if (parsed.tripPace === "packed" || parsed.pace === "packed") return "packed";
      }
    } catch {
      // Ignore parsing errors
    }
    return "balanced";
  }, []);
  
  // Generate activities for each destination and day
  const activitiesByCity = useMemo(() => {
    const result: Record<string, DayActivities[]> = {};
    if (displayedDestinationDetails) {
      displayedDestinationDetails.forEach((dest) => {
        result[dest.cityName] = generateMockActivities(
          dest.cityName, 
          dest.countryName, 
          dest.numberOfNights,
          activityPace
        );
      });
    }
    return result;
  }, [displayedDestinationDetails, activityPace]);
  
  // Calculate total selected activities count and cost
  const selectedActivityStats = useMemo(() => {
    let totalCost = 0;
    let totalCount = 0;
    let totalAvailable = 0;
    
    Object.entries(activitiesByCity).forEach(([cityName, days]) => {
      days.forEach((day) => {
        totalAvailable += day.activities.length;
        day.activities.forEach((activity) => {
          const key = `${cityName}-${day.dayNumber}-${activity.id}`;
          if (selectedActivities[key]) {
            totalCost += activity.cost;
            totalCount += 1;
          }
        });
      });
    });
    
    return { totalCost, totalCount, totalAvailable };
  }, [activitiesByCity, selectedActivities]);
  
  // Handle activity selection toggle
  const handleToggleActivity = (cityName: string, dayNumber: number, activityId: string) => {
    const key = `${cityName}-${dayNumber}-${activityId}`;
    setSelectedActivities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Get activity type label
  const getActivityTypeLabel = (type: ActivityOption["type"]): string => {
    switch (type) {
      case "main-attraction": return "Must See";
      case "unique": return "Hidden Gem";
      case "food-experience": return "Food & Drink";
      case "outdoor": return "Outdoor";
      case "cultural": return "Cultural";
      case "relaxation": return "Relaxation";
      default: return "Activity";
    }
  };
  
  // Get activity type color
  const getActivityTypeColor = (type: ActivityOption["type"]): string => {
    switch (type) {
      case "main-attraction": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "unique": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "food-experience": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "outdoor": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cultural": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "relaxation": return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // Food selection state
  // Maps "cityName-dayNumber-foodId" -> boolean (selected or not)
  const [selectedFoodOptions, setSelectedFoodOptions] = useState<Record<string, boolean>>({});
  
  // Food budget mode: "selections" = pick specific restaurants, "daily" = use daily budget slider
  const [foodBudgetMode, setFoodBudgetMode] = useState<"selections" | "daily">("selections");
  
  // Daily food budget per person (for slider mode)
  const [dailyFoodBudget, setDailyFoodBudget] = useState(75);
  
  // Generate food options for each destination and day
  const foodOptionsByCity = useMemo(() => {
    const result: Record<string, DayFoodOptions[]> = {};
    if (displayedDestinationDetails) {
      displayedDestinationDetails.forEach((dest) => {
        result[dest.cityName] = generateMockFoodOptions(
          dest.cityName, 
          dest.countryName, 
          dest.numberOfNights
        );
      });
    }
    return result;
  }, [displayedDestinationDetails]);
  
  // Calculate total selected food options count and cost
  const selectedFoodStats = useMemo(() => {
    let totalCost = 0;
    let totalCount = 0;
    let totalAvailable = 0;
    let restaurantCount = 0;
    let experienceCount = 0;
    
    Object.entries(foodOptionsByCity).forEach(([cityName, days]) => {
      days.forEach((day) => {
        totalAvailable += day.options.length;
        day.options.forEach((option) => {
          const key = `${cityName}-${day.dayNumber}-${option.id}`;
          if (selectedFoodOptions[key]) {
            totalCost += option.estimatedCost * numberOfTravelers;
            totalCount += 1;
            if (option.type === "restaurant") {
              restaurantCount += 1;
            } else {
              experienceCount += 1;
            }
          }
        });
      });
    });
    
    return { totalCost, totalCount, totalAvailable, restaurantCount, experienceCount };
  }, [foodOptionsByCity, selectedFoodOptions, numberOfTravelers]);
  
  // Handle food selection toggle
  const handleToggleFoodOption = (cityName: string, dayNumber: number, foodId: string) => {
    const key = `${cityName}-${dayNumber}-${foodId}`;
    setSelectedFoodOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Trip Preparation state
  // Maps "prepItemId" -> "own" | "need" | undefined (not set)
  const [prepItemStatus, setPrepItemStatus] = useState<Record<string, "own" | "need">>({});
  
  // Generate preparation items based on trip details
  const prepItems = useMemo(() => {
    if (!displayedDestinationDetails || displayedDestinationDetails.length === 0) {
      return [];
    }
    return generatePrepItems(
      displayedDestinationDetails,
      itinerary?.travelSeason || travelSeason,
      displayedDuration,
      activityPace
    );
  }, [displayedDestinationDetails, itinerary?.travelSeason, travelSeason, displayedDuration, activityPace]);
  
  // Handle prep item status toggle
  const handleTogglePrepStatus = (itemId: string, status: "own" | "need") => {
    setPrepItemStatus(prev => ({
      ...prev,
      [itemId]: prev[itemId] === status ? undefined : status
    }));
  };
  
  // Calculate prep stats
  const prepStats = useMemo(() => {
    let totalCost = 0;
    let needToBuyCount = 0;
    let alreadyOwnCount = 0;
    let essentialCost = 0;
    let recommendedCost = 0;
    let optionalCost = 0;
    
    prepItems.forEach((item) => {
      const status = prepItemStatus[item.id];
      if (status === "need") {
        totalCost += item.estimatedCost;
        needToBuyCount += 1;
        if (item.priority === "essential") essentialCost += item.estimatedCost;
        if (item.priority === "recommended") recommendedCost += item.estimatedCost;
        if (item.priority === "optional") optionalCost += item.estimatedCost;
      } else if (status === "own") {
        alreadyOwnCount += 1;
      }
    });
    
    return { 
      totalCost, 
      needToBuyCount, 
      alreadyOwnCount, 
      essentialCost, 
      recommendedCost, 
      optionalCost,
      totalItems: prepItems.length,
      unmarkedCount: prepItems.length - needToBuyCount - alreadyOwnCount
    };
  }, [prepItems, prepItemStatus]);
  
  // Group prep items by category
  const prepItemsByCategory = useMemo(() => {
    const grouped: Record<string, PrepItem[]> = {};
    prepItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [prepItems]);

  // Generate media recommendations based on destinations
  const mediaRecommendations = useMemo(() => {
    if (!displayedDestinationDetails || displayedDestinationDetails.length === 0) {
      return [];
    }
    return generateMediaRecommendations(displayedDestinationDetails);
  }, [displayedDestinationDetails]);

  // Group media recommendations by age group
  const mediaByAgeGroup = useMemo(() => {
    const grouped: Record<string, MediaRecommendation[]> = {
      "kids": [],
      "teens": [],
      "adults": [],
      "all-ages": []
    };
    mediaRecommendations.forEach((item) => {
      grouped[item.ageGroup].push(item);
    });
    return grouped;
  }, [mediaRecommendations]);

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

  // Handle transport selection
  const handleSelectTransport = (segmentId: string, optionId: string) => {
    setSelectedTransport(prev => ({
      ...prev,
      [segmentId]: prev[segmentId] === optionId ? null : optionId
    }));
  };

  // Estimate transportation cost (AI estimate before selections)
  const estimatedTransportCost = useMemo(() => {
    // If user has manually entered transportation cost, use that
    const transportBudget = parseFloat(budgetData.transportation.cost || "0");
    if (transportBudget > 0) {
      return transportBudget;
    }
    
    // Otherwise estimate based on typical rates
    let totalCost = 0;
    transportSegments.forEach(segment => {
      // Use the middle-cost option as the estimate
      if (segment.options.length > 0) {
        const sortedOptions = [...segment.options].sort((a, b) => a.cost - b.cost);
        const middleIndex = Math.floor(sortedOptions.length / 2);
        totalCost += sortedOptions[middleIndex].cost;
      }
    });
    return totalCost;
  }, [budgetData.transportation.cost, transportSegments]);

  // Calculate actual transport cost based on selections
  const selectedTransportCost = useMemo(() => {
    let totalCost = 0;
    let allSelected = true;
    
    transportSegments.forEach(segment => {
      const selectedId = selectedTransport[segment.id];
      if (selectedId) {
        const selected = segment.options.find(opt => opt.id === selectedId);
        if (selected) {
          totalCost += selected.cost;
        }
      } else {
        allSelected = false;
      }
    });
    
    return { cost: totalCost, allSelected };
  }, [selectedTransport, transportSegments]);

  // Final transport cost - use selected if all are chosen, otherwise AI estimate
  const finalTransportCost = selectedTransportCost.allSelected && selectedTransportCost.cost > 0
    ? selectedTransportCost.cost
    : estimatedTransportCost;

  // Combined flight + accommodation + transport savings calculations
  const totalFlightsAccomTransport = estimatedFlightCost + finalAccommodationCost + finalTransportCost;
  const savingsAfterAccommodation = Math.max(0, savingsAfterFlights - finalAccommodationCost);
  const savingsAllocatedToTransport = Math.min(savingsAfterAccommodation, finalTransportCost);
  const transportSavingsGap = Math.max(0, finalTransportCost - savingsAllocatedToTransport);
  const combinedWithTransportGap = combinedSavingsGap + transportSavingsGap;
  
  // Calculate months needed for flights + accommodation + transport
  const monthsToAllBookings = monthlySavingsNum > 0 ? Math.ceil(combinedWithTransportGap / monthlySavingsNum) : 0;
  
  // Calculate earliest transport booking date
  const earliestTransportBookingDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToAllBookings);
    return date;
  }, [monthsToAllBookings]);
  
  // Check if transport can be booked today
  const canBookTransportNow = combinedWithTransportGap === 0 || new Date() >= earliestTransportBookingDate;
  
  // Calculate percentage of transport cost saved
  const transportSavingsProgress = finalTransportCost > 0 
    ? Math.min(100, (savingsAllocatedToTransport / finalTransportCost) * 100) 
    : 0;

  // Activity cost calculations
  const finalActivityCost = selectedActivityStats.totalCost > 0 
    ? selectedActivityStats.totalCost 
    : (displayedDestinationDetails?.length || 0) * tripDuration * 35; // Estimate $35/day/destination if no selections
  
  // Combined flight + accommodation + transport + activities savings calculations  
  const totalFlightsAccomTransportActivities = totalFlightsAccomTransport + finalActivityCost;
  const savingsAfterTransport = Math.max(0, savingsAfterAccommodation - finalTransportCost);
  const savingsAllocatedToActivities = Math.min(savingsAfterTransport, finalActivityCost);
  const activitySavingsGap = Math.max(0, finalActivityCost - savingsAllocatedToActivities);
  const combinedWithActivityGap = combinedWithTransportGap + activitySavingsGap;
  
  // Calculate months needed for all bookings including activities
  const monthsToAllIncludingActivities = monthlySavingsNum > 0 ? Math.ceil(combinedWithActivityGap / monthlySavingsNum) : 0;
  
  // Calculate earliest activity booking date
  const earliestActivityBookingDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToAllIncludingActivities);
    return date;
  }, [monthsToAllIncludingActivities]);
  
  // Check if activities can be booked today
  const canBookActivitiesNow = combinedWithActivityGap === 0 || new Date() >= earliestActivityBookingDate;
  
  // Calculate percentage of activity cost saved
  const activitySavingsProgress = finalActivityCost > 0 
    ? Math.min(100, (savingsAllocatedToActivities / finalActivityCost) * 100) 
    : 0;

  // Food cost calculations
  const finalFoodCost = useMemo(() => {
    if (foodBudgetMode === "daily") {
      // Daily budget mode: daily budget × trip duration × travelers
      return dailyFoodBudget * tripDuration * numberOfTravelers;
    } else {
      // Selections mode: sum of selected food options, or estimate
      if (selectedFoodStats.totalCount > 0) {
        return selectedFoodStats.totalCost;
      }
      // AI estimate: ~$50/day/person for international, $40/day/person for domestic
      const isInternational = displayedDestinationDetails?.some(d => 
        !["USA", "United States", "US"].includes(d.countryName)
      );
      return tripDuration * numberOfTravelers * (isInternational ? 50 : 40);
    }
  }, [foodBudgetMode, dailyFoodBudget, tripDuration, numberOfTravelers, selectedFoodStats, displayedDestinationDetails]);
  
  // Combined flight + accommodation + transport + activities + food savings calculations  
  const totalAllCategories = totalFlightsAccomTransportActivities + finalFoodCost;
  const savingsAfterActivities = Math.max(0, savingsAfterTransport - finalActivityCost);
  const savingsAllocatedToFood = Math.min(savingsAfterActivities, finalFoodCost);
  const foodSavingsGap = Math.max(0, finalFoodCost - savingsAllocatedToFood);
  const combinedWithFoodGap = combinedWithActivityGap + foodSavingsGap;
  
  // Calculate months needed for all bookings including food
  const monthsToAllIncludingFood = monthlySavingsNum > 0 ? Math.ceil(combinedWithFoodGap / monthlySavingsNum) : 0;
  
  // Calculate earliest food planning date
  const earliestFoodPlanningDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToAllIncludingFood);
    return date;
  }, [monthsToAllIncludingFood]);
  
  // Check if food can be planned/booked today
  const canPlanFoodNow = combinedWithFoodGap === 0 || new Date() >= earliestFoodPlanningDate;
  
  // Calculate percentage of food cost saved
  const foodSavingsProgress = finalFoodCost > 0 
    ? Math.min(100, (savingsAllocatedToFood / finalFoodCost) * 100) 
    : 0;

  // =============================================================================
  // CENTRALIZED BUDGET CALCULATIONS
  // =============================================================================
  // Using the useTripBudget hook for consistent calculations across all categories.
  // This provides:
  // - Total trip cost with points applied
  // - Sequential savings allocation (Flights → Accommodations → Transport → Activities → Food → Prep)
  // - Earliest booking dates for each category
  // - AI-recommended monthly savings
  // =============================================================================
  
  // Build category costs object for centralized budget calculation
  const categoryCostsForBudget: CategoryCosts = useMemo(() => ({
    flights: estimatedFlightCost,
    accommodations: finalAccommodationCost,
    transportation: finalTransportCost,
    activities: finalActivityCost,
    food: finalFoodCost,
    preparation: prepStats.totalCost
  }), [estimatedFlightCost, finalAccommodationCost, finalTransportCost, finalActivityCost, finalFoodCost, prepStats.totalCost]);
  
  // Use the centralized budget hook for all calculations
  const tripBudget = useTripBudget({
    categoryCosts: categoryCostsForBudget,
    currentSavings: currentSavingsNum,
    monthlySavings: monthlySavingsNum,
    pointsToUse: parseInt(budgetData.flights.pointsToUse || "0", 10),
    usePoints: budgetData.flights.usePoints
  });
  
  // Get activity pace description
  const getActivityPaceDescription = (pace: ActivityPace): string => {
    switch (pace) {
      case "relaxed": return "Taking it easy with 1-2 activities per day";
      case "balanced": return "A nice mix of 2-3 activities per day";
      case "packed": return "Adventure-packed with 3-5 activities per day";
      default: return "Balanced itinerary";
    }
  };

  // Get transport type icon name
  const getTransportTypeName = (type: TransportOption["type"]): string => {
    const typeMap: Record<TransportOption["type"], string> = {
      metro: "Metro/Subway",
      train: "Train",
      bus: "Bus",
      rideshare: "Rideshare",
      taxi: "Taxi",
      shuttle: "Shuttle/Flight"
    };
    return typeMap[type] || type;
  };

  // Get segment type label
  const getSegmentTypeLabel = (segmentType: TransportSegment["segmentType"]): string => {
    const labelMap: Record<TransportSegment["segmentType"], string> = {
      "airport-arrival": "Airport Arrival",
      "within-city": "Getting Around",
      "city-to-city": "City Transfer",
      "airport-departure": "Airport Departure"
    };
    return labelMap[segmentType] || segmentType;
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
                
                {/* Book Flights Button - Uses centralized budget calculations */}
                <BookingButton
                  category="flights"
                  isFunded={tripBudget.categories.flights.isFunded}
                  monthsToFund={tripBudget.categories.flights.monthsToFund}
                  earliestDate={tripBudget.categories.flights.earliestBookingDate}
                  label="Book the Flights"
                  onClick={() => {
                    toast({
                      title: "Ready to Book!",
                      description: "Opening flight booking options...",
                    });
                  }}
                  testId="button-book-flights"
                />
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

                {/* Book Stays Button - Uses centralized budget calculations */}
                <div className="p-4 rounded-lg bg-muted/50 border flex flex-col justify-center">
                  <BookingButton
                    category="accommodations"
                    isFunded={tripBudget.categories.accommodations.isFunded}
                    monthsToFund={tripBudget.categories.accommodations.monthsToFund}
                    earliestDate={tripBudget.categories.accommodations.earliestBookingDate}
                    label="Book Your Stays"
                    className="w-full"
                    testId="button-book-stays"
                  />
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

          {/* Transportation Costs Section */}
          <Card data-testid="card-transportation-costs">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <ChevronRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Transportation Costs</CardTitle>
                    <CardDescription>Plan how you'll get around during your trip</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedTransportCost.allSelected ? "default" : "secondary"}>
                    {Object.values(selectedTransport).filter(Boolean).length} of {transportSegments.length} selected
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transportation Cost Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Total Transportation Costs</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          {selectedTransportCost.allSelected 
                            ? "This is the sum of your selected transport options."
                            : "This is an AI estimate based on typical transport costs. Select specific options below for exact pricing."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-transport-cost">
                    ${finalTransportCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedTransportCost.allSelected ? "from your selections" : "AI estimated"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Savings Allocated</p>
                  </div>
                  <p className={`text-2xl font-bold ${savingsAllocatedToTransport >= finalTransportCost ? 'text-green-600' : ''}`} data-testid="text-transport-savings">
                    ${savingsAllocatedToTransport.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (after flights & accommodation)
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Amount Still Needed</p>
                  </div>
                  <p className={`text-2xl font-bold ${transportSavingsGap === 0 ? 'text-green-600' : 'text-amber-600'}`} data-testid="text-transport-gap">
                    {transportSavingsGap === 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-5 h-5" />
                        $0
                      </span>
                    ) : (
                      `$${transportSavingsGap.toLocaleString()}`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transportSavingsGap === 0 ? 'Transportation covered!' : 'to save for transport'}
                  </p>
                </div>
              </div>

              {/* Transport Savings Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transportation Savings Progress</span>
                  <span className="font-medium">{transportSavingsProgress.toFixed(0)}% saved</span>
                </div>
                <Progress value={transportSavingsProgress} className="h-3" />
              </div>

              <Separator />

              {/* Transport Segments */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Choose Your Transport</h3>
                
                {transportSegments.length > 0 ? (
                  transportSegments.map((segment, idx) => {
                    const selectedId = selectedTransport[segment.id];
                    const selectedOption = selectedId
                      ? segment.options.find(opt => opt.id === selectedId)
                      : null;
                    
                    return (
                      <div 
                        key={segment.id} 
                        className="p-4 rounded-lg border bg-muted/20"
                        data-testid={`transport-segment-${idx}`}
                      >
                        {/* Segment Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              segment.segmentType === "airport-arrival" || segment.segmentType === "airport-departure"
                                ? "bg-blue-500 text-white"
                                : segment.segmentType === "city-to-city"
                                ? "bg-purple-500 text-white"
                                : "bg-green-500 text-white"
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{segment.fromLocation}</h4>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                <h4 className="font-semibold">{segment.toLocation}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {getSegmentTypeLabel(segment.segmentType)}
                              </p>
                            </div>
                          </div>
                          {selectedOption && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              ${selectedOption.cost}
                            </Badge>
                          )}
                        </div>

                        {/* Transport Options */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {segment.options.map((option) => {
                            const isSelected = selectedId === option.id;
                            
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
                                onClick={() => handleSelectTransport(segment.id, option.id)}
                                data-testid={`transport-option-${option.id}`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {getTransportTypeName(option.type)}
                                  </Badge>
                                  {isSelected && (
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                                <h5 className="font-medium text-sm mb-1">{option.name}</h5>
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {option.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {option.duration}
                                  </div>
                                </div>
                                <div className="flex items-end justify-between">
                                  <p className="text-lg font-bold">${option.cost}</p>
                                </div>
                                {isSelected ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-3 gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectTransport(segment.id, option.id);
                                    }}
                                    data-testid={`button-change-transport-${option.id}`}
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
                                      handleSelectTransport(segment.id, option.id);
                                    }}
                                    data-testid={`button-select-transport-${option.id}`}
                                  >
                                    Select This Option
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
                                  data-testid={`button-view-transport-${option.id}`}
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
                    <ChevronRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No destinations added yet. Add destinations to see transport options.</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Booking Info Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earliest Date to Book */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Earliest Date to Book Transport</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Based on needing ${totalFlightsAccomTransport.toLocaleString()} total for flights, accommodations, and transport.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={`text-lg font-bold flex items-center gap-1 ${canBookTransportNow ? 'text-green-600' : ''}`} data-testid="text-earliest-transport-date">
                    <CalendarIcon className="w-4 h-4" />
                    {canBookTransportNow 
                      ? "Ready now!" 
                      : earliestTransportBookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }
                  </p>
                  {!canBookTransportNow && monthsToAllBookings > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthsToAllBookings} month{monthsToAllBookings > 1 ? 's' : ''} away
                    </p>
                  )}
                </div>

                {/* Book Transport Button - Uses centralized budget calculations */}
                <div className="p-4 rounded-lg bg-muted/50 border flex flex-col justify-center">
                  <BookingButton
                    category="transportation"
                    isFunded={tripBudget.categories.transportation.isFunded}
                    monthsToFund={tripBudget.categories.transportation.monthsToFund}
                    earliestDate={tripBudget.categories.transportation.earliestBookingDate}
                    label="Book Transportation"
                    className="w-full"
                    testId="button-book-transport"
                  />
                </div>
              </div>

              {/* Helper Text */}
              {!canBookTransportNow && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-medium">We recommend waiting until {earliestTransportBookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> so you can book transportation without going into debt. 
                      At your current savings rate, you'll have enough for flights, accommodations, and transport by then.
                    </p>
                  </div>
                </div>
              )}

              {canBookTransportNow && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <span className="font-medium">You're ready to book!</span> You have enough saved to cover flights (${estimatedFlightCost.toLocaleString()}), accommodations (${finalAccommodationCost.toLocaleString()}), and transportation (${finalTransportCost.toLocaleString()}). 
                      Book now to secure your travel arrangements.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fun & Activities Section */}
          <Card data-testid="card-activities-costs">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Fun & Activities</CardTitle>
                    <CardDescription>{getActivityPaceDescription(activityPace)}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedActivityStats.totalCount > 0 ? "default" : "secondary"}>
                    {selectedActivityStats.totalCount} of {selectedActivityStats.totalAvailable} selected
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Cost Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Total Activities Cost</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          {selectedActivityStats.totalCount > 0 
                            ? "This is the sum of your selected activities."
                            : "This is an AI estimate. Select activities below for exact pricing."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-activity-cost">
                    ${finalActivityCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedActivityStats.totalCount > 0 ? "from your selections" : "AI estimated"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Savings Allocated</p>
                  </div>
                  <p className={`text-2xl font-bold ${savingsAllocatedToActivities >= finalActivityCost ? 'text-green-600' : ''}`} data-testid="text-activity-savings">
                    ${savingsAllocatedToActivities.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (after flights, stays & transport)
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Amount Still Needed</p>
                  </div>
                  <p className={`text-2xl font-bold ${activitySavingsGap === 0 ? 'text-green-600' : 'text-amber-600'}`} data-testid="text-activity-gap">
                    {activitySavingsGap === 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-5 h-5" />
                        $0
                      </span>
                    ) : (
                      `$${activitySavingsGap.toLocaleString()}`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activitySavingsGap === 0 ? 'Activities covered!' : 'to save for activities'}
                  </p>
                </div>
              </div>

              {/* Activity Savings Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Activity Savings Progress</span>
                  <span className="font-medium">{activitySavingsProgress.toFixed(0)}% saved</span>
                </div>
                <Progress value={activitySavingsProgress} className="h-3" />
              </div>

              <Separator />

              {/* Activities by City and Day */}
              <div className="space-y-8">
                <h3 className="font-semibold text-lg">Choose Your Adventures</h3>
                
                {displayedDestinationDetails && displayedDestinationDetails.length > 0 ? (
                  displayedDestinationDetails.map((dest, destIdx) => {
                    const cityActivities = activitiesByCity[dest.cityName] || [];
                    
                    return (
                      <div 
                        key={dest.cityName} 
                        className="space-y-4"
                        data-testid={`activity-city-${destIdx}`}
                      >
                        {/* City Header */}
                        <div className="flex items-center gap-3 pb-2 border-b">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                            {destIdx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{dest.cityName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {dest.countryName} • {dest.numberOfNights} night{dest.numberOfNights > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Days in this city */}
                        {cityActivities.map((day) => {
                          const selectedCount = day.activities.filter(a => 
                            selectedActivities[`${dest.cityName}-${day.dayNumber}-${a.id}`]
                          ).length;
                          
                          return (
                            <div 
                              key={`${dest.cityName}-day-${day.dayNumber}`}
                              className="p-4 rounded-lg border bg-muted/20"
                              data-testid={`activity-day-${destIdx}-${day.dayNumber}`}
                            >
                              {/* Day Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">Day {day.dayNumber} in {dest.cityName}</span>
                                </div>
                                {selectedCount > 0 && (
                                  <Badge variant="default" className="gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {selectedCount} selected
                                  </Badge>
                                )}
                              </div>

                              {/* Activities for this day */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {day.activities.map((activity) => {
                                  const activityKey = `${dest.cityName}-${day.dayNumber}-${activity.id}`;
                                  const isSelected = selectedActivities[activityKey] || false;
                                  
                                  return (
                                    <div
                                      key={activity.id}
                                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                          : 'bg-background hover-elevate'
                                      }`}
                                      onClick={() => handleToggleActivity(dest.cityName, day.dayNumber, activity.id)}
                                      data-testid={`activity-option-${activity.id}`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityTypeColor(activity.type)}`}>
                                          {getActivityTypeLabel(activity.type)}
                                        </span>
                                        {isSelected ? (
                                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                                        )}
                                      </div>
                                      <h5 className="font-medium text-sm mb-1">{activity.name}</h5>
                                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                        {activity.description}
                                      </p>
                                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {activity.duration}
                                        </div>
                                        <span className="font-bold text-sm text-foreground">
                                          {activity.cost === 0 ? 'Free' : `$${activity.cost}`}
                                        </span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-1 gap-1 text-muted-foreground text-xs h-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(activity.url, '_blank');
                                        }}
                                        data-testid={`button-view-activity-${activity.id}`}
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Learn More
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No destinations added yet. Add destinations to see activity options.</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Booking Info Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earliest Date to Book */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Earliest Date to Book Activities</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Based on needing ${totalFlightsAccomTransportActivities.toLocaleString()} total for flights, accommodations, transport, and activities.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={`text-lg font-bold flex items-center gap-1 ${canBookActivitiesNow ? 'text-green-600' : ''}`} data-testid="text-earliest-activity-date">
                    <CalendarIcon className="w-4 h-4" />
                    {canBookActivitiesNow 
                      ? "Ready now!" 
                      : earliestActivityBookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }
                  </p>
                  {!canBookActivitiesNow && monthsToAllIncludingActivities > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthsToAllIncludingActivities} month{monthsToAllIncludingActivities > 1 ? 's' : ''} away
                    </p>
                  )}
                </div>

                {/* Book Activities Button - Uses centralized budget calculations */}
                <div className="p-4 rounded-lg bg-muted/50 border flex flex-col justify-center">
                  <BookingButton
                    category="activities"
                    isFunded={tripBudget.categories.activities.isFunded}
                    monthsToFund={tripBudget.categories.activities.monthsToFund}
                    earliestDate={tripBudget.categories.activities.earliestBookingDate}
                    label="Book Activities"
                    className="w-full"
                    testId="button-book-activities"
                  />
                </div>
              </div>

              {/* Helper Text */}
              {!canBookActivitiesNow && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-medium">We recommend waiting until {earliestActivityBookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> so you can book activities without going into debt. 
                      At your current savings rate, you'll have enough for all travel expenses by then.
                    </p>
                  </div>
                </div>
              )}

              {canBookActivitiesNow && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <span className="font-medium">You're ready to book!</span> You have enough saved to cover flights, accommodations, transportation, and ${finalActivityCost.toLocaleString()} in activities. 
                      Start reserving your adventures now!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Food Costs Section */}
          <Card data-testid="card-food-costs">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Utensils className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Food Costs</CardTitle>
                    <CardDescription>Plan your dining experiences and budget</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {foodBudgetMode === "selections" && selectedFoodStats.totalCount > 0 && (
                    <Badge variant="default">
                      {selectedFoodStats.restaurantCount} restaurants, {selectedFoodStats.experienceCount} experiences
                    </Badge>
                  )}
                  {foodBudgetMode === "daily" && (
                    <Badge variant="secondary">
                      ${dailyFoodBudget}/day/person
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Budget Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                <div>
                  <p className="font-medium">How would you like to budget for food?</p>
                  <p className="text-sm text-muted-foreground">
                    {foodBudgetMode === "selections" 
                      ? "Pick specific restaurants and experiences for accurate costs"
                      : "Set a daily budget for a quick estimate"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={foodBudgetMode === "selections" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFoodBudgetMode("selections")}
                    data-testid="button-food-mode-selections"
                  >
                    Pick Restaurants
                  </Button>
                  <Button
                    variant={foodBudgetMode === "daily" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFoodBudgetMode("daily")}
                    data-testid="button-food-mode-daily"
                  >
                    Daily Budget
                  </Button>
                </div>
              </div>

              {/* Daily Budget Slider (when in daily mode) */}
              {foodBudgetMode === "daily" && (
                <div className="p-4 rounded-lg border bg-background space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Daily Food Budget</p>
                      <p className="text-sm text-muted-foreground">Per person, per day (meals + snacks)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" data-testid="text-daily-food-budget">${dailyFoodBudget}</p>
                      <p className="text-xs text-muted-foreground">per person/day</p>
                    </div>
                  </div>
                  <Slider
                    value={[dailyFoodBudget]}
                    onValueChange={(value) => setDailyFoodBudget(value[0])}
                    min={25}
                    max={200}
                    step={5}
                    className="py-2"
                    data-testid="slider-daily-food-budget"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$25 (Budget)</span>
                    <span>$75 (Moderate)</span>
                    <span>$125 (Upscale)</span>
                    <span>$200 (Luxury)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Total food estimate: </span>
                      ${finalFoodCost.toLocaleString()} 
                      <span className="text-muted-foreground ml-1">
                        ({tripDuration} days × {numberOfTravelers} traveler{numberOfTravelers > 1 ? 's' : ''} × ${dailyFoodBudget}/day)
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Food Cost Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Total Food Costs</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          {foodBudgetMode === "daily" 
                            ? "Calculated from your daily budget setting."
                            : selectedFoodStats.totalCount > 0 
                              ? "Sum of your selected restaurants and experiences."
                              : "AI estimate based on typical food costs. Select options below for exact pricing."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-food-cost">
                    ${finalFoodCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {foodBudgetMode === "daily" 
                      ? "from daily budget" 
                      : selectedFoodStats.totalCount > 0 
                        ? "from your selections" 
                        : "AI estimated"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Savings Allocated</p>
                  </div>
                  <p className={`text-2xl font-bold ${savingsAllocatedToFood >= finalFoodCost ? 'text-green-600' : ''}`} data-testid="text-food-savings">
                    ${savingsAllocatedToFood.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (after other expenses)
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Amount Still Needed</p>
                  </div>
                  <p className={`text-2xl font-bold ${foodSavingsGap === 0 ? 'text-green-600' : 'text-amber-600'}`} data-testid="text-food-gap">
                    {foodSavingsGap === 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-5 h-5" />
                        $0
                      </span>
                    ) : (
                      `$${foodSavingsGap.toLocaleString()}`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {foodSavingsGap === 0 ? 'Food budget covered!' : 'to save for dining'}
                  </p>
                </div>
              </div>

              {/* Food Savings Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Food Budget Progress</span>
                  <span className="font-medium">{foodSavingsProgress.toFixed(0)}% saved</span>
                </div>
                <Progress value={foodSavingsProgress} className="h-3" />
              </div>

              {foodBudgetMode === "selections" && (
                <>
                  <Separator />

                  {/* Food Options by City and Day */}
                  <div className="space-y-8">
                    <h3 className="font-semibold text-lg">Plan Your Dining</h3>
                    
                    {displayedDestinationDetails && displayedDestinationDetails.length > 0 ? (
                      displayedDestinationDetails.map((dest, destIdx) => {
                        const cityFoodOptions = foodOptionsByCity[dest.cityName] || [];
                        
                        return (
                          <div 
                            key={dest.cityName} 
                            className="space-y-4"
                            data-testid={`food-city-${destIdx}`}
                          >
                            {/* City Header */}
                            <div className="flex items-center gap-3 pb-2 border-b">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white text-lg font-bold">
                                {destIdx + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg">{dest.cityName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {dest.countryName} • {dest.numberOfNights} night{dest.numberOfNights > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>

                            {/* Days in this city */}
                            {cityFoodOptions.map((day) => {
                              const selectedCount = day.options.filter(opt => 
                                selectedFoodOptions[`${dest.cityName}-${day.dayNumber}-${opt.id}`]
                              ).length;
                              
                              // Separate restaurants from experiences
                              const restaurants = day.options.filter(opt => opt.type === "restaurant");
                              const experiences = day.options.filter(opt => opt.type !== "restaurant");
                              
                              return (
                                <div 
                                  key={`${dest.cityName}-day-${day.dayNumber}`}
                                  className="p-4 rounded-lg border bg-muted/20"
                                  data-testid={`food-day-${destIdx}-${day.dayNumber}`}
                                >
                                  {/* Day Header */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">Day {day.dayNumber} in {dest.cityName}</span>
                                    </div>
                                    {selectedCount > 0 && (
                                      <Badge variant="default" className="gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {selectedCount} selected
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Restaurants Section */}
                                  <div className="mb-4">
                                    <h5 className="text-sm font-medium text-muted-foreground mb-3">Restaurants</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {restaurants.map((option) => {
                                        const optionKey = `${dest.cityName}-${day.dayNumber}-${option.id}`;
                                        const isSelected = selectedFoodOptions[optionKey] || false;
                                        
                                        return (
                                          <div
                                            key={option.id}
                                            className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                              isSelected 
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                : 'bg-background hover-elevate'
                                            }`}
                                            onClick={() => handleToggleFoodOption(dest.cityName, day.dayNumber, option.id)}
                                            data-testid={`food-option-${option.id}`}
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getFoodTypeColor(option.type)}`}>
                                                  {getFoodTypeLabel(option.type)}
                                                </span>
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  {option.priceRange}
                                                </span>
                                              </div>
                                              {isSelected ? (
                                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                                              ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                                              )}
                                            </div>
                                            <h5 className="font-medium text-sm mb-1">{option.name}</h5>
                                            <p className="text-xs text-muted-foreground mb-2">
                                              {option.cuisine}
                                            </p>
                                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                              {option.description}
                                            </p>
                                            {option.reservationRequired && (
                                              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mb-2">
                                                <Clock className="w-3 h-3" />
                                                <span>Reserve {option.reservationAdvance}</span>
                                              </div>
                                            )}
                                            <div className="flex items-end justify-between">
                                              <span className="font-bold text-sm">
                                                ${option.estimatedCost}/person
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs gap-1 text-muted-foreground"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.open(option.url, '_blank');
                                                }}
                                                data-testid={`button-view-food-${option.id}`}
                                              >
                                                <ExternalLink className="w-3 h-3" />
                                                View
                                              </Button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Food Experiences Section */}
                                  {experiences.length > 0 && (
                                    <div>
                                      <h5 className="text-sm font-medium text-muted-foreground mb-3">Food Experiences</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {experiences.map((option) => {
                                          const optionKey = `${dest.cityName}-${day.dayNumber}-${option.id}`;
                                          const isSelected = selectedFoodOptions[optionKey] || false;
                                          
                                          return (
                                            <div
                                              key={option.id}
                                              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                                isSelected 
                                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                  : 'bg-background hover-elevate'
                                              }`}
                                              onClick={() => handleToggleFoodOption(dest.cityName, day.dayNumber, option.id)}
                                              data-testid={`food-option-${option.id}`}
                                            >
                                              <div className="flex items-start justify-between mb-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getFoodTypeColor(option.type)}`}>
                                                  {getFoodTypeLabel(option.type)}
                                                </span>
                                                {isSelected ? (
                                                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                                                ) : (
                                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                                                )}
                                              </div>
                                              <h5 className="font-medium text-sm mb-1">{option.name}</h5>
                                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                                {option.description}
                                              </p>
                                              {option.reservationRequired && (
                                                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mb-2">
                                                  <Clock className="w-3 h-3" />
                                                  <span>Reserve {option.reservationAdvance}</span>
                                                </div>
                                              )}
                                              <div className="flex items-end justify-between">
                                                <span className="font-bold text-sm">
                                                  ${option.estimatedCost}/person
                                                </span>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 text-xs gap-1 text-muted-foreground"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(option.url, '_blank');
                                                  }}
                                                  data-testid={`button-view-experience-${option.id}`}
                                                >
                                                  <ExternalLink className="w-3 h-3" />
                                                  View
                                                </Button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No destinations added yet. Add destinations to see dining options.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Booking Info Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earliest Date to Plan */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Earliest Date to Plan Dining</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Based on needing ${totalAllCategories.toLocaleString()} total for all trip expenses including food.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={`text-lg font-bold flex items-center gap-1 ${canPlanFoodNow ? 'text-green-600' : ''}`} data-testid="text-earliest-food-date">
                    <CalendarIcon className="w-4 h-4" />
                    {canPlanFoodNow 
                      ? "Ready now!" 
                      : earliestFoodPlanningDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }
                  </p>
                  {!canPlanFoodNow && monthsToAllIncludingFood > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthsToAllIncludingFood} month{monthsToAllIncludingFood > 1 ? 's' : ''} away
                    </p>
                  )}
                </div>

                {/* Plan Dining Button - Uses centralized budget calculations */}
                <div className="p-4 rounded-lg bg-muted/50 border flex flex-col justify-center">
                  <BookingButton
                    category="food"
                    isFunded={tripBudget.categories.food.isFunded}
                    monthsToFund={tripBudget.categories.food.monthsToFund}
                    earliestDate={tripBudget.categories.food.earliestBookingDate}
                    label="Plan Dining"
                    className="w-full"
                    testId="button-plan-dining"
                  />
                </div>
              </div>

              {/* Helper Text */}
              {!canPlanFoodNow && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-medium">We recommend waiting until {earliestFoodPlanningDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> so you can plan dining without going into debt. 
                      At your current savings rate, you'll have enough for all trip expenses by then.
                    </p>
                  </div>
                </div>
              )}

              {canPlanFoodNow && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <span className="font-medium">You're ready to plan!</span> You have enough saved to cover all travel expenses including ${finalFoodCost.toLocaleString()} for dining. 
                      Start making reservations at your favorite spots!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trip Preparation Section */}
          <Card data-testid="card-trip-preparation">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <Briefcase className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Trip Preparation</CardTitle>
                    <CardDescription>Gear, supplies, and travel essentials</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {prepStats.alreadyOwnCount > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="w-3 h-3" />
                      {prepStats.alreadyOwnCount} owned
                    </Badge>
                  )}
                  {prepStats.needToBuyCount > 0 && (
                    <Badge variant="default" className="gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      {prepStats.needToBuyCount} to buy
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warning Banner */}
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Wait Before Buying</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      We recommend waiting to buy gear until you have enough money saved for your trip, to avoid going into debt. 
                      Use this checklist to plan ahead and mark items you already own.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prep Cost Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Estimated Prep Cost</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Total cost of items marked as "Need to buy". Mark items you already own to reduce this.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-prep-cost">
                    ${prepStats.totalCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    from {prepStats.needToBuyCount} item{prepStats.needToBuyCount !== 1 ? 's' : ''} to buy
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Already Own</p>
                  </div>
                  <p className={`text-2xl font-bold ${prepStats.alreadyOwnCount > 0 ? 'text-green-600' : ''}`} data-testid="text-prep-owned">
                    {prepStats.alreadyOwnCount} item{prepStats.alreadyOwnCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {prepStats.totalItems} total
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Not Yet Marked</p>
                  </div>
                  <p className={`text-2xl font-bold ${prepStats.unmarkedCount === 0 ? 'text-green-600' : 'text-muted-foreground'}`} data-testid="text-prep-unmarked">
                    {prepStats.unmarkedCount} item{prepStats.unmarkedCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {prepStats.unmarkedCount === 0 ? 'All items reviewed!' : 'still to review'}
                  </p>
                </div>
              </div>

              {/* Cost breakdown by priority */}
              {prepStats.needToBuyCount > 0 && (
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <p className="text-sm font-medium mb-3">Shopping List Breakdown</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400 mb-1">Essential</p>
                      <p className="font-bold">${prepStats.essentialCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Recommended</p>
                      <p className="font-bold">${prepStats.recommendedCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Optional</p>
                      <p className="font-bold">${prepStats.optionalCost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Preparation Checklist by Category */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Preparation Checklist</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on your {getSeasonDisplay(itinerary?.travelSeason || travelSeason).toLowerCase()} trip
                  </p>
                </div>
                
                {Object.entries(prepItemsByCategory).map(([category, items]) => {
                  const categoryIcon = {
                    luggage: Package,
                    clothing: Shirt,
                    electronics: Zap,
                    toiletries: Droplets,
                    gear: Compass,
                    documents: FileText
                  }[category as PrepItem["category"]] || Package;
                  
                  const CategoryIcon = categoryIcon;
                  
                  return (
                    <div 
                      key={category}
                      className="space-y-3"
                      data-testid={`prep-category-${category}`}
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <div className={`p-1.5 rounded ${getPrepCategoryColor(category as PrepItem["category"])}`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <h4 className="font-medium">{getPrepCategoryLabel(category as PrepItem["category"])}</h4>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {/* Items in this category */}
                      <div className="space-y-2">
                        {items.map((item) => {
                          const status = prepItemStatus[item.id];
                          const priorityBadge = getPriorityBadge(item.priority);
                          
                          return (
                            <div
                              key={item.id}
                              className={`p-4 rounded-lg border transition-all ${
                                status === "own" 
                                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                                  : status === "need"
                                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                                    : 'bg-background'
                              }`}
                              data-testid={`prep-item-${item.id}`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h5 className="font-medium">{item.name}</h5>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge.className}`}>
                                      {priorityBadge.label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {item.description}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-sm">
                                      ~${item.estimatedCost}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs gap-1 text-muted-foreground"
                                      onClick={() => window.open(item.url, '_blank')}
                                      data-testid={`button-view-prep-${item.id}`}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View Example
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Own/Need Toggle Buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button
                                    variant={status === "own" ? "default" : "outline"}
                                    size="sm"
                                    className={`gap-1 ${status === "own" ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                    onClick={() => handleTogglePrepStatus(item.id, "own")}
                                    data-testid={`button-own-${item.id}`}
                                  >
                                    <Check className="w-3 h-3" />
                                    Already Own
                                  </Button>
                                  <Button
                                    variant={status === "need" ? "default" : "outline"}
                                    size="sm"
                                    className={`gap-1 ${status === "need" ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                                    onClick={() => handleTogglePrepStatus(item.id, "need")}
                                    data-testid={`button-need-${item.id}`}
                                  >
                                    <ShoppingCart className="w-3 h-3" />
                                    Need to Buy
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {prepItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No destinations added yet. Add destinations to see preparation suggestions.</p>
                  </div>
                )}
              </div>

              {/* Summary Box */}
              {prepStats.needToBuyCount > 0 && (
                <>
                  <Separator />
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-start gap-3">
                      <ShoppingCart className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Your Shopping List</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          You've identified {prepStats.needToBuyCount} item{prepStats.needToBuyCount !== 1 ? 's' : ''} to purchase 
                          for an estimated total of <span className="font-bold">${prepStats.totalCost.toLocaleString()}</span>. 
                          Consider purchasing essential items first ($
                          {prepStats.essentialCost.toLocaleString()}) and optional items as your budget allows.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {prepStats.unmarkedCount === 0 && prepStats.totalItems > 0 && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <span className="font-medium">Checklist complete!</span> You've reviewed all {prepStats.totalItems} preparation items. 
                      {prepStats.alreadyOwnCount > 0 && ` You already own ${prepStats.alreadyOwnCount} item${prepStats.alreadyOwnCount !== 1 ? 's' : ''}.`}
                      {prepStats.needToBuyCount > 0 && ` ${prepStats.needToBuyCount} item${prepStats.needToBuyCount !== 1 ? 's' : ''} to purchase for $${prepStats.totalCost.toLocaleString()}.`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Books & Movies Section */}
          <Card data-testid="card-books-movies">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <BookOpen className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Books & Movies to Get Ready</CardTitle>
                    <CardDescription>Discover stories, history, and culture from your destinations</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="gap-1">
                    <BookOpen className="w-3 h-3" />
                    {mediaRecommendations.filter(m => m.type === "book" || m.type === "travel-guide").length} books
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Film className="w-3 h-3" />
                    {mediaRecommendations.filter(m => m.type === "movie" || m.type === "documentary" || m.type === "tv-series").length} films
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Intro Text */}
              <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/30">
                <p className="text-sm text-violet-700 dark:text-violet-300">
                  Get excited for your trip with books and movies that bring your destinations to life. 
                  Learn about the history, culture, and stories of the places you'll visit—perfect for the whole family!
                </p>
              </div>

              {/* Age Groups */}
              {["kids", "teens", "adults", "all-ages"].map((ageGroup) => {
                const items = mediaByAgeGroup[ageGroup as keyof typeof mediaByAgeGroup];
                if (items.length === 0) return null;
                
                return (
                  <div key={ageGroup} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getAgeGroupColor(ageGroup as MediaRecommendation["ageGroup"])}>
                        {getAgeGroupLabel(ageGroup as MediaRecommendation["ageGroup"])}
                      </Badge>
                      <Separator className="flex-1" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <div 
                          key={item.id}
                          className="p-4 rounded-lg border hover-elevate transition-all"
                          data-testid={`media-item-${item.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${getMediaTypeColor(item.type)}`}>
                              {item.type === "book" && <BookOpen className="w-4 h-4" />}
                              {item.type === "movie" && <Film className="w-4 h-4" />}
                              {item.type === "documentary" && <Play className="w-4 h-4" />}
                              {item.type === "tv-series" && <Tv className="w-4 h-4" />}
                              {item.type === "travel-guide" && <Map className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-medium text-sm leading-tight">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.creator} {item.year && `(${item.year})`}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {getMediaTypeLabel(item.type)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {item.description}
                              </p>
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed">
                                <span className="text-xs text-muted-foreground italic">
                                  {item.relevance}
                                </span>
                                <a 
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  data-testid={`link-media-${item.id}`}
                                >
                                  {item.type === "book" || item.type === "travel-guide" ? "Buy" : "Watch"}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {mediaRecommendations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No destinations added yet. Add destinations to see book and movie recommendations.</p>
                </div>
              )}

              {/* Summary Box */}
              {mediaRecommendations.length > 0 && (
                <>
                  <Separator />
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Get Inspired Before You Go</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          These {mediaRecommendations.length} recommendations include history, travel guides, and cultural stories 
                          to help your whole family connect with your destinations before you arrive. 
                          Consider borrowing from your local library or streaming services you already have!
                        </p>
                      </div>
                    </div>
                  </div>
                </>
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
