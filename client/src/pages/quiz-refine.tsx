import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Sparkles, MapPin, DollarSign } from "lucide-react";
import type {
  ItineraryRecommendation,
  ItineraryAddon,
  AdjustItineraryDurationRequest,
  ItineraryAddonsRequest,
  ApplyAddonRequest,
} from "@shared/schema";

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalNightsMatch = desiredNights === currentItinerary.totalNights;

  return (
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

            <div className="space-y-3 mt-6">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Cities ({currentItinerary.cities.length})
              </h3>
              {currentItinerary.cities.map((city) => (
                <div
                  key={city.order}
                  className="flex items-start justify-between p-3 rounded-lg border"
                  data-testid={`city-${city.order}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {city.order}. {city.cityName}, {city.countryName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {city.stayLengthNights} night{city.stayLengthNights !== 1 ? "s" : ""} •{" "}
                      {city.arrivalAirport || city.departureAirport || "Airport TBD"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {city.activities.join(" • ")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCity(city.order)}
                    disabled={currentItinerary.cities.length <= 1 || isBusy}
                    data-testid={`button-delete-city-${city.order}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
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
  );
}
