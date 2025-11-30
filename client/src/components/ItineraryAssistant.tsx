import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ItineraryRecommendation } from "@shared/schema";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface DayActivities {
  dayNumber: number;
  cityName: string;
  countryName: string;
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  activities: string[];
}

interface SuggestedChange {
  dayNumber: number;
  action: "add" | "remove" | "replace";
  activities: string[];
}

interface ItineraryAssistantProps {
  itinerary: ItineraryRecommendation;
  numberOfTravelers: number;
  tripType: "international" | "domestic" | "staycation";
  quizPreferences: {
    tripGoal?: string;
    placeType?: string;
    dayPace?: string;
    spendingPriority?: string;
    travelersType?: string;
    kidsAges?: string[];
    accommodationType?: string;
    mustHave?: string;
  };
  currentDayPlans: DayActivities[];
  onApplyChanges?: (changes: SuggestedChange[]) => void;
}

export default function ItineraryAssistant({
  itinerary,
  numberOfTravelers,
  tripType,
  quizPreferences,
  currentDayPlans,
  onApplyChanges,
}: ItineraryAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [pendingChanges, setPendingChanges] = useState<SuggestedChange[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest("POST", "/api/ai/itinerary-assistant", {
        itinerary,
        numberOfTravelers,
        tripType,
        quizPreferences,
        conversationHistory: messages,
        userMessage,
        currentDayPlans,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
      if (data.suggestedChanges && data.suggestedChanges.length > 0) {
        setPendingChanges(data.suggestedChanges);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage = inputValue.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputValue("");
    setPendingChanges([]);
    chatMutation.mutate(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplyChanges = () => {
    if (onApplyChanges && pendingChanges.length > 0) {
      onApplyChanges(pendingChanges);
      setPendingChanges([]);
      toast({
        title: "Changes Applied",
        description: "Your itinerary has been updated.",
      });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const suggestedQuestions = [
    "What are the must-see attractions?",
    "Suggest kid-friendly activities",
    "What local foods should we try?",
    "How should we pace our days?",
    "Any tips for saving money?",
  ];

  if (!isExpanded) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Itinerary Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  Ask questions or get help refining your trip
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsExpanded(true)}
              variant="outline"
              size="sm"
              data-testid="button-expand-assistant"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Open Assistant
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Itinerary Assistant</CardTitle>
              <p className="text-sm text-muted-foreground">
                Powered by Pebbles - your travel planning buddy
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(false)}
            data-testid="button-collapse-assistant"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Hi! I can help you refine your itinerary, answer questions about your destinations, 
              or suggest activities. What would you like to know?
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover-elevate px-3 py-1.5"
                  onClick={() => {
                    setInputValue(question);
                  }}
                  data-testid={`badge-suggested-question-${index}`}
                >
                  {question}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {pendingChanges.length > 0 && (
          <div className="p-3 bg-accent/50 rounded-lg border border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Suggested Changes</p>
                <p className="text-xs text-muted-foreground">
                  {pendingChanges.length} change(s) to your itinerary
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingChanges([])}
                  data-testid="button-dismiss-changes"
                >
                  <X className="w-3 h-3 mr-1" />
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyChanges}
                  data-testid="button-apply-changes"
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Ask about your itinerary..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={chatMutation.isPending}
            data-testid="input-assistant-message"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || chatMutation.isPending}
            size="icon"
            data-testid="button-send-message"
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
