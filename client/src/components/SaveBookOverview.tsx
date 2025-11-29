import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronRight,
  DollarSign,
  PiggyBank,
  TrendingUp,
  Calendar,
  Plane,
  Home,
  Car,
  PartyPopper,
  CheckCircle2,
  Circle,
  ArrowRight
} from "lucide-react";

interface BookingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "upcoming";
  isGroup?: boolean;
}

interface SaveBookOverviewProps {
  tripTitle?: string;
  totalEstimatedCost: number;
  currentSavings: number;
  aiMonthlySavings: number;
  earliestTravelDate: Date;
  flightCost: number;
  flightSavingsProgress: number;
  savingsAccountLinked: boolean;
  accommodationsFunded: boolean;
  transportFunded: boolean;
  flightsFunded: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export function SaveBookOverview({
  tripTitle,
  totalEstimatedCost,
  currentSavings,
  aiMonthlySavings,
  earliestTravelDate,
  flightCost,
  flightSavingsProgress,
  savingsAccountLinked,
  accommodationsFunded,
  transportFunded,
  flightsFunded,
  onContinue,
  onBack,
}: SaveBookOverviewProps) {
  const amountRemaining = Math.max(0, totalEstimatedCost - currentSavings);
  const overallProgress = totalEstimatedCost > 0 
    ? Math.min(100, (currentSavings / totalEstimatedCost) * 100) 
    : 0;
  
  const flightAmountNeeded = Math.max(0, flightCost - Math.min(currentSavings, flightCost));

  const bookingSteps: BookingStep[] = [
    {
      id: "flights",
      label: "Flights",
      icon: <Plane className="w-4 h-4" />,
      status: flightsFunded ? "completed" : "current"
    },
    {
      id: "accommodations",
      label: "Accommodations",
      icon: <Home className="w-4 h-4" />,
      status: flightsFunded ? (accommodationsFunded ? "completed" : "current") : "upcoming"
    },
    {
      id: "transport",
      label: "Major Transportation",
      icon: <Car className="w-4 h-4" />,
      status: accommodationsFunded ? (transportFunded ? "completed" : "current") : "upcoming"
    },
    {
      id: "extras",
      label: "Activities, Dining, Insurance & Merch",
      icon: <PartyPopper className="w-4 h-4" />,
      status: transportFunded ? "current" : "upcoming",
      isGroup: true
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-4">Save & Book Overview</Badge>
        <h2 className="text-3xl font-bold mb-2 font-serif" data-testid="text-trip-title">
          {tripTitle || "Your Trip"}
        </h2>
        <p className="text-muted-foreground">
          Track your savings and book as you reach each milestone
        </p>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Total Estimated Cost</p>
            </div>
            <p className="text-2xl font-bold text-primary" data-testid="text-total-cost">
              ${totalEstimatedCost.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-5 h-5 text-green-600" />
              <p className="text-xs text-muted-foreground font-medium">Amount Saved</p>
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="text-amount-saved">
              ${currentSavings.toLocaleString()}
            </p>
            <Badge variant={savingsAccountLinked ? "default" : "secondary"} className="mt-1 text-xs">
              {savingsAccountLinked ? "Auto-synced" : "Manual"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-muted-foreground font-medium">AI Monthly Savings</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-monthly-savings">
              ${aiMonthlySavings.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <p className="text-xs text-muted-foreground font-medium">Earliest Travel Date</p>
            </div>
            <p className="text-lg font-bold" data-testid="text-earliest-date">
              {earliestTravelDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Savings Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Overall Savings Progress</span>
            <span className="text-sm font-bold">{overallProgress.toFixed(0)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3 mb-2" />
          <p className="text-xs text-muted-foreground">
            ${amountRemaining.toLocaleString()} remaining to fully fund your trip
          </p>
        </CardContent>
      </Card>

      {/* Booking Status Bar */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Booking Progress</CardTitle>
          <CardDescription>Book each category as you save enough</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-2">
            {bookingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  step.status === "completed" 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                    : step.status === "current"
                    ? "bg-primary/10 text-primary border-2 border-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : step.status === "current" ? (
                    step.icon
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span className={`text-xs font-medium ${step.isGroup ? "max-w-[120px]" : ""}`}>
                    {step.label}
                  </span>
                </div>
                {index < bookingSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            The final four categories (Activities, Dining, Insurance, Merchandise) can be booked in any order once transportation is funded.
          </p>
        </CardContent>
      </Card>

      {/* Next Action - Flights */}
      {!flightsFunded && (
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Your Next Step: Save for Flights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flight savings progress</p>
                <p className="text-lg font-bold">
                  ${Math.min(currentSavings, flightCost).toLocaleString()} of ${flightCost.toLocaleString()}
                </p>
              </div>
              <Badge variant={flightSavingsProgress >= 100 ? "default" : "secondary"}>
                {flightSavingsProgress >= 100 ? "Ready to book!" : `${flightSavingsProgress.toFixed(0)}% saved`}
              </Badge>
            </div>
            <Progress value={flightSavingsProgress} className="h-2" />
            {flightAmountNeeded > 0 && (
              <p className="text-sm text-muted-foreground">
                Save ${flightAmountNeeded.toLocaleString()} more to unlock flight booking
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          data-testid="button-back-to-savings"
        >
          Back
        </Button>
        <Button
          size="lg"
          onClick={onContinue}
          className="min-h-0"
          data-testid="button-continue-to-budget"
        >
          Continue to Budget Details
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
