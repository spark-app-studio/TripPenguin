import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Download,
  Share2,
  Luggage,
} from "lucide-react";
import { PenguinLogo } from "@/components/PenguinLogo";
import { NavBar } from "@/components/NavBar";
import { useLocation } from "wouter";

interface TripSummaryProps {
  tripData: {
    travelers: string;
    numberOfTravelers: number;
    travelSeason: string;
    tripDuration: number;
    destinations: Array<{
      cityName: string;
      countryName: string;
      numberOfNights: number;
    }>;
    totalEstimated: number;
    currentSavings: number;
    monthsToSave: number;
    earliestTravelDate: Date;
    bookingsCompleted: number;
    bookingsTotal: number;
  };
}

export default function TripSummary({ tripData }: TripSummaryProps) {
  const [, setLocation] = useLocation();

  const totalNights = tripData.destinations.reduce((sum, d) => sum + d.numberOfNights, 0);
  const budgetHealth = tripData.currentSavings >= tripData.totalEstimated ? "on-track" : "saving";

  return (
    <div className="min-h-screen bg-background pb-12">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-green-500/10 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Trip Plan Complete!</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Your Trip Summary
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Here's your complete travel plan. Save, share, or start booking!
          </p>
        </div>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{tripData.destinations.length}</p>
                <p className="text-sm text-muted-foreground">Cities</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{totalNights}</p>
                <p className="text-sm text-muted-foreground">Nights</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{tripData.numberOfTravelers}</p>
                <p className="text-sm text-muted-foreground">Travelers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">${tripData.totalEstimated.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Total Cost</p>
              </CardContent>
            </Card>
          </div>

          {/* Trip Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Luggage className="w-5 h-5 text-primary" />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Travelers</p>
                  <p className="font-semibold">
                    {tripData.travelers === "just_me" ? "Just me" : `${tripData.numberOfTravelers} people`}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Season</p>
                  <p className="font-semibold capitalize">{tripData.travelSeason.replace(/_/g, " ")}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="font-semibold">{tripData.tripDuration} days</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Earliest Travel Date</p>
                  <p className="font-semibold">
                    {tripData.earliestTravelDate.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-3">Destinations</p>
                <div className="space-y-2">
                  {tripData.destinations.map((dest, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div>
                        <p className="font-semibold">{dest.cityName}</p>
                        <p className="text-sm text-muted-foreground">{dest.countryName}</p>
                      </div>
                      <Badge variant="secondary">{dest.numberOfNights} nights</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Budget Summary
              </CardTitle>
              <CardDescription>
                Your financial plan to make this trip debt-free
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Total Estimated Cost</p>
                  <p className="text-2xl font-bold text-primary">
                    ${tripData.totalEstimated.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Current Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${tripData.currentSavings.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Months to Save</p>
                  <p className="text-2xl font-bold">
                    {tripData.monthsToSave}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-md ${budgetHealth === "on-track" ? "bg-green-500/10 border border-green-500/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}>
                <p className="font-semibold mb-1">
                  {budgetHealth === "on-track" ? "✓ Budget Status: On Track" : "⏱ Budget Status: Saving"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {budgetHealth === "on-track"
                    ? "You have enough saved to book your trip now!"
                    : `Continue saving to reach your goal by ${tripData.earliestTravelDate.toLocaleDateString()}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Booking Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Booking Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
                <div>
                  <p className="font-semibold text-lg">
                    {tripData.bookingsCompleted} of {tripData.bookingsTotal} items booked
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tripData.bookingsCompleted === tripData.bookingsTotal
                      ? "All bookings complete!"
                      : `${tripData.bookingsTotal - tripData.bookingsCompleted} items remaining`}
                  </p>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {Math.round((tripData.bookingsCompleted / tripData.bookingsTotal) * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              variant="default"
              onClick={() => setLocation("/trip/new")}
              className="min-h-0"
              data-testid="button-plan-another-trip"
            >
              Plan Another Trip
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-0"
              data-testid="button-share-trip"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Trip Plan
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-0"
              data-testid="button-download-summary"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Summary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
