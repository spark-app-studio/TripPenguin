import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Send, 
  Loader2, 
  Clock, 
  MapPin, 
  Check, 
  X, 
  GripVertical,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Utensils,
  Camera,
  Compass,
  TreeDeciduous,
  Building2,
  Coffee
} from "lucide-react";
import PenguinLogo from "./PenguinLogo";

interface DayPlannerMessage {
  role: "assistant" | "user";
  content: string;
}

interface PlannedActivity {
  id: string;
  time: string;
  activity: string;
  duration: string;
  category: "must-see" | "hidden-gem" | "food" | "outdoor" | "cultural" | "relaxation" | "transport";
  notes?: string;
  selected?: boolean;
}

interface DayPlannerResponse {
  message: string;
  suggestedPlan?: PlannedActivity[];
  needsMoreInfo: boolean;
  followUpQuestion?: string;
  isComplete: boolean;
}

interface QuizPreferences {
  tripGoal?: string;
  placeType?: string;
  dayPace?: string;
  spendingPriority?: string;
  travelersType?: string;
  kidsAges?: string[];
  accommodationType?: string;
  mustHave?: string;
}

interface AIDayPlannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityName: string;
  countryName: string;
  dayNumber: number;
  dayInCity: number;
  totalDaysInCity: number;
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  existingActivities: string[];
  numberOfTravelers: number;
  tripType: "international" | "domestic" | "staycation";
  quizPreferences: QuizPreferences;
  onConfirmPlan: (activities: string[]) => void;
}

const categoryIcons: Record<PlannedActivity["category"], typeof Camera> = {
  "must-see": Camera,
  "hidden-gem": Compass,
  "food": Utensils,
  "outdoor": TreeDeciduous,
  "cultural": Building2,
  "relaxation": Coffee,
  "transport": MapPin,
};

const categoryColors: Record<PlannedActivity["category"], string> = {
  "must-see": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  "hidden-gem": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  "food": "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
  "outdoor": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  "cultural": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  "relaxation": "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
  "transport": "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
};

export default function AIDayPlanner({
  open,
  onOpenChange,
  cityName,
  countryName,
  dayNumber,
  dayInCity,
  totalDaysInCity,
  isArrivalDay,
  isDepartureDay,
  existingActivities,
  numberOfTravelers,
  tripType,
  quizPreferences,
  onConfirmPlan,
}: AIDayPlannerProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<DayPlannerMessage[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlannedActivity[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showPlan, setShowPlan] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !hasStarted) {
      setHasStarted(true);
      startConversation();
    }
  }, [open, hasStarted]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/ai/day-planner", {
        cityName,
        countryName,
        dayNumber,
        dayInCity,
        totalDaysInCity,
        isArrivalDay,
        isDepartureDay,
        existingActivities,
        numberOfTravelers,
        tripType,
        quizPreferences,
        conversationHistory: [],
        currentPlan: [],
      });
      const response = (await res.json()) as DayPlannerResponse;

      setMessages([{ role: "assistant", content: response.message }]);
      if (response.suggestedPlan && response.suggestedPlan.length > 0) {
        setCurrentPlan(response.suggestedPlan.map((a: PlannedActivity) => ({ ...a, selected: true })));
      }
      setIsComplete(response.isComplete);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Connection Error",
        description: "Couldn't start the day planner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newMessage: DayPlannerMessage = { role: "user", content: userInput.trim() };
    const updatedHistory = [...messages, newMessage];
    setMessages(updatedHistory);
    setUserInput("");
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/ai/day-planner", {
        cityName,
        countryName,
        dayNumber,
        dayInCity,
        totalDaysInCity,
        isArrivalDay,
        isDepartureDay,
        existingActivities,
        numberOfTravelers,
        tripType,
        quizPreferences,
        conversationHistory: updatedHistory,
        userMessage: userInput.trim(),
        currentPlan: currentPlan.filter(a => a.selected),
      });
      const response = (await res.json()) as DayPlannerResponse;

      setMessages([...updatedHistory, { role: "assistant", content: response.message }]);
      if (response.suggestedPlan && response.suggestedPlan.length > 0) {
        setCurrentPlan(response.suggestedPlan.map((a: PlannedActivity) => ({ ...a, selected: true })));
      }
      setIsComplete(response.isComplete);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Connection Error",
        description: "Couldn't send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleActivity = (id: string) => {
    setCurrentPlan(plan => 
      plan.map(a => a.id === id ? { ...a, selected: !a.selected } : a)
    );
  };

  const handleConfirm = () => {
    const selectedActivities = currentPlan
      .filter(a => a.selected)
      .map(a => `${a.time} - ${a.activity}`);
    
    onConfirmPlan(selectedActivities);
    
    setMessages([]);
    setCurrentPlan([]);
    setIsComplete(false);
    setHasStarted(false);
    onOpenChange(false);
    
    toast({
      title: "Day Plan Confirmed",
      description: `Added ${selectedActivities.length} activities to Day ${dayNumber}.`,
    });
  };

  const handleClose = () => {
    setMessages([]);
    setCurrentPlan([]);
    setIsComplete(false);
    setHasStarted(false);
    onOpenChange(false);
  };

  const selectedCount = currentPlan.filter(a => a.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <PenguinLogo className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>Plan Day {dayNumber}</span>
                <Badge variant="secondary" className="text-xs">
                  {cityName}
                </Badge>
              </div>
              <p className="text-sm font-normal text-muted-foreground">
                {isArrivalDay ? "Arrival Day" : isDepartureDay ? "Departure Day" : `Day ${dayInCity} of ${totalDaysInCity}`}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-6" ref={scrollRef}>
            <div className="py-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <PenguinLogo className="w-5 h-5" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <PenguinLogo className="w-5 h-5" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Pebbles is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {currentPlan.length > 0 && (
            <div className="border-t shrink-0">
              <button
                onClick={() => setShowPlan(!showPlan)}
                className="w-full px-6 py-3 flex items-center justify-between hover-elevate"
                data-testid="button-toggle-plan"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    Suggested Day Plan ({selectedCount} of {currentPlan.length} selected)
                  </span>
                </div>
                {showPlan ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {showPlan && (
                <ScrollArea className="max-h-[200px] px-6 pb-4">
                  <div className="space-y-2">
                    {currentPlan.map((activity) => {
                      const Icon = categoryIcons[activity.category];
                      return (
                        <Card
                          key={activity.id}
                          className={`p-3 transition-all ${
                            activity.selected
                              ? "border-primary/50 bg-primary/5"
                              : "opacity-60"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={activity.selected}
                              onCheckedChange={() => toggleActivity(activity.id)}
                              className="mt-1"
                              data-testid={`checkbox-activity-${activity.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${categoryColors[activity.category]}`}
                                >
                                  <Icon className="w-3 h-3 mr-1" />
                                  {activity.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {activity.time} ({activity.duration})
                                </span>
                              </div>
                              <p className="text-sm font-medium mt-1">{activity.activity}</p>
                              {activity.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5">{activity.notes}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type your response..."
              disabled={isLoading}
              className="flex-1"
              data-testid="input-day-planner-message"
            />
            <Button
              onClick={sendMessage}
              disabled={!userInput.trim() || isLoading}
              size="icon"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {currentPlan.length > 0 && (
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                data-testid="button-cancel-plan"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                className="flex-1"
                data-testid="button-confirm-plan"
              >
                <Check className="w-4 h-4 mr-2" />
                Add {selectedCount} Activities
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
