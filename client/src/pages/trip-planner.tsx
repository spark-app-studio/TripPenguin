import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { TripWithDetails, InsertTrip, Trip, StaycationRecommendation } from "@shared/schema";
import Step1Dream from "./step1-dream";
import Step2Plan from "./step2-plan";
import Step3Book from "./step3-book";
import TripSummary from "./trip-summary";

type Step = "dream" | "plan" | "book" | "summary";

interface TripPlanData {
  step1?: {
    travelers: string;
    numberOfTravelers: number;
    travelSeason: string;
    tripDuration: number;
    selectedDestinations: Array<{
      cityName: string;
      countryName: string;
      imageUrl: string;
      numberOfNights: number;
    }>;
  };
  step2?: {
    flights: { cost: string; notes: string; usePoints: boolean };
    housing: { cost: string; notes: string };
    food: { cost: string; notes: string };
    transportation: { cost: string; notes: string };
    fun: { cost: string; notes: string };
    preparation: { cost: string; notes: string };
    monthlySavings: string;
    currentSavings: string;
    creditCardPoints: string;
  };
  step3?: Array<{
    id: string;
    itemName: string;
    category: string;
    status: "not_started" | "in_progress" | "booked";
    estimatedCost: number;
    actualCost?: number;
  }>;
}

export default function TripPlanner() {
  const [, params] = useRoute("/trip/:id");
  const [, setLocation] = useLocation();
  const tripId = params?.id === "new" ? null : (params?.id || null);
  
  // Check if coming from quiz flow
  const [isQuizFlow] = useState<boolean>(() => {
    const tripSource = sessionStorage.getItem("tripSource");
    if (tripSource === "quiz") {
      sessionStorage.removeItem("tripSource");
      return true;
    }
    return false;
  });
  
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    return isQuizFlow ? "plan" : "dream";
  });
  
  // Track whether Step 2 has been submitted (for quiz flow budget preservation)
  const [step2Submitted, setStep2Submitted] = useState(false);
  
  // Helper function to normalize season from AI response to radio button values
  const normalizeSeason = (season: string | undefined): string => {
    if (!season) return "summer";
    
    const normalized = season.toLowerCase().trim();
    
    // Direct matches
    if (["summer", "winter", "thanksgiving", "spring", "off_season"].includes(normalized)) {
      return normalized;
    }
    
    // Year-round / Anytime phrases
    if (normalized.includes("year") || normalized.includes("anytime") || normalized.includes("any time") || 
        normalized.includes("flexible") || normalized.includes("all season")) {
      return "off_season";
    }
    
    // Summer (June, July, August)
    if (normalized.includes("summer") || normalized.includes("june") || normalized.includes("july") || normalized.includes("august")) {
      return "summer";
    }
    
    // Winter / December-February
    if (normalized.includes("winter") || normalized.includes("december") || 
        normalized.includes("january") || normalized.includes("february")) {
      return "winter";
    }
    
    // Thanksgiving / November
    if (normalized.includes("thanksgiving") || normalized.includes("november")) {
      return "thanksgiving";
    }
    
    // Spring (March, April, May)
    if (normalized.includes("spring") || normalized.includes("march") || 
        normalized.includes("april") || normalized.includes("may")) {
      return "spring";
    }
    
    // Fall/Autumn (September, October)
    if (normalized.includes("fall") || normalized.includes("autumn") || 
        normalized.includes("september") || normalized.includes("october")) {
      return "off_season";
    }
    
    // Default fallback
    return "summer";
  };
  
  // Helper function to convert trip length preference to days
  const convertTripLengthToDays = (preference: string): number => {
    const lengthMap: Record<string, number> = {
      "1-3 days": 3,
      "4-7 days": 7,
      "1-2 weeks": 10,
      "2-3 weeks": 17,
      "3+ weeks": 21,
      "flexible": 7,
    };
    return lengthMap[preference] || 7;
  };

  // Initialize tripData with quiz itinerary if available (lazy initialization)
  const [tripData, setTripData] = useState<TripPlanData>(() => {
    // Only hydrate from sessionStorage for new trips (not editing existing trips)
    if (!tripId) {
      // Check for multi-city itinerary first (new format)
      const selectedItineraryJson = sessionStorage.getItem("selectedItinerary");
      if (selectedItineraryJson) {
        try {
          const itinerary = JSON.parse(selectedItineraryJson);
          sessionStorage.removeItem("selectedItinerary");
          
          // Get quiz data for numberOfTravelers and tripLength
          const quizNumberOfTravelers = sessionStorage.getItem("quizNumberOfTravelers");
          const quizTripLength = sessionStorage.getItem("quizTripLength");
          
          // Clean up quiz data from sessionStorage
          sessionStorage.removeItem("quizNumberOfTravelers");
          sessionStorage.removeItem("quizTripLength");
          
          const numberOfTravelers = quizNumberOfTravelers ? parseInt(quizNumberOfTravelers, 10) : 1;
          
          // Determine travelers radio value based on numberOfTravelers
          const travelersValue = numberOfTravelers === 1 ? "just_me" : "with_others";
          
          // Convert itinerary cities to destinations
          const selectedDestinations = itinerary.cities.map((city: any) => ({
            cityName: city.cityName,
            countryName: city.countryName,
            imageUrl: "",
            numberOfNights: city.stayLengthNights,
          }));
          
          // Pre-populate budget categories from cost breakdown
          const step2Data = {
            flights: { 
              cost: itinerary.costBreakdown.flights?.toString() || "0",
              notes: "",
              usePoints: false 
            },
            housing: { 
              cost: itinerary.costBreakdown.housing?.toString() || "0",
              notes: ""
            },
            food: { 
              cost: itinerary.costBreakdown.food?.toString() || "0",
              notes: ""
            },
            transportation: { 
              cost: itinerary.costBreakdown.transportation?.toString() || "0",
              notes: ""
            },
            fun: { 
              cost: itinerary.costBreakdown.fun?.toString() || "0",
              notes: ""
            },
            preparation: { 
              cost: itinerary.costBreakdown.preparation?.toString() || "0",
              notes: ""
            },
            monthlySavings: "0",
            currentSavings: "0",
            creditCardPoints: "0",
          };
          
          return {
            step1: {
              travelers: travelersValue,
              numberOfTravelers: numberOfTravelers,
              travelSeason: normalizeSeason(itinerary.bestTimeToVisit),
              tripDuration: itinerary.totalNights || 7,
              selectedDestinations: selectedDestinations,
            },
            step2: step2Data,
          };
        } catch (error) {
          console.error("Failed to parse selected itinerary:", error);
        }
      }
      
      // Check for staycation
      const selectedStaycationJson = sessionStorage.getItem("selectedStaycation");
      if (selectedStaycationJson) {
        try {
          const staycation = JSON.parse(selectedStaycationJson) as StaycationRecommendation;
          sessionStorage.removeItem("selectedStaycation");
          sessionStorage.removeItem("tripType");
          
          // Get quiz data for numberOfTravelers
          const quizNumberOfTravelers = sessionStorage.getItem("quizNumberOfTravelers");
          sessionStorage.removeItem("quizNumberOfTravelers");
          
          const numberOfTravelers = quizNumberOfTravelers ? parseInt(quizNumberOfTravelers, 10) : 1;
          const travelersValue = numberOfTravelers === 1 ? "just_me" : "with_others";
          
          // Map staycation duration to days
          const durationToDays: Record<string, number> = {
            "afternoon": 1,
            "full-day": 1,
            "weekend": 2,
          };
          const tripDuration = durationToDays[staycation.tripDuration] || 1;
          
          // Map staycation cost breakdown to budget categories
          // Staycation has: gas, food, activities, parking, misc
          // Trip budget has: flights, housing, food, transportation, fun, preparation
          const step2Data = {
            flights: { 
              cost: "0", // No flights for staycation
              notes: "Local trip - no flights needed",
              usePoints: false 
            },
            housing: { 
              cost: "0", // Usually no housing for staycation unless weekend
              notes: staycation.tripDuration === "weekend" ? "Check if overnight stay is needed" : ""
            },
            food: { 
              cost: staycation.costBreakdown.food?.toString() || "0",
              notes: ""
            },
            transportation: { 
              cost: ((staycation.costBreakdown.gas || 0) + (staycation.costBreakdown.parking || 0)).toString(),
              notes: `Gas: $${staycation.costBreakdown.gas || 0}, Parking: $${staycation.costBreakdown.parking || 0}`
            },
            fun: { 
              cost: staycation.costBreakdown.activities?.toString() || "0",
              notes: ""
            },
            preparation: { 
              cost: staycation.costBreakdown.misc?.toString() || "0",
              notes: "Misc expenses"
            },
            monthlySavings: "0",
            currentSavings: "0",
            creditCardPoints: "0",
          };
          
          return {
            step1: {
              travelers: travelersValue,
              numberOfTravelers: numberOfTravelers,
              travelSeason: normalizeSeason(staycation.bestTimeToVisit),
              tripDuration: tripDuration,
              selectedDestinations: [{
                cityName: staycation.destination.name,
                countryName: "Local Staycation",
                imageUrl: "",
                numberOfNights: tripDuration,
              }],
            },
            step2: step2Data,
          };
        } catch (error) {
          console.error("Failed to parse selected staycation:", error);
        }
      }
      
      // Fallback to legacy single destination format
      const selectedDestinationJson = sessionStorage.getItem("selectedDestination");
      if (selectedDestinationJson) {
        try {
          const destination = JSON.parse(selectedDestinationJson);
          sessionStorage.removeItem("selectedDestination");
          
          // Get quiz data for numberOfTravelers and tripLength
          const quizNumberOfTravelers = sessionStorage.getItem("quizNumberOfTravelers");
          const quizTripLength = sessionStorage.getItem("quizTripLength");
          
          // Clean up quiz data from sessionStorage
          sessionStorage.removeItem("quizNumberOfTravelers");
          sessionStorage.removeItem("quizTripLength");
          
          const numberOfTravelers = quizNumberOfTravelers ? parseInt(quizNumberOfTravelers, 10) : 1;
          const tripDuration = quizTripLength ? convertTripLengthToDays(quizTripLength) : 7;
          
          // Determine travelers radio value based on numberOfTravelers
          const travelersValue = numberOfTravelers === 1 ? "just_me" : "with_others";
          
          return {
            step1: {
              travelers: travelersValue,
              numberOfTravelers: numberOfTravelers,
              travelSeason: normalizeSeason(destination.bestTimeToVisit),
              tripDuration: tripDuration,
              selectedDestinations: [{
                cityName: destination.cityName,
                countryName: destination.countryName,
                imageUrl: "",
                numberOfNights: tripDuration,
              }],
            },
          };
        } catch (error) {
          console.error("Failed to parse selected destination:", error);
        }
      }
    }
    return {};
  });
  const [currentTripId, setCurrentTripId] = useState<string | null>(tripId);

  // Load existing trip if editing
  const { data: existingTrip, isLoading } = useQuery<TripWithDetails>({
    queryKey: ["/api/trips", currentTripId],
    enabled: !!currentTripId && currentTripId !== "new",
  });

  // Populate local state from loaded trip
  useEffect(() => {
    if (existingTrip) {
      const step1Data = {
        travelers: existingTrip.travelers,
        numberOfTravelers: existingTrip.numberOfTravelers,
        travelSeason: existingTrip.travelSeason,
        tripDuration: existingTrip.tripDuration,
        selectedDestinations: existingTrip.destinations.map(d => ({
          cityName: d.cityName,
          countryName: d.countryName,
          imageUrl: d.imageUrl || "",
          numberOfNights: d.numberOfNights,
        })),
      };

      // Only overwrite step2 data if:
      // 1. Budget categories exist in the database, OR
      // 2. We don't have pre-populated data, OR  
      // 3. Step 2 has been submitted (so we should use backend data)
      // This preserves quiz-flow pre-populated budgets when the trip is freshly created
      const hasBudgetCategories = existingTrip.budgetCategories.length > 0;
      const hasPrePopulatedBudget = !step2Submitted && tripData.step2 && (
        parseFloat(tripData.step2.flights.cost || "0") > 0 ||
        parseFloat(tripData.step2.housing.cost || "0") > 0 ||
        parseFloat(tripData.step2.food.cost || "0") > 0
      );
      
      let step2Data = tripData.step2;
      if (hasBudgetCategories || !hasPrePopulatedBudget || step2Submitted) {
        step2Data = {
          flights: { 
            cost: existingTrip.budgetCategories.find(c => c.category === "flights")?.estimatedCost.toString() || "0",
            notes: existingTrip.budgetCategories.find(c => c.category === "flights")?.notes || "",
            usePoints: false 
          },
          housing: { 
            cost: existingTrip.budgetCategories.find(c => c.category === "housing")?.estimatedCost.toString() || "0",
            notes: existingTrip.budgetCategories.find(c => c.category === "housing")?.notes || ""
          },
          food: { 
            cost: existingTrip.budgetCategories.find(c => c.category === "food")?.estimatedCost.toString() || "0",
            notes: existingTrip.budgetCategories.find(c => c.category === "food")?.notes || ""
          },
          transportation: { 
            cost: existingTrip.budgetCategories.find(c => c.category === "transportation")?.estimatedCost.toString() || "0",
            notes: existingTrip.budgetCategories.find(c => c.category === "transportation")?.notes || ""
          },
          fun: { 
            cost: existingTrip.budgetCategories.find(c => c.category === "fun")?.estimatedCost.toString() || "0",
            notes: existingTrip.budgetCategories.find(c => c.category === "fun")?.notes || ""
          },
          preparation: { 
            cost: existingTrip.budgetCategories.find(c => c.category === "preparation")?.estimatedCost.toString() || "0",
            notes: existingTrip.budgetCategories.find(c => c.category === "preparation")?.notes || ""
          },
          monthlySavings: existingTrip.monthlySavingsAmount?.toString() || "0",
          currentSavings: existingTrip.currentSavings?.toString() || "0",
          creditCardPoints: "0",
        };
      }

      const step3Data = existingTrip.bookings.map(b => ({
        id: b.id,
        itemName: b.itemName,
        category: b.category,
        status: b.status as "not_started" | "in_progress" | "booked",
        estimatedCost: parseFloat(b.estimatedCost),
        actualCost: b.actualCost ? parseFloat(b.actualCost) : undefined,
      }));

      setTripData({ step1: step1Data, step2: step2Data, step3: step3Data });
      
      // Determine current step based on data completeness (but don't override quiz flow)
      if (!isQuizFlow) {
        if (step3Data.length > 0) {
          setCurrentStep("summary");
        } else if (step2Data && (step2Data.flights.cost !== "0" || step2Data.housing.cost !== "0")) {
          setCurrentStep("book");
        } else if (step1Data.selectedDestinations.length > 0) {
          setCurrentStep("plan");
        }
      }
    }
  }, [existingTrip, isQuizFlow]);

  // Initialize trip from quiz flow
  useEffect(() => {
    // Only run for quiz flow and when we have step1 data but no tripId yet
    if (isQuizFlow && tripData.step1 && !currentTripId && currentStep === "plan") {
      const initializeQuizTrip = async () => {
        try {
          const data = tripData.step1;
          if (!data) return;
          
          // Create trip
          const tripPayload: InsertTrip = {
            travelers: data.travelers,
            numberOfTravelers: data.numberOfTravelers,
            travelSeason: data.travelSeason,
            tripDuration: data.tripDuration,
          };
          
          const response = await apiRequest("POST", "/api/trips", tripPayload);
          const newTrip: Trip = await response.json();
          setCurrentTripId(newTrip.id);
          queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
          
          // Update URL with new trip ID
          setLocation(`/trip/${newTrip.id}`);
          
          // Create destinations
          for (let i = 0; i < data.selectedDestinations.length; i++) {
            const dest = data.selectedDestinations[i];
            await apiRequest("POST", "/api/destinations", {
              tripId: newTrip.id,
              cityName: dest.cityName,
              countryName: dest.countryName,
              numberOfNights: dest.numberOfNights,
              imageUrl: dest.imageUrl,
              order: i,
            });
          }
        } catch (error) {
          console.error("Failed to initialize quiz trip:", error);
        }
      };
      
      initializeQuizTrip();
    }
  }, [isQuizFlow, tripData.step1, currentTripId, currentStep]);

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (data: InsertTrip) => {
      const response = await apiRequest("POST", "/api/trips", data);
      return response.json();
    },
    onSuccess: (data: Trip) => {
      setCurrentTripId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
  });

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTrip> }) => {
      const response = await apiRequest("PATCH", `/api/trips/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      if (currentTripId) {
        queryClient.invalidateQueries({ queryKey: ["/api/trips", currentTripId] });
      }
    },
  });

  const handleStep1Complete = async (data: TripPlanData["step1"]) => {
    setTripData({ ...tripData, step1: data });
    
    if (!data) return;
    
    // Create or update trip
    const tripPayload: InsertTrip = {
      travelers: data.travelers,
      numberOfTravelers: data.numberOfTravelers,
      travelSeason: data.travelSeason,
      tripDuration: data.tripDuration,
    };

    try {
      if (!currentTripId || currentTripId === "new") {
        // Create new trip
        const newTrip = await createTripMutation.mutateAsync(tripPayload);
        
        // Update URL with new trip ID
        setLocation(`/trip/${newTrip.id}`);
        
        // Create destinations
        for (let i = 0; i < data.selectedDestinations.length; i++) {
          const dest = data.selectedDestinations[i];
          await apiRequest("POST", "/api/destinations", {
            tripId: newTrip.id,
            cityName: dest.cityName,
            countryName: dest.countryName,
            numberOfNights: dest.numberOfNights,
            imageUrl: dest.imageUrl,
            order: i,
          });
        }
      } else {
        // Update existing trip
        await updateTripMutation.mutateAsync({ id: currentTripId, data: tripPayload });
        
        // Delete existing destinations and recreate
        const existingDests = await fetch(`/api/destinations/trip/${currentTripId}`).then(r => r.json());
        for (const dest of existingDests) {
          await apiRequest("DELETE", `/api/destinations/${dest.id}`);
        }
        
        // Create new destinations
        for (let i = 0; i < data.selectedDestinations.length; i++) {
          const dest = data.selectedDestinations[i];
          await apiRequest("POST", "/api/destinations", {
            tripId: currentTripId,
            cityName: dest.cityName,
            countryName: dest.countryName,
            numberOfNights: dest.numberOfNights,
            imageUrl: dest.imageUrl,
            order: i,
          });
        }
      }
      
      setCurrentStep("plan");
    } catch (error) {
      console.error("Failed to save step 1 data:", error);
    }
  };

  const handleStep2Complete = async (data: TripPlanData["step2"]) => {
    if (!currentTripId || !data) return;

    try {
      // Update trip with savings data
      await updateTripMutation.mutateAsync({
        id: currentTripId,
        data: {
          monthlySavingsAmount: data.monthlySavings,
          currentSavings: data.currentSavings,
          creditCardPoints: parseInt(data.creditCardPoints || "0"),
        },
      });

      // Delete existing budget categories and recreate
      const existingCategories = await fetch(`/api/budget-categories/trip/${currentTripId}`).then(r => r.json());
      for (const cat of existingCategories) {
        await apiRequest("DELETE", `/api/budget-categories/${cat.id}`);
      }

      // Create budget categories
      const categories = [
        { category: "flights", cost: data.flights.cost, notes: data.flights.notes, usePoints: data.flights.usePoints },
        { category: "housing", cost: data.housing.cost, notes: data.housing.notes },
        { category: "food", cost: data.food.cost, notes: data.food.notes },
        { category: "transportation", cost: data.transportation.cost, notes: data.transportation.notes },
        { category: "fun", cost: data.fun.cost, notes: data.fun.notes },
        { category: "preparation", cost: data.preparation.cost, notes: data.preparation.notes },
      ];

      for (const cat of categories) {
        if (parseFloat(cat.cost || "0") > 0) {
          await apiRequest("POST", "/api/budget-categories", {
            tripId: currentTripId,
            category: cat.category,
            estimatedCost: cat.cost,
            notes: cat.notes || "",
            usePoints: cat.usePoints || false,
          });
        }
      }

      // Update state AFTER all async operations complete
      setTripData(prevData => ({ ...prevData, step2: data }));
      setStep2Submitted(true);
      setCurrentStep("book");
    } catch (error) {
      console.error("Failed to save step 2 data:", error);
    }
  };

  const handleStep3Complete = async (data: TripPlanData["step3"]) => {
    setTripData({ ...tripData, step3: data });
    
    if (!currentTripId || !data) return;

    try {
      // Delete existing bookings and recreate
      const existingBookings = await fetch(`/api/bookings/trip/${currentTripId}`).then(r => r.json());
      for (const booking of existingBookings) {
        await apiRequest("DELETE", `/api/bookings/${booking.id}`);
      }

      // Create bookings
      for (let i = 0; i < data.length; i++) {
        const booking = data[i];
        await apiRequest("POST", "/api/bookings", {
          tripId: currentTripId,
          itemName: booking.itemName,
          category: booking.category,
          status: booking.status,
          estimatedCost: booking.estimatedCost.toString(),
          actualCost: booking.actualCost?.toString() || null,
          order: i,
        });
      }

      setCurrentStep("summary");
    } catch (error) {
      console.error("Failed to save step 3 data:", error);
    }
  };

  // Calculate summary data
  const getSummaryData = () => {
    if (!tripData.step1 || !tripData.step2 || !tripData.step3) return null;

    const totalEstimated =
      parseFloat(tripData.step2.flights.cost || "0") +
      parseFloat(tripData.step2.housing.cost || "0") +
      parseFloat(tripData.step2.food.cost || "0") +
      parseFloat(tripData.step2.transportation.cost || "0") +
      parseFloat(tripData.step2.fun.cost || "0") +
      parseFloat(tripData.step2.preparation.cost || "0");

    const currentSavings = parseFloat(tripData.step2.currentSavings || "0");
    const monthlySavings = parseFloat(tripData.step2.monthlySavings || "0");
    const remainingToSave = Math.max(0, totalEstimated - currentSavings);
    const monthsToSave = monthlySavings > 0 ? Math.ceil(remainingToSave / monthlySavings) : 0;

    const today = new Date();
    const earliestTravelDate = new Date(today);
    earliestTravelDate.setMonth(earliestTravelDate.getMonth() + monthsToSave);

    const bookingsCompleted = tripData.step3.filter(b => b.status === "booked").length;
    const bookingsTotal = tripData.step3.length;

    return {
      travelers: tripData.step1.travelers,
      numberOfTravelers: tripData.step1.numberOfTravelers,
      travelSeason: tripData.step1.travelSeason,
      tripDuration: tripData.step1.tripDuration,
      destinations: tripData.step1.selectedDestinations,
      totalEstimated,
      currentSavings,
      monthsToSave,
      earliestTravelDate,
      bookingsCompleted,
      bookingsTotal,
    };
  };

  const getBudgetCategories = () => {
    if (!tripData.step2) return [];
    return [
      { category: "flights", estimatedCost: parseFloat(tripData.step2.flights.cost || "0") },
      { category: "housing", estimatedCost: parseFloat(tripData.step2.housing.cost || "0") },
      { category: "food", estimatedCost: parseFloat(tripData.step2.food.cost || "0") },
      { category: "transportation", estimatedCost: parseFloat(tripData.step2.transportation.cost || "0") },
      { category: "fun", estimatedCost: parseFloat(tripData.step2.fun.cost || "0") },
      { category: "preparation", estimatedCost: parseFloat(tripData.step2.preparation.cost || "0") },
    ].filter(cat => cat.estimatedCost > 0);
  };

  if (isLoading && currentTripId && currentTripId !== "new") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading your trip...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentStep === "dream" && (
        <Step1Dream
          initialData={tripData.step1}
          onComplete={handleStep1Complete}
        />
      )}

      {currentStep === "plan" && tripData.step1 && (
        <Step2Plan
          initialData={tripData.step2}
          tripDuration={tripData.step1.tripDuration}
          numberOfTravelers={tripData.step1.numberOfTravelers}
          destinations={tripData.step1.selectedDestinations.map(d => d.cityName)}
          destinationDetails={tripData.step1.selectedDestinations.map(d => ({
            cityName: d.cityName,
            countryName: d.countryName,
            numberOfNights: d.numberOfNights,
          }))}
          travelSeason={tripData.step1.travelSeason}
          onComplete={handleStep2Complete}
          onBack={isQuizFlow ? () => setLocation("/trips") : () => setCurrentStep("dream")}
          onViewItinerary={() => setCurrentStep("dream")}
        />
      )}

      {currentStep === "book" && tripData.step1 && tripData.step2 && (
        <Step3Book
          budgetCategories={getBudgetCategories()}
          tripContext={{
            destinations: tripData.step1.selectedDestinations.map(d => d.cityName),
            travelers: tripData.step1.numberOfTravelers,
            tripDuration: tripData.step1.tripDuration,
            travelSeason: tripData.step1.travelSeason,
          }}
          onComplete={handleStep3Complete}
          onBack={() => setCurrentStep("plan")}
        />
      )}

      {currentStep === "summary" && getSummaryData() && (
        <TripSummary tripData={getSummaryData()!} />
      )}
    </>
  );
}
