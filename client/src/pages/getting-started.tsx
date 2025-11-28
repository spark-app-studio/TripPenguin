import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Plane,
  MapPin,
  Home,
  Globe,
  Map,
  ChevronRight,
  ChevronLeft,
  Users,
  Calendar,
  Clock,
  Target,
  Accessibility,
  DollarSign,
  Sparkles,
  X,
  Plus,
  Minus,
  Mountain,
  Building,
  Waves,
  Trees,
  Compass,
  Star,
  Palmtree,
  Sunset,
  Heart,
  Zap,
  Camera,
  BookOpen
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

type TripType = "international" | "domestic" | "staycation" | null;

interface QuizData {
  tripType: TripType;
  adults: number;
  kids: number;
  childAges: number[];
  
  // Staycation specific
  timeAvailable?: string;
  travelDistance?: string;
  staycationGoal?: string[];
  staycationBudget?: string;
  
  // Domestic specific
  tripLength?: string;
  travelDates?: string;
  exactDates?: string;
  flexibleDates?: string;
  usRegion?: string;
  tripDesire?: string;
  postcardImage?: string;
  favoriteMedia?: string;
  dayFullness?: string;
  budgetStyle?: string;
  absoluteNos?: string[];
  
  // International specific
  internationalRegion?: string;
  internationalPostcard?: string;
  
  // Common
  kidActivities?: string[];
  accessibilityNeeds?: string[];
  departureLocation?: string;
}

const initialQuizData: QuizData = {
  tripType: null,
  adults: 2,
  kids: 0,
  childAges: [],
  kidActivities: [],
  accessibilityNeeds: [],
  absoluteNos: [],
  staycationGoal: [],
};

export default function GettingStarted() {
  const [, setLocation] = useLocation();
  const [currentScreen, setCurrentScreen] = useState(0); // Start at trip type selection (screen 0)
  const [quizData, setQuizData] = useState<QuizData>(initialQuizData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total screens based on trip type (removed welcome screen)
  const getTotalScreens = () => {
    if (!quizData.tripType) return 1; // Just trip type selection
    if (quizData.tripType === "staycation") return quizData.kids > 0 ? 9 : 8;
    return quizData.kids > 0 ? 14 : 13;
  };

  const totalScreens = getTotalScreens();
  const progress = ((currentScreen) / (totalScreens - 1)) * 100;

  const handleNext = () => {
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Map getting-started data to the legacy quizResponseSchema format
    // Required by /api/ai/destination-recommendations endpoint
    
    // Map tripDesire/staycationGoal to tripGoal enum
    const mapToTripGoal = (): "rest" | "culture" | "thrill" | "magic" => {
      const desire = quizData.tripDesire || quizData.staycationGoal?.[0];
      switch (desire) {
        case "rest": return "rest";
        case "relax": return "rest";
        case "culture": return "culture";
        case "thrill": return "thrill";
        case "magic": return "magic";
        case "connection": return "rest";
        case "family-time": return "rest";
        case "explore": return "culture";
        case "outdoor": return "thrill";
        case "cultural": return "culture";
        case "food": return "culture";
        case "romantic": return "rest";
        default: return "rest";
      }
    };
    
    // Map postcard/destination preference to placeType
    const mapToPlaceType = (): "ocean" | "mountains" | "ancientCities" | "modernSkyline" => {
      const postcard = quizData.postcardImage || quizData.internationalPostcard;
      switch (postcard) {
        case "beach": return "ocean";
        case "mountains": return "mountains";
        case "ancient-ruins": return "ancientCities";
        case "skyline": return "modernSkyline";
        case "redwoods": return "mountains";
        case "canyon": return "mountains";
        case "small-town": return "ancientCities";
        case "tropical-beach": return "ocean";
        case "historic-city": return "ancientCities";
        case "modern-city": return "modernSkyline";
        case "nature-landscape": return "mountains";
        case "cultural-site": return "ancientCities";
        default: return "ocean";
      }
    };
    
    // Map dayFullness to dayPace
    const mapToDayPace = (): "relaxed" | "balanced" | "packed" => {
      switch (quizData.dayFullness) {
        case "70-chill": return "relaxed";
        case "50-50": return "balanced";
        case "30-chill": return "packed";
        default: return "balanced";
      }
    };
    
    // Map budgetStyle to spendingPriority
    const mapToSpendingPriority = (): "food" | "experiences" | "comfort" | "souvenirs" => {
      switch (quizData.budgetStyle) {
        case "budget-saver": return "food";
        case "smart-comfortable": return "experiences";
        case "treat-yourself": return "comfort";
        case "bucket-list": return "experiences";
        default: return "experiences";
      }
    };
    
    // Map tripDesire to desiredEmotion
    const mapToDesiredEmotion = (): "wonder" | "freedom" | "connection" | "awe" => {
      const desire = quizData.tripDesire || quizData.staycationGoal?.[0];
      switch (desire) {
        case "magic": return "wonder";
        case "thrill": return "freedom";
        case "connection": return "connection";
        case "rest": return "awe";
        case "culture": return "wonder";
        case "relax": return "awe";
        case "family-time": return "connection";
        case "explore": return "wonder";
        case "outdoor": return "freedom";
        case "romantic": return "connection";
        default: return "wonder";
      }
    };
    
    // Map region
    const mapToRegion = (): "europe" | "asia" | "southAmerica" | "tropicalIslands" | "surprise" => {
      const region = quizData.internationalRegion || quizData.usRegion;
      switch (region) {
        case "europe": return "europe";
        case "asia": return "asia";
        case "south-america": return "southAmerica";
        case "australia-nz": return "tropicalIslands";
        case "africa": return "surprise";
        case "tropical-islands": return "tropicalIslands";
        case "surprise": return "surprise";
        // US regions - map to "surprise" for domestic trips
        case "new-england": return "europe"; // Similar vibe
        case "mid-atlantic": return "europe";
        case "southeast": return "tropicalIslands";
        case "midwest": return "surprise";
        case "mountains-west": return "surprise";
        case "southwest": return "surprise";
        case "pacific-coast": return "tropicalIslands";
        default: return "surprise";
      }
    };
    
    // Map trip length
    const mapToTripLength = (): "1-3 days" | "4-7 days" | "1-2 weeks" | "2-3 weeks" | "3+ weeks" | "flexible" => {
      const length = quizData.tripLength || quizData.timeAvailable;
      switch (length) {
        case "afternoon": return "1-3 days";
        case "full-day": return "1-3 days";
        case "weekend": return "1-3 days";
        case "extended": return "4-7 days";
        case "short": return "4-7 days";
        case "week": return "1-2 weeks";
        case "longer": return "2-3 weeks";
        default: return "flexible";
      }
    };
    
    // Build compatible quiz data for the AI endpoint
    const quizCompatibleData = {
      tripGoal: mapToTripGoal(),
      placeType: mapToPlaceType(),
      temperature: "flexible" as const,
      dayPace: mapToDayPace(),
      spendingPriority: mapToSpendingPriority(),
      desiredEmotion: mapToDesiredEmotion(),
      region: mapToRegion(),
      favoriteMovie: quizData.favoriteMedia || "Adventure film",
      favoriteBook: quizData.favoriteMedia || "Travel memoir",
      dreamMoment: `A perfect ${quizData.tripType} trip with ${quizData.adults} adults${quizData.kids > 0 ? ` and ${quizData.kids} kids` : ""} from ${quizData.departureLocation || "home"}`,
      numberOfTravelers: quizData.adults + quizData.kids,
      tripLengthPreference: mapToTripLength(),
    };
    
    // Store quiz data in sessionStorage for after authentication
    sessionStorage.setItem("quizData", JSON.stringify(quizCompatibleData));
    sessionStorage.setItem("gettingStartedData", JSON.stringify(quizData));
    sessionStorage.setItem("tripSource", "getting-started");
    sessionStorage.setItem("redirectAfterAuth", "/quiz/results");
    
    // Navigate to registration - user needs account to see AI recommendations
    setTimeout(() => {
      setLocation("/register");
    }, 500);
  };

  const updateQuizData = (updates: Partial<QuizData>) => {
    setQuizData(prev => ({ ...prev, ...updates }));
  };

  const addChildAge = (age: number) => {
    if (quizData.childAges.length < quizData.kids) {
      updateQuizData({ childAges: [...quizData.childAges, age] });
    }
  };

  const removeChildAge = (index: number) => {
    const newAges = quizData.childAges.filter((_, i) => i !== index);
    updateQuizData({ childAges: newAges });
  };

  const toggleArrayItem = (field: keyof QuizData, item: string) => {
    const currentArray = (quizData[field] as string[]) || [];
    if (currentArray.includes(item)) {
      updateQuizData({ [field]: currentArray.filter(i => i !== item) });
    } else {
      updateQuizData({ [field]: [...currentArray, item] });
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  // Render Welcome Screen
  const renderWelcomeScreen = () => (
    <motion.div
      key="welcome"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8">
        <Plane className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 font-serif">
        Welcome aboard!
      </h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-10">
        Let's plan your next family adventure. This will take just a couple of minutes and helps us tailor your itineraries to your family and trip dreams.
      </p>
      <Button
        size="lg"
        onClick={handleNext}
        className="text-lg px-8 py-6"
        data-testid="button-begin-adventure"
      >
        Begin Your Adventure
        <ChevronRight className="ml-2 w-5 h-5" />
      </Button>
      <p className="text-sm text-muted-foreground mt-6">
        No credit card or commitment required. You can change anything later.
      </p>
    </motion.div>
  );

  // Render Trip Type Selection
  const renderTripTypeScreen = () => (
    <motion.div
      key="triptype"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl mx-auto px-4"
    >
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-serif text-center">
        What type of adventure are you thinking about?
      </h2>
      <p className="text-muted-foreground text-center mb-8">
        This helps us tailor travel time, budget expectations, and itinerary design.
      </p>

      <div className="space-y-4">
        <Card
          className={`cursor-pointer transition-all hover-elevate ${quizData.tripType === "international" ? "ring-2 ring-primary bg-primary/5" : ""}`}
          onClick={() => updateQuizData({ tripType: "international" })}
          data-testid="card-trip-international"
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">International Trip</h3>
              <p className="text-muted-foreground">Outside the U.S.</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover-elevate ${quizData.tripType === "domestic" ? "ring-2 ring-primary bg-primary/5" : ""}`}
          onClick={() => updateQuizData({ tripType: "domestic" })}
          data-testid="card-trip-domestic"
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Map className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Domestic Trip</h3>
              <p className="text-muted-foreground">Within the U.S.</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover-elevate ${quizData.tripType === "staycation" ? "ring-2 ring-primary bg-primary/5" : ""}`}
          onClick={() => updateQuizData({ tripType: "staycation" })}
          data-testid="card-trip-staycation"
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Home className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Local Getaway / Staycation</h3>
              <p className="text-muted-foreground">Short drive, same region</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={handleBack} data-testid="button-back">
          <ChevronLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!quizData.tripType}
          data-testid="button-next"
        >
          Next
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  // Render Travelers Screen (common to all types)
  const renderTravelersScreen = () => (
    <motion.div
      key="travelers"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-xl mx-auto px-4"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Users className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-serif text-center">
        Who's coming on this {quizData.tripType === "staycation" ? "local getaway" : "trip"}?
      </h2>
      <p className="text-muted-foreground text-center mb-8">
        This helps us tailor activities, pace, and costs.
      </p>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Adults */}
          <div className="flex items-center justify-between">
            <Label className="text-base">Adults</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateQuizData({ adults: Math.max(1, quizData.adults - 1) })}
                disabled={quizData.adults <= 1}
                data-testid="button-adults-minus"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-lg" data-testid="text-adults-count">{quizData.adults}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateQuizData({ adults: quizData.adults + 1 })}
                data-testid="button-adults-plus"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Kids */}
          <div className="flex items-center justify-between">
            <Label className="text-base">Kids</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newKids = Math.max(0, quizData.kids - 1);
                  updateQuizData({
                    kids: newKids,
                    childAges: quizData.childAges.slice(0, newKids)
                  });
                }}
                disabled={quizData.kids <= 0}
                data-testid="button-kids-minus"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-lg" data-testid="text-kids-count">{quizData.kids}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateQuizData({ kids: quizData.kids + 1 })}
                data-testid="button-kids-plus"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Child Ages */}
          {quizData.kids > 0 && (
            <div className="pt-4 border-t">
              <Label className="text-base mb-3 block">Child Ages</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {quizData.childAges.map((age, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 text-sm"
                  >
                    {age} years
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1"
                      onClick={() => removeChildAge(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              {quizData.childAges.length < quizData.kids && (
                <div className="flex flex-wrap gap-2">
                  <p className="text-sm text-muted-foreground w-full mb-2">
                    Add age for child {quizData.childAges.length + 1}:
                  </p>
                  {[...Array(18)].map((_, age) => (
                    <Button
                      key={age}
                      variant="outline"
                      size="sm"
                      onClick={() => addChildAge(age)}
                      data-testid={`button-age-${age}`}
                    >
                      {age}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={handleBack} data-testid="button-back">
          <ChevronLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={quizData.kids > 0 && quizData.childAges.length < quizData.kids}
          data-testid="button-next"
        >
          Next
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  // Selection Card Component
  const SelectionCard = ({
    icon: Icon,
    title,
    subtitle,
    selected,
    onClick,
    testId
  }: {
    icon?: any;
    title: string;
    subtitle?: string;
    selected: boolean;
    onClick: () => void;
    testId: string;
  }) => (
    <Card
      className={`cursor-pointer transition-all hover-elevate ${selected ? "ring-2 ring-primary bg-primary/5" : ""}`}
      onClick={onClick}
      data-testid={testId}
    >
      <CardContent className="flex items-center gap-3 p-4">
        {Icon && (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div>
          <h3 className="font-medium">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );

  // ==================== STAYCATION SCREENS ====================

  const renderStaycationTimeScreen = () => {
    const options = [
      { value: "afternoon", label: "One afternoon" },
      { value: "full-day", label: "One full day" },
      { value: "weekend", label: "A weekend (2–3 days)" },
    ];

    return (
      <motion.div
        key="staycation-time"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          How much time do you have?
        </h2>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              title={opt.label}
              selected={quizData.timeAvailable === opt.value}
              onClick={() => updateQuizData({ timeAvailable: opt.value })}
              testId={`card-time-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!quizData.timeAvailable} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderStaycationDistanceScreen = () => {
    const options = [
      { value: "home", label: "Staying in my general area" },
      { value: "2-3hrs", label: "Within 2–3 hours" },
    ];

    return (
      <motion.div
        key="staycation-distance"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          How far away can you go?
        </h2>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              title={opt.label}
              selected={quizData.travelDistance === opt.value}
              onClick={() => updateQuizData({ travelDistance: opt.value })}
              testId={`card-distance-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!quizData.travelDistance} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderStaycationGoalScreen = () => {
    const options = [
      { value: "relax", label: "Relax & recharge", icon: Sunset },
      { value: "family-time", label: "Quality family time", icon: Heart },
      { value: "explore", label: "Explore the local area", icon: Compass },
      { value: "outdoor", label: "Outdoor adventure", icon: Mountain },
      { value: "cultural", label: "Cultural & educational activities", icon: BookOpen },
      { value: "food", label: "Try new foods / restaurants", icon: Star },
      { value: "romantic", label: "Romantic time with significant other", icon: Heart },
    ];

    return (
      <motion.div
        key="staycation-goal"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-serif text-center">
          What's the main goal of your staycation?
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Select all that apply
        </p>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              icon={opt.icon}
              title={opt.label}
              selected={quizData.staycationGoal?.includes(opt.value) || false}
              onClick={() => toggleArrayItem("staycationGoal", opt.value)}
              testId={`card-goal-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!quizData.staycationGoal?.length}
            data-testid="button-next"
          >
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  // Kid Activities Screen (shared)
  const renderKidActivitiesScreen = () => {
    const options = [
      { value: "parks", label: "Parks & playgrounds" },
      { value: "animals", label: "Animals & aquariums" },
      { value: "museums", label: "Museums & learning" },
      { value: "hands-on", label: "Hands-on fun" },
      { value: "water", label: "Water play" },
      { value: "adventure", label: "Adventure sports" },
      { value: "food", label: "Food treats & bakeries" },
    ];

    return (
      <motion.div
        key="kid-activities"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-serif text-center">
          What kind of kid activities do they enjoy most?
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Select all that apply
        </p>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              title={opt.label}
              selected={quizData.kidActivities?.includes(opt.value) || false}
              onClick={() => toggleArrayItem("kidActivities", opt.value)}
              testId={`card-kidactivity-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  // Accessibility Screen (shared)
  const renderAccessibilityScreen = () => {
    const options = [
      { value: "none", label: "None — we're all set!" },
      { value: "mobility", label: "Mobility considerations" },
      { value: "wheelchair", label: "Wheelchair accessibility" },
      { value: "stroller", label: "Stroller-friendly needs" },
      { value: "sensory", label: "Sensory-friendly environments" },
      { value: "food-allergy", label: "Food or allergy considerations" },
    ];

    const handleAccessibilitySelect = (value: string) => {
      if (value === "none") {
        // If selecting "none", clear all other selections and just set "none"
        updateQuizData({ accessibilityNeeds: ["none"] });
      } else {
        // If selecting anything else, remove "none" if present and toggle the selection
        const currentNeeds = quizData.accessibilityNeeds?.filter(n => n !== "none") || [];
        if (currentNeeds.includes(value)) {
          updateQuizData({ accessibilityNeeds: currentNeeds.filter(n => n !== value) });
        } else {
          updateQuizData({ accessibilityNeeds: [...currentNeeds, value] });
        }
      }
    };

    return (
      <motion.div
        key="accessibility"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Accessibility className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-serif text-center">
          Anything we should keep in mind?
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Select any that apply, or choose "None" to continue.
        </p>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              title={opt.label}
              selected={quizData.accessibilityNeeds?.includes(opt.value) || false}
              onClick={() => handleAccessibilitySelect(opt.value)}
              testId={`card-accessibility-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderStaycationBudgetScreen = () => {
    const options = [
      { value: "0-100", label: "$0 – $100" },
      { value: "150-300", label: "$150 – $300" },
      { value: "400-700", label: "$400 – $700" },
      { value: "700+", label: "$700+" },
    ];

    return (
      <motion.div
        key="staycation-budget"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <DollarSign className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          How much do you want to spend?
        </h2>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              title={opt.label}
              selected={quizData.staycationBudget === opt.value}
              onClick={() => updateQuizData({ staycationBudget: opt.value })}
              testId={`card-budget-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!quizData.staycationBudget} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  // Location Screen (shared)
  const renderLocationScreen = () => {
    const isLast = currentScreen === totalScreens - 1;

    return (
      <motion.div
        key="location"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-serif text-center">
          {quizData.tripType === "staycation" ? "Where do you live?" : "Where are you departing from?"}
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          City, State, ZIP code
        </p>

        <Card>
          <CardContent className="pt-6">
            <Input
              placeholder="e.g., Austin, TX 78701"
              value={quizData.departureLocation || ""}
              onChange={(e) => updateQuizData({ departureLocation: e.target.value })}
              className="text-lg"
              data-testid="input-location"
            />
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          {isLast ? (
            <Button
              onClick={handleSubmit}
              disabled={!quizData.departureLocation || isSubmitting}
              data-testid="button-submit"
            >
              {isSubmitting ? "Creating your adventure..." : "See My Recommendations"}
              <Sparkles className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!quizData.departureLocation} data-testid="button-next">
              Next
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  // ==================== DOMESTIC/INTERNATIONAL SCREENS ====================

  const renderTripLengthScreen = () => {
    const domesticOptions = [
      { value: "weekend", label: "Weekend (2–3 days)" },
      { value: "short", label: "Short escape (4–6 days)" },
      { value: "week", label: "One week" },
      { value: "longer", label: "Longer (10+ days)" },
    ];

    const internationalOptions = [
      { value: "5-7", label: "5–7 days" },
      { value: "8-14", label: "8–14 days" },
      { value: "15+", label: "15+ days" },
    ];

    const options = quizData.tripType === "international" ? internationalOptions : domesticOptions;

    return (
      <motion.div
        key="trip-length"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          How long do you want the trip to be?
        </h2>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              title={opt.label}
              selected={quizData.tripLength === opt.value}
              onClick={() => updateQuizData({ tripLength: opt.value })}
              testId={`card-length-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!quizData.tripLength} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderDatesScreen = () => {
    return (
      <motion.div
        key="dates"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          Do you have dates in mind?
        </h2>

        <div className="space-y-3">
          <Card
            className={`cursor-pointer transition-all hover-elevate ${quizData.travelDates === "exact" ? "ring-2 ring-primary bg-primary/5" : ""}`}
            onClick={() => updateQuizData({ travelDates: "exact" })}
            data-testid="card-dates-exact"
          >
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Exact dates</h3>
              {quizData.travelDates === "exact" && (
                <Input
                  placeholder="e.g., March 15–22, 2025"
                  value={quizData.exactDates || ""}
                  onChange={(e) => updateQuizData({ exactDates: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2"
                  data-testid="input-exact-dates"
                />
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover-elevate ${quizData.travelDates === "flexible" ? "ring-2 ring-primary bg-primary/5" : ""}`}
            onClick={() => updateQuizData({ travelDates: "flexible" })}
            data-testid="card-dates-flexible"
          >
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Flexible (range)</h3>
              {quizData.travelDates === "flexible" && (
                <Input
                  placeholder="e.g., Sometime in Spring 2025"
                  value={quizData.flexibleDates || ""}
                  onChange={(e) => updateQuizData({ flexibleDates: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2"
                  data-testid="input-flexible-dates"
                />
              )}
            </CardContent>
          </Card>

          <SelectionCard
            title="Not sure yet"
            selected={quizData.travelDates === "not-sure"}
            onClick={() => updateQuizData({ travelDates: "not-sure" })}
            testId="card-dates-not-sure"
          />
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!quizData.travelDates} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderRegionScreen = () => {
    const domesticRegions = [
      { value: "new-england", label: "New England", subtitle: "Coastal towns, fall leaves, colonial charm" },
      { value: "mid-atlantic", label: "Mid-Atlantic", subtitle: "Museums, history, iconic cities" },
      { value: "southeast", label: "Southeast", subtitle: "Beaches, hospitality, warm evenings" },
      { value: "midwest", label: "Midwest", subtitle: "Lakes, prairies, Americana" },
      { value: "mountains-west", label: "Mountains West", subtitle: "Rockies, alpine towns, wilderness" },
      { value: "southwest", label: "Southwest", subtitle: "Desert beauty, canyonlands, stargazing" },
      { value: "pacific-coast", label: "Pacific Coast", subtitle: "Cliffs, forests, ocean drives" },
      { value: "surprise", label: "Not sure — surprise me", subtitle: "" },
    ];

    const internationalRegions = [
      { value: "europe", label: "Europe", subtitle: "Old-world ports, art, storied streets" },
      { value: "asia", label: "Asia", subtitle: "Rich traditions, spice markets, bright cities" },
      { value: "south-america", label: "South America", subtitle: "Bold colors, rhythm, wild landscapes" },
      { value: "australia-nz", label: "Australia + New Zealand", subtitle: "Rugged coasts, vast skies" },
      { value: "africa", label: "Africa", subtitle: "Deserts, wildlife, ancient kingdoms" },
      { value: "tropical-islands", label: "Tropical Islands", subtitle: "Warm seas, slow days, soft sands" },
      { value: "surprise", label: "Not sure — surprise me", subtitle: "" },
    ];

    const regions = quizData.tripType === "international" ? internationalRegions : domesticRegions;
    const regionValue = quizData.tripType === "international" ? quizData.internationalRegion : quizData.usRegion;

    return (
      <motion.div
        key="region"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          {quizData.tripType === "international"
            ? "What horizon calls to you most?"
            : "What region of the United States calls to you most?"}
        </h2>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
          {regions.map(region => (
            <SelectionCard
              key={region.value}
              title={region.label}
              subtitle={region.subtitle}
              selected={regionValue === region.value}
              onClick={() =>
                quizData.tripType === "international"
                  ? updateQuizData({ internationalRegion: region.value })
                  : updateQuizData({ usRegion: region.value })
              }
              testId={`card-region-${region.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!regionValue}
            data-testid="button-next"
          >
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderTripDesireScreen = () => {
    const options = [
      { value: "rest", label: "Rest + Wake Up Slow", icon: Sunset },
      { value: "culture", label: "Culture + History + Learning", icon: BookOpen },
      { value: "thrill", label: "Thrill + Adventure + Movement", icon: Zap },
      { value: "magic", label: "Magic + Wonder + Bucket-List Moments", icon: Sparkles },
      { value: "connection", label: "Connection + Presence + Shared Memories", icon: Heart },
    ];

    return (
      <motion.div
        key="desire"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Star className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          What do you want most from this trip?
        </h2>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              icon={opt.icon}
              title={opt.label}
              selected={quizData.tripDesire === opt.value}
              onClick={() => updateQuizData({ tripDesire: opt.value })}
              testId={`card-desire-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!quizData.tripDesire} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderPostcardScreen = () => {
    const domesticImages = [
      { value: "mountains", label: "Mountain peaks at sunrise", icon: Mountain },
      { value: "small-town", label: "Small-town main street at dusk", icon: Building },
      { value: "beach", label: "White sand and gentle surf", icon: Waves },
      { value: "redwoods", label: "Redwood forest canopy", icon: Trees },
      { value: "skyline", label: "Neon skyline at night", icon: Building },
      { value: "canyon", label: "Canyon landscape under stars", icon: Mountain },
    ];

    const internationalImages = [
      { value: "mountains", label: "Mountain peaks at sunrise", icon: Mountain },
      { value: "lantern-alleys", label: "Lantern-lit alleyways", icon: Building },
      { value: "whitewashed", label: "Whitewashed buildings above blue sea", icon: Waves },
      { value: "rainforest", label: "Rainforest canopy with mist", icon: Trees },
      { value: "medieval", label: "Medieval town square", icon: Building },
      { value: "desert", label: "Desert dunes under stars", icon: Palmtree },
    ];

    const images = quizData.tripType === "international" ? internationalImages : domesticImages;
    const imageValue = quizData.tripType === "international" ? quizData.internationalPostcard : quizData.postcardImage;

    return (
      <motion.div
        key="postcard"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          If your family could drop into a postcard right now, what's the image?
        </h2>

        <div className="space-y-3">
          {images.map(img => (
            <SelectionCard
              key={img.value}
              icon={img.icon}
              title={img.label}
              selected={imageValue === img.value}
              onClick={() =>
                quizData.tripType === "international"
                  ? updateQuizData({ internationalPostcard: img.value })
                  : updateQuizData({ postcardImage: img.value })
              }
              testId={`card-postcard-${img.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!imageValue} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderFavoriteMediaScreen = () => (
    <motion.div
      key="media"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-xl mx-auto px-4"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-serif text-center">
        Tell us your family's favorite book or movie
      </h2>
      <p className="text-muted-foreground text-center mb-8">
        This helps us understand your family's vibe and interests.
      </p>

      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder="e.g., We love the Harry Potter series, or our favorite movie is Up!"
            value={quizData.favoriteMedia || ""}
            onChange={(e) => updateQuizData({ favoriteMedia: e.target.value })}
            className="min-h-[100px] text-base"
            data-testid="input-favorite-media"
          />
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={handleBack} data-testid="button-back">
          <ChevronLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleNext} data-testid="button-next">
          Next
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderAbsoluteNosScreen = () => {
    const options = [
      { value: "long-drives", label: "Long drives" },
      { value: "crowded", label: "Crowded attractions" },
      { value: "cold", label: "Cold climate" },
      { value: "heat", label: "Heat + humidity" },
      { value: "tight-schedules", label: "Tight schedules" },
      { value: "hostels", label: "Hostels" },
      { value: "spicy-food", label: "Spicy food" },
      { value: "expensive-restaurants", label: "Expensive restaurants" },
      { value: "tourist-traps", label: "Tourist-trap locations" },
      { value: "rainy-season", label: "Rainy season" },
    ];

    return (
      <motion.div
        key="absolute-nos"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <X className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-serif text-center">
          Are there any absolute NOs?
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Check any that apply
        </p>

        <div className="grid grid-cols-2 gap-3">
          {options.map(opt => (
            <Card
              key={opt.value}
              className={`cursor-pointer transition-all hover-elevate ${quizData.absoluteNos?.includes(opt.value) ? "ring-2 ring-primary bg-primary/5" : ""}`}
              onClick={() => toggleArrayItem("absoluteNos", opt.value)}
              data-testid={`card-no-${opt.value}`}
            >
              <CardContent className="flex items-center gap-2 p-3">
                <Checkbox
                  checked={quizData.absoluteNos?.includes(opt.value)}
                  onCheckedChange={() => toggleArrayItem("absoluteNos", opt.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm">{opt.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderDayFullnessScreen = () => {
    const options = [
      { value: "70-chill", label: "70% chill, 30% planned" },
      { value: "50-50", label: "50/50 balance" },
      { value: "30-chill", label: "30% chill, 70% planned" },
    ];

    return (
      <motion.div
        key="day-fullness"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          How full do you want your days?
        </h2>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              title={opt.label}
              selected={quizData.dayFullness === opt.value}
              onClick={() => updateQuizData({ dayFullness: opt.value })}
              testId={`card-fullness-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!quizData.dayFullness} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderBudgetStyleScreen = () => {
    const options = [
      { value: "budget-saver", label: "Budget Saver", subtitle: "Get the most for your money" },
      { value: "smart-comfortable", label: "Smart & Comfortable", subtitle: "Balance of value and comfort" },
      { value: "treat-yourself", label: "Treat Yourself", subtitle: "Upgrade the experience" },
      { value: "bucket-list", label: "Bucket List Splurge", subtitle: "Once-in-a-lifetime moments" },
    ];

    return (
      <motion.div
        key="budget-style"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-xl mx-auto px-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <DollarSign className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 font-serif text-center">
          Which budget style fits this trip?
        </h2>

        <div className="space-y-3">
          {options.map(opt => (
            <SelectionCard
              key={opt.value}
              title={opt.label}
              subtitle={opt.subtitle}
              selected={quizData.budgetStyle === opt.value}
              onClick={() => updateQuizData({ budgetStyle: opt.value })}
              testId={`card-budgetstyle-${opt.value}`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!quizData.budgetStyle} data-testid="button-next">
            Next
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  // Determine which screen to render based on current index and trip type
  const renderScreen = () => {
    // Trip type selection is now screen 0
    if (currentScreen === 0) return renderTripTypeScreen();

    // After trip type selection, different flows
    if (quizData.tripType === "staycation") {
      // Staycation flow: 7-8 screens after trip type
      const staycationScreens = [
        renderTravelersScreen,      // 1
        renderStaycationTimeScreen, // 2
        renderStaycationDistanceScreen, // 3
        renderStaycationGoalScreen, // 4
        ...(quizData.kids > 0 ? [renderKidActivitiesScreen] : []), // 5 (conditional)
        renderAccessibilityScreen,  // 5 or 6
        renderStaycationBudgetScreen, // 6 or 7
        renderLocationScreen,       // 7 or 8
      ];
      const screenIndex = currentScreen - 1;
      if (screenIndex >= 0 && screenIndex < staycationScreens.length) {
        return staycationScreens[screenIndex]();
      }
    } else {
      // Domestic/International flow: 12-13 screens after trip type
      const tripScreens = [
        renderTravelersScreen,      // 1
        renderTripLengthScreen,     // 2
        renderDatesScreen,          // 3
        renderRegionScreen,         // 4
        renderTripDesireScreen,     // 5
        renderPostcardScreen,       // 6
        renderFavoriteMediaScreen,  // 7
        ...(quizData.kids > 0 ? [renderKidActivitiesScreen] : []), // 8 (conditional)
        renderAccessibilityScreen,  // 8 or 9
        renderAbsoluteNosScreen,    // 9 or 10
        renderDayFullnessScreen,    // 10 or 11
        renderBudgetStyleScreen,    // 11 or 12
        renderLocationScreen,       // 12 or 13
      ];
      const screenIndex = currentScreen - 1;
      if (screenIndex >= 0 && screenIndex < tripScreens.length) {
        return tripScreens[screenIndex]();
      }
    }

    return renderTripTypeScreen();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <Plane className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TripPirate</span>
            </Link>

            {/* Navigation Links - hidden on mobile */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Privacy</Link>
            </nav>

            {/* Progress bar - always visible since quiz starts immediately */}
            <div className="flex-1 max-w-xs">
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Log in
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/")}
                data-testid="button-exit"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-8 lg:py-16">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-background border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-bold">TripPirate</span>
              <span className="text-muted-foreground text-sm">— Family adventures, finally within reach.</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <a href="mailto:contact@trippirate.com" className="hover:text-foreground transition-colors">Contact</a>
            </nav>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            © 2025 TripPirate
          </div>
        </div>
      </footer>
    </div>
  );
}
