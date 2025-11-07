import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { TripWithDetails, InsertTrip, Trip } from "@shared/schema";
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
  
  const [currentStep, setCurrentStep] = useState<Step>("dream");
  const [tripData, setTripData] = useState<TripPlanData>({});
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

      const step2Data = {
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

      const step3Data = existingTrip.bookings.map(b => ({
        id: b.id,
        itemName: b.itemName,
        category: b.category,
        status: b.status as "not_started" | "in_progress" | "booked",
        estimatedCost: parseFloat(b.estimatedCost),
        actualCost: b.actualCost ? parseFloat(b.actualCost) : undefined,
      }));

      setTripData({ step1: step1Data, step2: step2Data, step3: step3Data });
      
      // Determine current step based on data completeness
      if (step3Data.length > 0) {
        setCurrentStep("summary");
      } else if (step2Data.flights.cost !== "0" || step2Data.housing.cost !== "0") {
        setCurrentStep("book");
      } else if (step1Data.selectedDestinations.length > 0) {
        setCurrentStep("plan");
      }
    }
  }, [existingTrip]);

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (data: InsertTrip) => {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create trip");
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
      const response = await fetch(`/api/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update trip");
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
          await fetch("/api/destinations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tripId: newTrip.id,
              cityName: dest.cityName,
              countryName: dest.countryName,
              numberOfNights: dest.numberOfNights,
              imageUrl: dest.imageUrl,
              order: i,
            }),
          });
        }
      } else {
        // Update existing trip
        await updateTripMutation.mutateAsync({ id: currentTripId, data: tripPayload });
        
        // Delete existing destinations and recreate
        const existingDests = await fetch(`/api/destinations/trip/${currentTripId}`).then(r => r.json());
        for (const dest of existingDests) {
          await fetch(`/api/destinations/${dest.id}`, { method: "DELETE" });
        }
        
        // Create new destinations
        for (let i = 0; i < data.selectedDestinations.length; i++) {
          const dest = data.selectedDestinations[i];
          await fetch("/api/destinations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tripId: currentTripId,
              cityName: dest.cityName,
              countryName: dest.countryName,
              numberOfNights: dest.numberOfNights,
              imageUrl: dest.imageUrl,
              order: i,
            }),
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
        await fetch(`/api/budget-categories/${cat.id}`, { method: "DELETE" });
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
          await fetch("/api/budget-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tripId: currentTripId,
              category: cat.category,
              estimatedCost: cat.cost,
              notes: cat.notes || "",
              usePoints: cat.usePoints || false,
            }),
          });
        }
      }

      // Update state AFTER all async operations complete
      setTripData(prevData => ({ ...prevData, step2: data }));
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
        await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
      }

      // Create bookings
      for (let i = 0; i < data.length; i++) {
        const booking = data[i];
        await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: currentTripId,
            itemName: booking.itemName,
            category: booking.category,
            status: booking.status,
            estimatedCost: booking.estimatedCost.toString(),
            actualCost: booking.actualCost?.toString() || null,
            order: i,
          }),
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
          travelSeason={tripData.step1.travelSeason}
          onComplete={handleStep2Complete}
          onBack={() => setCurrentStep("dream")}
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
