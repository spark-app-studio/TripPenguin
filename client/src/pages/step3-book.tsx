import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProgressStepper } from "@/components/ProgressStepper";
import { BookingItem } from "@/components/BookingItem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Sparkles, CheckCircle } from "lucide-react";

interface BookingData {
  id: string;
  itemName: string;
  category: string;
  status: "not_started" | "in_progress" | "booked";
  estimatedCost: number;
  actualCost?: number;
}

interface Step3BookProps {
  budgetCategories: Array<{ category: string; estimatedCost: number }>;
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

export default function Step3Book({ budgetCategories, onComplete, onBack }: Step3BookProps) {
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

  const updateBookingStatus = (id: string, status: BookingData["status"]) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleAIClick = (booking: BookingData) => {
    setSelectedBooking(booking);
    setAiDialogOpen(true);
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

      {/* AI Booking Dialog (Stub) */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <DialogTitle>AI Booking Assistant</DialogTitle>
            </div>
            <DialogDescription>
              Coming Soon - AI-powered booking assistance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-md bg-muted/50">
              <p className="font-medium mb-2">Booking: {selectedBooking?.itemName}</p>
              <p className="text-sm text-muted-foreground">
                Our AI assistant will help you find and book {selectedBooking?.category} options that match your budget and preferences.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-primary">🤖 AI Agent will:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Search multiple booking sites</li>
                  <li>• Compare prices and reviews</li>
                  <li>• Suggest best options within budget</li>
                  <li>• Handle booking process</li>
                </ul>
              </div>

              <div className="p-3 rounded-md bg-muted text-center">
                <p className="text-sm font-semibold mb-1">This feature is in development</p>
                <p className="text-xs text-muted-foreground">
                  For now, use your favorite booking sites and update the status manually
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setAiDialogOpen(false)} data-testid="button-close-ai-dialog">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
