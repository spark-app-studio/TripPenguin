import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useItinerary, ItineraryCity, TransportSegment } from "@/hooks/useItinerary";
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Trash2, 
  Plane,
  Save,
  Train,
  Car,
  Bus,
  Ship,
  ArrowDown,
  Star,
  Home
} from "lucide-react";

export default function ItineraryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { 
    itinerary, 
    updateCity, 
    addCity, 
    removeCity, 
    updateDates,
    updateDatesAndSeason,
    setItinerary 
  } = useItinerary();
  
  const [startDate, setStartDate] = useState(itinerary?.startDate || "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(itinerary?.title || "");

  useEffect(() => {
    if (itinerary?.startDate) {
      setStartDate(itinerary.startDate);
    }
    if (itinerary?.title) {
      setTitleInput(itinerary.title);
    }
  }, [itinerary]);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (date) {
      updateDatesAndSeason(date);
      toast({
        title: "Dates & Season Updated",
        description: "Your itinerary dates and travel season have been recalculated.",
      });
    }
  };

  // Helper to get transport mode icon
  const getTransportIcon = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case "flight":
        return <Plane className="w-4 h-4" />;
      case "train":
        return <Train className="w-4 h-4" />;
      case "car":
      case "drive":
        return <Car className="w-4 h-4" />;
      case "bus":
        return <Bus className="w-4 h-4" />;
      case "ferry":
        return <Ship className="w-4 h-4" />;
      default:
        return <ArrowDown className="w-4 h-4" />;
    }
  };

  // Format transport duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const handleNightsChange = (cityId: string, nights: number) => {
    if (nights >= 1) {
      updateCity(cityId, { numberOfNights: nights });
      if (startDate) {
        updateDates(startDate);
      }
    }
  };

  const handleAddCity = () => {
    const newCity: ItineraryCity = {
      id: `city-${Date.now()}`,
      cityName: "New City",
      countryName: "Country",
      numberOfNights: 2,
      activities: [],
    };
    addCity(newCity);
    if (startDate) {
      updateDates(startDate);
    }
    toast({
      title: "City Added",
      description: "A new city has been added to your itinerary.",
    });
  };

  const handleRemoveCity = (cityId: string, cityName: string) => {
    removeCity(cityId);
    if (startDate) {
      updateDates(startDate);
    }
    toast({
      title: "City Removed",
      description: `${cityName} has been removed from your itinerary.`,
    });
  };

  const handleSaveTitle = () => {
    if (itinerary && titleInput.trim()) {
      setItinerary({ ...itinerary, title: titleInput.trim() });
      setEditingTitle(false);
      toast({
        title: "Title Updated",
        description: "Your itinerary title has been saved.",
      });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>No Itinerary Found</CardTitle>
            <CardDescription>
              Start planning your trip to create an itinerary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/trip/new")} data-testid="button-start-planning">
              Start Planning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/trip/new")}
            data-testid="button-back-to-plan"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="text-2xl font-bold max-w-md"
                  data-testid="input-itinerary-title"
                />
                <Button size="sm" onClick={handleSaveTitle} data-testid="button-save-title">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <h1 
                className="text-3xl font-bold font-serif cursor-pointer hover:text-primary transition-colors"
                onClick={() => setEditingTitle(true)}
                data-testid="text-itinerary-title"
              >
                {itinerary.title}
              </h1>
            )}
            <p className="text-muted-foreground">Click title to edit</p>
          </div>
        </div>

        {/* Trip Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Trip Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Duration</p>
                  <p className="font-semibold" data-testid="text-total-nights">
                    {itinerary.totalNights} nights
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Travelers</p>
                  <p className="font-semibold" data-testid="text-travelers">
                    {itinerary.numberOfTravelers}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Season</p>
                  <p className="font-semibold" data-testid="text-season">
                    {getSeasonDisplay(itinerary.travelSeason)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Destinations</p>
                  <p className="font-semibold" data-testid="text-city-count">
                    {itinerary.cities.length} cities
                  </p>
                </div>
              </div>
            </div>

            {/* Departure Info */}
            {itinerary.departureCity && (
              <div className="mb-6 p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Departing from:</span>
                  <span className="font-medium" data-testid="text-departure-city">
                    {itinerary.departureCity}
                    {itinerary.departureCountry && `, ${itinerary.departureCountry}`}
                  </span>
                  {itinerary.departureAirport && (
                    <Badge variant="outline" className="ml-2" data-testid="badge-departure-airport">
                      {itinerary.departureAirport}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Start Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Trip Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="max-w-xs"
                data-testid="input-start-date"
              />
              <p className="text-xs text-muted-foreground">
                Setting a start date will calculate arrival/departure dates for each city
              </p>
            </div>

            {itinerary.startDate && itinerary.endDate && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Trip dates:</span>{" "}
                  {formatDate(itinerary.startDate)} — {formatDate(itinerary.endDate)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itinerary Cities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Itinerary</h2>
            <Button onClick={handleAddCity} className="gap-2" data-testid="button-add-city">
              <Plus className="w-4 h-4" />
              Add City
            </Button>
          </div>

          {itinerary.cities.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No cities in your itinerary yet</p>
                <Button onClick={handleAddCity} data-testid="button-add-first-city">
                  Add Your First City
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {itinerary.cities.map((city, index) => (
                <div key={city.id}>
                  <Card data-testid={`card-city-${index}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={city.cityName}
                                  onChange={(e) => updateCity(city.id, { cityName: e.target.value })}
                                  className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                                  data-testid={`input-city-name-${index}`}
                                />
                                {/* Airport codes */}
                                {(city.arrivalAirport || city.departureAirport) && (
                                  <div className="flex gap-1">
                                    {city.arrivalAirport && (
                                      <Badge variant="secondary" className="text-xs" data-testid={`badge-arrival-airport-${index}`}>
                                        <Plane className="w-3 h-3 mr-1" />
                                        {city.arrivalAirport}
                                      </Badge>
                                    )}
                                    {city.departureAirport && city.departureAirport !== city.arrivalAirport && (
                                      <Badge variant="outline" className="text-xs" data-testid={`badge-departure-airport-${index}`}>
                                        {city.departureAirport}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <Input
                                value={city.countryName}
                                onChange={(e) => updateCity(city.id, { countryName: e.target.value })}
                                className="text-sm text-muted-foreground border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                                data-testid={`input-country-name-${index}`}
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`nights-${city.id}`} className="text-sm whitespace-nowrap">
                                  Nights:
                                </Label>
                                <Input
                                  id={`nights-${city.id}`}
                                  type="number"
                                  min="1"
                                  value={city.numberOfNights}
                                  onChange={(e) => handleNightsChange(city.id, parseInt(e.target.value) || 1)}
                                  className="w-16"
                                  data-testid={`input-nights-${index}`}
                                />
                              </div>
                              
                              {itinerary.cities.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveCity(city.id, city.cityName)}
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-remove-city-${index}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {city.arrivalDate && city.departureDate && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <Badge variant="outline" className="gap-1">
                                <Calendar className="w-3 h-3" />
                                Arrive: {formatDate(city.arrivalDate)}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Calendar className="w-3 h-3" />
                                Depart: {formatDate(city.departureDate)}
                              </Badge>
                            </div>
                          )}

                          {/* Activities Section */}
                          {city.activities && city.activities.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Star className="w-4 h-4" />
                                Activities & Highlights
                              </div>
                              <ul className="space-y-1 pl-6" data-testid={`list-activities-${index}`}>
                                {city.activities.map((activity, actIndex) => (
                                  <li 
                                    key={actIndex} 
                                    className="text-sm text-foreground flex items-start gap-2"
                                    data-testid={`activity-${index}-${actIndex}`}
                                  >
                                    <span className="text-primary mt-1.5 shrink-0">•</span>
                                    <span>{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transport Segment (between cities) */}
                  {index < itinerary.cities.length - 1 && city.transportToNext && (
                    <div className="flex justify-center py-2" data-testid={`transport-segment-${index}`}>
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-full">
                        {getTransportIcon(city.transportToNext.mode)}
                        <span className="text-sm font-medium capitalize">
                          {city.transportToNext.mode || "Travel"}
                        </span>
                        {city.transportToNext.durationMinutes && (
                          <span className="text-sm text-muted-foreground">
                            ({formatDuration(city.transportToNext.durationMinutes)})
                          </span>
                        )}
                        {city.transportToNext.estimatedCost && (
                          <Badge variant="outline" className="text-xs ml-1">
                            ~${city.transportToNext.estimatedCost}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Simple connector arrow if no transport data */}
                  {index < itinerary.cities.length - 1 && !city.transportToNext && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/recommendations")}
            data-testid="button-back-to-recommendations"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Choose Different Itinerary
          </Button>
          <Button
            size="lg"
            onClick={() => setLocation("/planner")}
            data-testid="button-continue-to-planning"
          >
            Continue to Planning
            <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
