import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
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
  ShoppingBag
} from "lucide-react";
import type {
  ItineraryRecommendation,
  ItineraryAddon,
  ItineraryCitySegment,
  AdjustItineraryDurationRequest,
  ItineraryAddonsRequest,
  ApplyAddonRequest,
} from "@shared/schema";
import { NavBar } from "@/components/NavBar";
import { ProgressStepper } from "@/components/ProgressStepper";

interface DayPlan {
  dayNumber: number;
  city: ItineraryCitySegment;
  dayInCity: number;
  totalDaysInCity: number;
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  activities: string[];
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
  const { toast } = useToast();

  const [currentItinerary, setCurrentItinerary] = useState<ItineraryRecommendation | null>(null);
  const [numberOfTravelers, setNumberOfTravelers] = useState<number>(1);
  const [desiredNights, setDesiredNights] = useState<number>(7);
  const [addons, setAddons] = useState<ItineraryAddon[]>([]);
  const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedItinerary = sessionStorage.getItem("selectedItinerary");
      const storedTravelers = sessionStorage.getItem("quizNumberOfTravelers");

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
    } catch (error) {
      console.error("Failed to load itinerary:", error);
      toast({
        title: "Error loading itinerary",
        description: "Please try again",
        variant: "destructive",
      });
      setLocation("/quiz");
    }
  }, [setLocation, toast]);

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

  const isBusy =
    adjustDurationMutation.isPending ||
    fetchAddonsMutation.isPending ||
    applyAddonMutation.isPending;

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

  const handleFinalize = () => {
    if (!currentItinerary) return;
    sessionStorage.setItem("selectedItinerary", JSON.stringify(currentItinerary));
    sessionStorage.setItem("quizNumberOfTravelers", String(numberOfTravelers));
    sessionStorage.setItem("tripSource", "quiz");
    setLocation("/trip/new");
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
            <CardTitle>{currentItinerary.title}</CardTitle>
            <CardDescription>{currentItinerary.vibeTagline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Nights:</span>{" "}
                <span className="font-semibold">{currentItinerary.totalNights}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Travelers:</span>{" "}
                <span className="font-semibold">{numberOfTravelers}</span>
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

            {/* Cities Overview */}
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Destinations ({currentItinerary.cities.length} cities)
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentItinerary.cities.map((city) => (
                  <div
                    key={city.order}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30"
                    data-testid={`city-chip-${city.order}`}
                  >
                    <span className="font-medium text-sm">
                      {city.cityName}, {city.countryName}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {city.stayLengthNights} night{city.stayLengthNights !== 1 ? "s" : ""}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteCity(city.order)}
                      disabled={currentItinerary.cities.length <= 1 || isBusy}
                      data-testid={`button-delete-city-${city.order}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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
              const dayPlans = generateDayByDayPlan(currentItinerary);
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

                      {/* Activities for this day */}
                      <div className="ml-13 space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">
                          Recommended Activities:
                        </h5>
                        <div className="grid gap-2">
                          {day.activities.length > 0 ? (
                            day.activities.map((activity, actIndex) => (
                              <div
                                key={actIndex}
                                className="flex items-start gap-3 p-3 rounded-md bg-muted/30"
                                data-testid={`day-${day.dayNumber}-activity-${actIndex}`}
                              >
                                {getActivityIcon(activity)}
                                <span className="text-sm">{activity}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground italic p-3 rounded-md bg-muted/30">
                              Free time to explore at your own pace
                            </div>
                          )}
                        </div>
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
          <Button onClick={handleFinalize} disabled={isBusy} data-testid="button-finalize">
            Finalize & Plan Trip
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
