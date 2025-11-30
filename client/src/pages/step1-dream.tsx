import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ProgressStepper } from "@/components/ProgressStepper";
import { DestinationCard } from "@/components/DestinationCard";
import { NavBar } from "@/components/NavBar";
import { ChevronRight, Users, Calendar, Clock, MapPin } from "lucide-react";
import parisImage from "@assets/generated_images/Paris_destination_card_2651b3b8.png";
import londonImage from "@assets/generated_images/London_destination_card_29eadc15.png";
import romeImage from "@assets/generated_images/Rome_destination_card_22e407f9.png";
import amsterdamImage from "@assets/generated_images/Amsterdam_destination_card_69b698e1.png";
import barcelonaImage from "@assets/generated_images/Barcelona_destination_card_a7d6fd25.png";
import tokyoImage from "@assets/generated_images/Tokyo_destination_card_59c20e16.png";

interface Step1Data {
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
}

interface Step1DreamProps {
  initialData?: Partial<Step1Data>;
  onComplete: (data: Step1Data) => void;
}

const destinations = [
  { cityName: "Paris", countryName: "France", imageUrl: parisImage },
  { cityName: "London", countryName: "United Kingdom", imageUrl: londonImage },
  { cityName: "Rome", countryName: "Italy", imageUrl: romeImage },
  { cityName: "Amsterdam", countryName: "Netherlands", imageUrl: amsterdamImage },
  { cityName: "Barcelona", countryName: "Spain", imageUrl: barcelonaImage },
  { cityName: "Tokyo", countryName: "Japan", imageUrl: tokyoImage },
];

export default function Step1Dream({ initialData, onComplete }: Step1DreamProps) {
  const [travelers, setTravelers] = useState(initialData?.travelers || "just_me");
  const [numberOfTravelers, setNumberOfTravelers] = useState(initialData?.numberOfTravelers || 1);
  const [travelSeason, setTravelSeason] = useState(initialData?.travelSeason || "summer");
  const [tripDuration, setTripDuration] = useState([initialData?.tripDuration || 10]);
  const [selectedDestinations, setSelectedDestinations] = useState<Array<{
    cityName: string;
    countryName: string;
    imageUrl: string;
    numberOfNights: number;
  }>>(initialData?.selectedDestinations || []);
  const [destinationNights, setDestinationNights] = useState<Record<string, number>>(() => {
    // Initialize destinationNights from initialData
    const nights: Record<string, number> = {};
    if (initialData?.selectedDestinations) {
      initialData.selectedDestinations.forEach(dest => {
        nights[dest.cityName] = dest.numberOfNights || 3;
      });
    }
    return nights;
  });

  const toggleDestination = (dest: typeof destinations[0]) => {
    const exists = selectedDestinations.find(d => d.cityName === dest.cityName);
    if (exists) {
      setSelectedDestinations(selectedDestinations.filter(d => d.cityName !== dest.cityName));
      const nights = { ...destinationNights };
      delete nights[dest.cityName];
      setDestinationNights(nights);
    } else {
      setSelectedDestinations([...selectedDestinations, { ...dest, numberOfNights: 3 }]);
      setDestinationNights({ ...destinationNights, [dest.cityName]: 3 });
    }
  };

  const updateDestinationNights = (cityName: string, nights: number) => {
    setDestinationNights({ ...destinationNights, [cityName]: nights });
    setSelectedDestinations(
      selectedDestinations.map(d =>
        d.cityName === cityName ? { ...d, numberOfNights: nights } : d
      )
    );
  };

  const handleContinue = () => {
    const destinations = selectedDestinations.map(d => ({
      ...d,
      numberOfNights: destinationNights[d.cityName] || 3,
    }));

    onComplete({
      travelers,
      numberOfTravelers,
      travelSeason,
      tripDuration: tripDuration[0],
      selectedDestinations: destinations,
    });
  };

  const isComplete = selectedDestinations.length > 0;

  return (
    <div className="min-h-screen bg-background pb-12">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProgressStepper currentStep={1} completedSteps={[]} />

        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Dream Your Perfect Trip
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Let's start with the basics to bring your travel dreams to life
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Who's Going */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>Who's going on this trip?</CardTitle>
              </div>
              <CardDescription>
                Traveling solo or with company? This helps us estimate costs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={travelers} onValueChange={setTravelers}>
                <div className="flex items-center space-x-2 p-3 rounded-md hover-elevate">
                  <RadioGroupItem value="just_me" id="just_me" data-testid="radio-just-me" />
                  <Label htmlFor="just_me" className="flex-1 cursor-pointer">
                    Just me
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-md hover-elevate">
                  <RadioGroupItem value="with_others" id="with_others" data-testid="radio-with-others" />
                  <Label htmlFor="with_others" className="flex-1 cursor-pointer">
                    Me plus family or friends
                  </Label>
                </div>
              </RadioGroup>

              {travelers === "with_others" && (
                <div className="space-y-2 pt-4">
                  <Label htmlFor="num-travelers">Total number of travelers</Label>
                  <Input
                    id="num-travelers"
                    type="number"
                    min="2"
                    max="10"
                    value={numberOfTravelers}
                    onChange={(e) => setNumberOfTravelers(parseInt(e.target.value) || 2)}
                    data-testid="input-number-travelers"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* When */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle>What time of year are you planning to travel?</CardTitle>
              </div>
              <CardDescription>
                Different seasons offer unique experiences and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={travelSeason} onValueChange={setTravelSeason}>
                {[
                  { value: "summer", label: "Summer (June - August)", desc: "Warm weather, peak season" },
                  { value: "winter", label: "Winter Break (December - January)", desc: "Holidays, festive atmosphere" },
                  { value: "thanksgiving", label: "Thanksgiving (November)", desc: "Week-long break" },
                  { value: "spring", label: "Spring Break (March - April)", desc: "Mild weather, moderate crowds" },
                  { value: "off_season", label: "Off-Season (School Year)", desc: "Fewer crowds, better deals" },
                ].map((season) => (
                  <div key={season.value} className="flex items-start space-x-2 p-3 rounded-md hover-elevate">
                    <RadioGroupItem value={season.value} id={season.value} data-testid={`radio-${season.value}`} />
                    <Label htmlFor={season.value} className="flex-1 cursor-pointer">
                      <div className="font-medium">{season.label}</div>
                      <div className="text-sm text-muted-foreground">{season.desc}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle>How long will your trip be?</CardTitle>
              </div>
              <CardDescription>
                Recommended: At least 10 days for international trips
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trip duration</span>
                  <span className="text-2xl font-bold text-primary" data-testid="text-duration-days">
                    {tripDuration[0]} days
                  </span>
                </div>
                <Slider
                  value={tripDuration}
                  onValueChange={setTripDuration}
                  min={7}
                  max={21}
                  step={1}
                  data-testid="slider-duration"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 week</span>
                  <span>2 weeks</span>
                  <span>3 weeks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destinations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <CardTitle>Your Destination</CardTitle>
              </div>
              <CardDescription>
                {selectedDestinations.length > 0 
                  ? "Adjust nights or add more destinations if you'd like"
                  : "Select one or more destinations. Aim for 3+ nights per city."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedDestinations.length > 0 && (
                <div className="space-y-4 pb-4 border-b">
                  <h4 className="font-semibold">Selected Destinations:</h4>
                  {selectedDestinations.map((dest) => (
                    <div key={dest.cityName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">{dest.cityName}, {dest.countryName}</Label>
                          <p className="text-sm text-muted-foreground">
                            {destinationNights[dest.cityName] || 3} nights
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDestination(dest)}
                          data-testid={`button-remove-${dest.cityName}`}
                        >
                          Remove
                        </Button>
                      </div>
                      <Slider
                        value={[destinationNights[dest.cityName] || 3]}
                        onValueChange={([value]) => updateDestinationNights(dest.cityName, value)}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-semibold">
                  {selectedDestinations.length > 0 ? "Add Another Destination" : "Where do you want to go?"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {destinations.map((dest) => {
                    const isSelected = selectedDestinations.some(d => d.cityName === dest.cityName);
                    return (
                      <DestinationCard
                        key={dest.cityName}
                        {...dest}
                        numberOfNights={destinationNights[dest.cityName] || 3}
                        selected={isSelected}
                        onClick={() => toggleDestination(dest)}
                        showNights={false}
                      />
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!isComplete}
              className="min-h-0"
              data-testid="button-continue-to-plan"
            >
              Continue to Save & Book
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
