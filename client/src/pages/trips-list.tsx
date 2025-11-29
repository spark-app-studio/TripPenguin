import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import type { TripWithDestinations } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Calendar, Users, Trash2, Edit, Plane, LogOut, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function TripsList() {
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: trips, isLoading } = useQuery<TripWithDestinations[]>({
    queryKey: ["/api/trips"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      setLocation("/");
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      await apiRequest("DELETE", `/api/trips/${tripId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setDeleteDialogOpen(false);
      setTripToDelete(null);
    },
  });

  const handleDeleteClick = (tripId: string) => {
    setTripToDelete(tripId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (tripToDelete) {
      deleteTripMutation.mutate(tripToDelete);
    }
  };

  const getSeasonDisplay = (season: string) => {
    const seasonMap: Record<string, string> = {
      summer: "Summer",
      winter: "Winter Break",
      spring: "Spring Break",
      fall: "Fall",
    };
    return seasonMap[season] || season;
  };

  const getTravelersDisplay = (travelers: string, count: number) => {
    if (travelers === "just_me") return "Solo trip";
    return `${count} travelers`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading your trips...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header/Nav */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <Plane className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TripPirate</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/trips" className="text-foreground text-sm font-medium transition-colors">My Trips</Link>
              <Link href="/getting-started" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">New Adventure</Link>
              <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.firstName || "Account"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-muted-foreground">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  className="cursor-pointer"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold font-serif mb-2">My Trips</h1>
              <p className="text-lg text-muted-foreground">
                Plan, budget, and book your dream adventures
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setLocation("/trip/new")}
              className="gap-2"
              data-testid="button-new-trip"
            >
              <Plus className="w-5 h-5" />
              New Trip
            </Button>
          </div>

        {!trips || trips.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="max-w-md mx-auto">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start planning your first adventure and make your travel dreams come true!
                </p>
                <Button
                  size="lg"
                  onClick={() => setLocation("/trip/new")}
                  className="gap-2"
                  data-testid="button-first-trip"
                >
                  <Plus className="w-5 h-5" />
                  Plan Your First Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                className="hover-elevate cursor-pointer transition-all"
                data-testid={`card-trip-${trip.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">
                        {trip.destinations && trip.destinations.length > 0 ? (
                          trip.destinations
                            .sort((a, b) => a.order - b.order)
                            .map(d => d.cityName)
                            .join(" → ")
                        ) : (
                          `${trip.travelSeason && getSeasonDisplay(trip.travelSeason)} Trip`
                        )}
                      </CardTitle>
                      {trip.destinations && trip.destinations.length > 0 && (
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`text-country-${trip.id}`}>
                          {[...new Set(trip.destinations.map(d => d.countryName))].join(", ")}
                        </p>
                      )}
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" />
                          {getTravelersDisplay(trip.travelers, trip.numberOfTravelers)}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          {trip.tripDuration} days
                        </div>
                        {trip.destinations && trip.destinations.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            {trip.destinations.length} {trip.destinations.length === 1 ? 'destination' : 'destinations'}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/trip/${trip.id}`);
                        }}
                        data-testid={`button-edit-${trip.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(trip.id);
                        }}
                        data-testid={`button-delete-${trip.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setLocation(`/trip/${trip.id}`)}
                    data-testid={`button-view-${trip.id}`}
                  >
                    View Trip
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-background border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-bold">TripPirate</span>
              <span className="text-muted-foreground">— Family adventures, finally within reach.</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </nav>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © 2025 TripPirate
          </div>
        </div>
      </footer>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this trip and all associated data (destinations, budget, bookings).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
