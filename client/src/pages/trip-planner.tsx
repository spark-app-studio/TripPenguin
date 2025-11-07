import { useState } from "react";
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
  const [currentStep, setCurrentStep] = useState<Step>("dream");
  const [tripData, setTripData] = useState<TripPlanData>({});

  const handleStep1Complete = (data: TripPlanData["step1"]) => {
    setTripData({ ...tripData, step1: data });
    setCurrentStep("plan");
  };

  const handleStep2Complete = (data: TripPlanData["step2"]) => {
    setTripData({ ...tripData, step2: data });
    setCurrentStep("book");
  };

  const handleStep3Complete = (data: TripPlanData["step3"]) => {
    setTripData({ ...tripData, step3: data });
    setCurrentStep("summary");
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
          onComplete={handleStep2Complete}
          onBack={() => setCurrentStep("dream")}
        />
      )}

      {currentStep === "book" && tripData.step1 && tripData.step2 && (
        <Step3Book
          budgetCategories={getBudgetCategories()}
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
