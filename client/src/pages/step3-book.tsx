import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProgressStepper } from "@/components/ProgressStepper";
import { BookingItem } from "@/components/BookingItem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Sparkles, CheckCircle, Loader2, ExternalLink, DollarSign, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingData {
  id: string;
  itemName: string;
  category: string;
  status: "not_started" | "in_progress" | "booked";
  estimatedCost: number;
  actualCost?: number;
}

interface BookingRecommendation {
  title: string;
  description: string;
  estimatedPrice: number;
  provider: string;
  pros: string[];
  cons: string[];
  bookingTips: string;
}

interface TripContext {
  destinations: string[];
  travelers: number;
  tripDuration: number;
  travelSeason: string;
}

interface Step3BookProps {
  budgetCategories: Array<{ category: string; estimatedCost: number }>;
  tripContext: TripContext;
  onComplete: (bookings: BookingData[]) => void;
  onBack: () => void;
}

const defaultBookingItems: Record<string, string[]> = {
  flights: ["Roundtrip flights for all travelers"],
  housing: ["Accommodation bookings"],
  transportation: ["Train/bus passes", "Airport transfers"],
  fun: ["Museum tickets", "Guided tours", "Activity reservations"],
  preparation: ["Travel insurance", "Power adapters", "Luggage"],
};

export default function Step3Book({ budgetCategories, tripContext, onComplete, onBack }: Step3BookProps) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingData[]>(() => {
    const items: BookingData[] = [];
    budgetCategories.forEach((cat) => {
      const categoryItems = defaultBookingItems[cat.category] || [cat.category];
      categoryItems.forEach((itemName, index) => {
        items.push({
          id: `${cat.category}-${index}`,
          itemName,
          category: cat.category,
          status: "not_started",
          estimatedCost: categoryItems.length > 1 ? cat.estimatedCost / categoryItems.length : cat.estimatedCost,
        });
      });
    });
    return items;
  });

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [recommendations, setRecommendations] = useState<BookingRecommendation[]>([]);

  const recommendationsMutation = useMutation({
    mutationFn: async (booking: BookingData) => {
      const response = await apiRequest("POST", "/api/ai/booking-recommendations", {
        itemName: booking.itemName,
        category: booking.category,
        budget: booking.estimatedCost,
        destinations: tripContext.destinations,
        travelers: tripContext.travelers,
        tripDuration: tripContext.tripDuration,
        travelSeason: tripContext.travelSeason,
      });
      const data = await response.json();
      return data as BookingRecommendation[];
    },
    onSuccess: (data) => {
      setRecommendations(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBookingStatus = (id: string, status: BookingData["status"]) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleAIClick = (booking: BookingData) => {
    setSelectedBooking(booking);
    setRecommendations([]);
    setAiDialogOpen(true);
    recommendationsMutation.mutate(booking);
  };

  // Calculate progress
  const totalItems = bookings.length;
  const bookedItems = bookings.filter(b => b.status === "booked").length;
  const inProgressItems = bookings.filter(b => b.status === "in_progress").length;
  const progressPercent = (bookedItems / totalItems) * 100;

  // Group bookings by status
  const notStarted = bookings.filter(b => b.status === "not_started");
  const inProgress = bookings.filter(b => b.status === "in_progress");
  const booked = bookings.filter(b => b.status === "booked");

  const handleContinue = () => {
    onComplete(bookings);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProgressStepper currentStep={3} completedSteps={[1, 2]} />

        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Book Your Trip
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Organize and track all your bookings in one place
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Booking Progress</CardTitle>
                  <CardDescription>Track your booking status</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary" data-testid="text-booked-count">
                    {bookedItems}/{totalItems}
                  </p>
                  <p className="text-sm text-muted-foreground">Items booked</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressPercent} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">{notStarted.length}</p>
                  <p className="text-sm text-muted-foreground">To Do</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{inProgressItems}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{bookedItems}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" data-testid="tab-all">
                All <Badge variant="secondary" className="ml-2">{totalItems}</Badge>
              </TabsTrigger>
              <TabsTrigger value="not_started" data-testid="tab-not-started">
                To Do <Badge variant="secondary" className="ml-2">{notStarted.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" data-testid="tab-in-progress">
                In Progress <Badge variant="secondary" className="ml-2">{inProgressItems}</Badge>
              </TabsTrigger>
              <TabsTrigger value="booked" data-testid="tab-booked">
                Booked <Badge variant="secondary" className="ml-2">{bookedItems}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6 space-y-4">
              {bookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  {...booking}
                  onStatusChange={(status) => updateBookingStatus(booking.id, status)}
                  onAIBookingClick={() => handleAIClick(booking)}
                />
              ))}
            </TabsContent>

            <TabsContent value="not_started" className="mt-6 space-y-4">
              {notStarted.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <p>All items have been started!</p>
                  </CardContent>
                </Card>
              ) : (
                notStarted.map((booking) => (
                  <BookingItem
                    key={booking.id}
                    {...booking}
                    onStatusChange={(status) => updateBookingStatus(booking.id, status)}
                    onAIBookingClick={() => handleAIClick(booking)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="in_progress" className="mt-6 space-y-4">
              {inProgress.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <p>No items in progress</p>
                  </CardContent>
                </Card>
              ) : (
                inProgress.map((booking) => (
                  <BookingItem
                    key={booking.id}
                    {...booking}
                    onStatusChange={(status) => updateBookingStatus(booking.id, status)}
                    onAIBookingClick={() => handleAIClick(booking)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="booked" className="mt-6 space-y-4">
              {booked.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <p>No items booked yet</p>
                  </CardContent>
                </Card>
              ) : (
                booked.map((booking) => (
                  <BookingItem
                    key={booking.id}
                    {...booking}
                    onStatusChange={(status) => updateBookingStatus(booking.id, status)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8">
            <Button
              variant="outline"
              onClick={onBack}
              data-testid="button-back-to-plan"
            >
              Back to Planning
            </Button>
            <Button
              size="lg"
              onClick={handleContinue}
              className="min-h-0"
              data-testid="button-view-summary"
            >
              View Trip Summary
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Booking Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <DialogTitle>AI Booking Recommendations</DialogTitle>
            </div>
            <DialogDescription>
              {selectedBooking?.itemName} • Budget: ${selectedBooking?.estimatedCost}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {recommendationsMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Finding the best options for you...</p>
              </div>
            )}

            {recommendationsMutation.isError && (
              <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Failed to load recommendations</p>
                <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
              </div>
            )}

            {!recommendationsMutation.isPending && recommendations.length > 0 && (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="overflow-hidden" data-testid={`recommendation-${index}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{rec.title}</CardTitle>
                          <CardDescription className="mt-1">{rec.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                            <DollarSign className="w-5 h-5" />
                            {rec.estimatedPrice}
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.provider}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                            <ThumbsUp className="w-4 h-4" />
                            <span>Pros</span>
                          </div>
                          <ul className="space-y-1">
                            {rec.pros.map((pro, i) => (
                              <li key={i} className="text-sm text-muted-foreground">• {pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                            <ThumbsDown className="w-4 h-4" />
                            <span>Cons</span>
                          </div>
                          <ul className="space-y-1">
                            {rec.cons.map((con, i) => (
                              <li key={i} className="text-sm text-muted-foreground">• {con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-primary mb-1">Booking Tip</p>
                            <p className="text-sm text-muted-foreground">{rec.bookingTips}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="p-4 rounded-md bg-muted/50 border">
                  <p className="text-sm font-medium mb-2">Ready to book?</p>
                  <p className="text-xs text-muted-foreground">
                    These are AI-generated recommendations to help guide your search. Visit the suggested providers' websites to complete your booking, then update the status in your checklist.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setAiDialogOpen(false)} data-testid="button-close-ai-dialog">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
