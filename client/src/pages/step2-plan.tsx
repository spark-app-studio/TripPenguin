import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, DollarSign, TrendingUp, Calendar as CalendarIcon, Sparkles, Loader2 } from "lucide-react";

interface BudgetData {
  flights: { cost: string; notes: string; usePoints: boolean };
  housing: { cost: string; notes: string };
  food: { cost: string; notes: string };
  transportation: { cost: string; notes: string };
  fun: { cost: string; notes: string };
  preparation: { cost: string; notes: string };
  monthlySavings: string;
  currentSavings: string;
  creditCardPoints: string;
}

interface Step2PlanProps {
  initialData?: Partial<BudgetData>;
  tripDuration: number;
  numberOfTravelers: number;
  destinations: string[];
  travelSeason: string;
  onComplete: (data: BudgetData) => void;
  onBack: () => void;
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
};

export default function Step2Plan({
  initialData,
  tripDuration,
  numberOfTravelers,
  destinations,
  travelSeason,
  onComplete,
  onBack,
}: Step2PlanProps) {
  const { toast } = useToast();
  const [budgetData, setBudgetData] = useState<BudgetData>({
    flights: initialData?.flights || { cost: "0", notes: "", usePoints: false },
    housing: initialData?.housing || { cost: "0", notes: "" },
    food: initialData?.food || { cost: "0", notes: "" },
    transportation: initialData?.transportation || { cost: "0", notes: "" },
    fun: initialData?.fun || { cost: "0", notes: "" },
    preparation: initialData?.preparation || { cost: "0", notes: "" },
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
      return response as unknown as BudgetAdviceResponse;
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

  // Calculate totals
  const totalEstimated =
    parseFloat(budgetData.flights.cost || "0") +
    parseFloat(budgetData.housing.cost || "0") +
    parseFloat(budgetData.food.cost || "0") +
    parseFloat(budgetData.transportation.cost || "0") +
    parseFloat(budgetData.fun.cost || "0") +
    parseFloat(budgetData.preparation.cost || "0");

  const currentSavingsNum = parseFloat(budgetData.currentSavings || "0");
  const monthlySavingsNum = parseFloat(budgetData.monthlySavings || "0");
  const remainingToSave = Math.max(0, totalEstimated - currentSavingsNum);
  const monthsToSave = monthlySavingsNum > 0 ? Math.ceil(remainingToSave / monthlySavingsNum) : 0;

  const today = new Date();
  const earliestTravelDate = new Date(today);
  earliestTravelDate.setMonth(earliestTravelDate.getMonth() + monthsToSave);

  const savingsProgress = currentSavingsNum > 0 ? (currentSavingsNum / totalEstimated) * 100 : 0;

  const handleContinue = () => {
    onComplete(budgetData);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProgressStepper currentStep={2} completedSteps={[1]} />

        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Plan Your Budget
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Estimate costs and set savings goals to make your trip debt-free
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Savings Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Total Estimated Cost</CardDescription>
                <CardTitle className="text-3xl font-bold text-primary" data-testid="text-total-estimated">
                  ${totalEstimated.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Current Savings</CardDescription>
                <CardTitle className="text-3xl font-bold text-green-600" data-testid="text-current-savings">
                  ${currentSavingsNum.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Still Need to Save</CardDescription>
                <CardTitle className="text-3xl font-bold" data-testid="text-remaining-to-save">
                  ${remainingToSave.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Budget Alert */}
          <BudgetAlert
            totalEstimated={totalEstimated}
            totalSavings={currentSavingsNum}
          />

          {/* Savings Tracker */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <CardTitle>Savings Tracker</CardTitle>
              </div>
              <CardDescription>
                Set your monthly savings goal and track progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-savings">How much have you saved? (USD)</Label>
                  <Input
                    id="current-savings"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetData.currentSavings}
                    onChange={(e) => setBudgetData({ ...budgetData, currentSavings: e.target.value })}
                    data-testid="input-current-savings"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly-savings">Monthly savings amount (USD)</Label>
                  <Input
                    id="monthly-savings"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetData.monthlySavings}
                    onChange={(e) => setBudgetData({ ...budgetData, monthlySavings: e.target.value })}
                    data-testid="input-monthly-savings"
                  />
                </div>
              </div>

              {totalEstimated > 0 && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Savings Progress</span>
                      <span className="font-medium">{Math.min(100, savingsProgress).toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, savingsProgress)} className="h-3" />
                  </div>

                  {monthsToSave > 0 && (
                    <div className="p-4 rounded-md bg-muted/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">Savings Timeline</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Months to save</p>
                          <p className="text-2xl font-bold text-primary" data-testid="text-months-to-save">
                            {monthsToSave}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Earliest travel date</p>
                          <p className="text-lg font-semibold flex items-center gap-1" data-testid="text-earliest-date">
                            <CalendarIcon className="w-4 h-4" />
                            {earliestTravelDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="credit-points">Credit card points (optional)</Label>
                <Input
                  id="credit-points"
                  type="number"
                  min="0"
                  value={budgetData.creditCardPoints}
                  onChange={(e) => setBudgetData({ ...budgetData, creditCardPoints: e.target.value })}
                  placeholder="Enter points balance"
                  data-testid="input-credit-points"
                />
                <p className="text-xs text-muted-foreground">
                  Track your points to potentially reduce flight costs
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Budget Categories */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Budget Breakdown</h2>

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
              {currentAICategory && aiAdvice?.categories?.[0]?.categoryLabel 
                ? `${aiAdvice.categories[0].categoryLabel} Budget Guidance`
                : "AI Budget Guidance"}
            </DialogTitle>
            <DialogDescription>
              {currentAICategory 
                ? `Personalized ${aiAdvice?.categories?.[0]?.categoryLabel?.toLowerCase() || "budget"} recommendations for your trip to ${destinations.join(", ")}`
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
