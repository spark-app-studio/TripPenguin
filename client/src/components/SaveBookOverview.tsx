import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Calendar, 
  Users, 
  ChevronRight,
  Edit,
  ExternalLink,
  Plane,
  DollarSign,
  PiggyBank,
  Sun,
  Snowflake,
  Leaf,
  Cloud
} from "lucide-react";
import { format, addDays } from "date-fns";

interface DestinationDetail {
  cityName: string;
  countryName: string;
  numberOfNights: number;
}

interface SaveBookOverviewProps {
  tripTitle?: string;
  destinations: DestinationDetail[];
  tripDuration: number;
  numberOfTravelers: number;
  travelSeason: string;
  currentSavings: string;
  savingsAccountLinked: boolean;
  onViewItinerary: () => void;
  onContinue: () => void;
  onBack: () => void;
}

function getSeasonIcon(season: string) {
  const lowerSeason = season.toLowerCase();
  if (lowerSeason.includes("summer")) return <Sun className="w-4 h-4" />;
  if (lowerSeason.includes("winter")) return <Snowflake className="w-4 h-4" />;
  if (lowerSeason.includes("spring") || lowerSeason.includes("fall")) return <Leaf className="w-4 h-4" />;
  return <Cloud className="w-4 h-4" />;
}

function getSeasonLabel(season: string): string {
  const lowerSeason = season.toLowerCase();
  if (lowerSeason.includes("summer")) return "Summer";
  if (lowerSeason.includes("winter")) return "Winter";
  if (lowerSeason.includes("spring")) return "Spring";
  if (lowerSeason.includes("fall") || lowerSeason.includes("thanksgiving")) return "Fall";
  return "Flexible";
}

function estimateTravelDates(season: string): { start: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const lowerSeason = season.toLowerCase();
  
  let startMonth = 6;
  if (lowerSeason.includes("summer")) startMonth = 6;
  else if (lowerSeason.includes("winter")) startMonth = 11;
  else if (lowerSeason.includes("spring")) startMonth = 3;
  else if (lowerSeason.includes("fall") || lowerSeason.includes("thanksgiving")) startMonth = 10;
  
  let startYear = currentYear;
  if (new Date(currentYear, startMonth, 1) < now) {
    startYear = currentYear + 1;
  }
  
  const start = new Date(startYear, startMonth, 15);
  const end = addDays(start, 14);
  
  return { start, end };
}

export function SaveBookOverview({
  tripTitle,
  destinations,
  tripDuration,
  numberOfTravelers,
  travelSeason,
  currentSavings,
  savingsAccountLinked,
  onViewItinerary,
  onContinue,
  onBack,
}: SaveBookOverviewProps) {
  const { start: estimatedStart, end: estimatedEnd } = estimateTravelDates(travelSeason);
  
  const generatedTitle = tripTitle || 
    (destinations.length === 1 
      ? `${destinations[0].cityName} Adventure`
      : destinations.length === 2
        ? `${destinations[0].cityName} & ${destinations[1].cityName} Trip`
        : `${destinations[0].cityName} + ${destinations.length - 1} More Cities`);

  const destinationSummary = destinations.map(d => d.cityName).join(" → ");
  const totalNights = destinations.reduce((sum, d) => sum + d.numberOfNights, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-4">Save & Book Overview</Badge>
        <h2 className="text-3xl font-bold mb-2 font-serif" data-testid="text-trip-title">
          {generatedTitle}
        </h2>
        <p className="text-muted-foreground">
          Here's your trip at a glance. Review your itinerary and start planning your budget.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plane className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Trip Summary</CardTitle>
                <CardDescription>Your journey details</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onViewItinerary}
              data-testid="button-view-itinerary"
            >
              <Edit className="w-4 h-4 mr-2" />
              View & Edit Itinerary
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Destinations</p>
                <p className="font-medium" data-testid="text-destination-count">
                  {destinations.length} {destinations.length === 1 ? "City" : "Cities"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium" data-testid="text-trip-duration">
                  {totalNights} Nights
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Travelers</p>
                <p className="font-medium" data-testid="text-traveler-count">
                  {numberOfTravelers} {numberOfTravelers === 1 ? "Person" : "People"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {getSeasonIcon(travelSeason)}
              <div>
                <p className="text-xs text-muted-foreground">Season</p>
                <p className="font-medium" data-testid="text-travel-season">
                  {getSeasonLabel(travelSeason)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Your Itinerary
            </h4>
            <div className="flex flex-wrap items-center gap-2" data-testid="text-destination-route">
              {destinations.map((dest, index) => (
                <div key={dest.cityName} className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-muted rounded-lg">
                    <p className="font-medium text-sm">{dest.cityName}</p>
                    <p className="text-xs text-muted-foreground">
                      {dest.numberOfNights} {dest.numberOfNights === 1 ? "night" : "nights"}
                    </p>
                  </div>
                  {index < destinations.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Estimated Travel Dates
            </h4>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-lg font-medium" data-testid="text-travel-dates">
                {format(estimatedStart, "MMMM d")} – {format(estimatedEnd, "MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your {getSeasonLabel(travelSeason).toLowerCase()} travel preference
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Your Savings</CardTitle>
              <CardDescription>
                {savingsAccountLinked ? "Connected via bank account" : "Manually entered"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-current-savings">
                ${parseFloat(currentSavings).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Current savings balance</p>
            </div>
            <Badge variant={savingsAccountLinked ? "default" : "secondary"}>
              {savingsAccountLinked ? "Auto-synced" : "Manual updates needed"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-6 text-center">
        <h3 className="font-semibold mb-2">Ready to plan your budget?</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Next, you'll set up your budget for flights, accommodations, activities, and more. 
          As your savings grow, you'll unlock the ability to book each category.
        </p>
      </div>

      <div className="flex justify-between pt-4">
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
          Continue to Budget Planning
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
