import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import type { TripWithDestinations } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, MapPin, Calendar, Users, Trash2, Edit, LogOut, User, Clock, Star, ChevronRight, History, Luggage, Mail, MapPinned } from "lucide-react";
import { PenguinLogo } from "@/components/PenguinLogo";
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
import { useState, useMemo } from "react";
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

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    // Guard against Invalid Date
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate?: string | null, endDate?: string | null) => {
    const start = formatDate(startDate);
    if (!start) return null;
    const end = formatDate(endDate);
    if (!end || start === end) return start;
    return `${start} — ${end}`;
  };

  // Helper to validate and parse date strings
  const parseValidDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    // Check for valid date (not NaN)
    if (isNaN(date.getTime())) return null;
    return date;
  };

  // Helper to calculate effective end date
  const getEffectiveEndDate = (trip: TripWithDestinations): Date | null => {
    if (trip.endDate) {
      const end = parseValidDate(trip.endDate);
      if (end) return end;
    }
    // If no end date but has start date and duration, calculate it
    if (trip.startDate && trip.tripDuration) {
      const start = parseValidDate(trip.startDate);
      if (start) {
        const end = new Date(start);
        end.setDate(end.getDate() + trip.tripDuration);
        return end;
      }
    }
    return null;
  };

  // Categorize trips into current (upcoming/in-progress) and past
  const { currentTrips, pastTrips } = useMemo(() => {
    if (!trips) return { currentTrips: [], pastTrips: [] };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const current: TripWithDestinations[] = [];
    const past: TripWithDestinations[] = [];
    
    trips.forEach(trip => {
      const effectiveEnd = getEffectiveEndDate(trip);
      
      if (effectiveEnd) {
        // Clone date to avoid mutating cached values
        const endForCompare = new Date(effectiveEnd.getTime());
        endForCompare.setHours(23, 59, 59, 999);
        if (endForCompare < today) {
          past.push(trip);
        } else {
          current.push(trip);
        }
      } else {
        // No dates at all - consider current/planning phase
        current.push(trip);
      }
    });
    
    // Sort current trips by start date (soonest first)
    current.sort((a, b) => {
      const startA = parseValidDate(a.startDate);
      const startB = parseValidDate(b.startDate);
      if (!startA && !startB) return 0;
      if (!startA) return 1;
      if (!startB) return -1;
      return startA.getTime() - startB.getTime();
    });
    
    // Sort past trips by effective end date (most recent first)
    past.sort((a, b) => {
      const endA = getEffectiveEndDate(a);
      const endB = getEffectiveEndDate(b);
      if (!endA && !endB) return 0;
      if (!endA) return 1;
      if (!endB) return -1;
      return endB.getTime() - endA.getTime();
    });
    
    return { currentTrips: current, pastTrips: past };
  }, [trips]);

  // Get trip status badge
  const getTripStatus = (trip: TripWithDestinations) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const effectiveEnd = getEffectiveEndDate(trip);
    
    if (trip.startDate && effectiveEnd) {
      const startDate = parseValidDate(trip.startDate);
      if (!startDate) return { label: "Planning", variant: "outline" as const };
      
      // Clone dates to avoid mutating cached values
      const startForCompare = new Date(startDate.getTime());
      const endForCompare = new Date(effectiveEnd.getTime());
      startForCompare.setHours(0, 0, 0, 0);
      endForCompare.setHours(23, 59, 59, 999);
      
      if (today >= startForCompare && today <= endForCompare) {
        return { label: "In Progress", variant: "default" as const };
      } else if (today < startForCompare) {
        const daysUntil = Math.ceil((startForCompare.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 30) {
          return { label: `${daysUntil} days away`, variant: "secondary" as const };
        }
        return { label: "Upcoming", variant: "outline" as const };
      }
    }
    return { label: "Planning", variant: "outline" as const };
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
              <PenguinLogo size="md" />
              <span className="text-xl font-bold">TripPenguin</span>
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
              onClick={() => setLocation("/getting-started")}
              className="gap-2"
              data-testid="button-new-trip"
            >
              <Plus className="w-5 h-5" />
              New Trip
            </Button>
          </div>

          {/* User Profile Section */}
          <Card className="mb-8" data-testid="card-user-profile">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt={`${user.firstName || "User"}'s profile`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold" data-testid="text-user-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.firstName || "Traveler"}
                  </h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    {user?.email && (
                      <span className="flex items-center gap-1" data-testid="text-user-email">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                    )}
                    {(user?.city || user?.state) && (
                      <span className="flex items-center gap-1" data-testid="text-user-location">
                        <MapPinned className="w-3 h-3" />
                        {[user.city, user.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="outline" className="gap-1">
                      <Luggage className="w-3 h-3" />
                      {trips?.length || 0} {trips?.length === 1 ? "trip" : "trips"}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <History className="w-3 h-3" />
                      {pastTrips.length} completed
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  onClick={() => setLocation("/getting-started")}
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
          <div className="space-y-10">
            {/* Current Trips Section */}
            {currentTrips.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Luggage className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-bold">Current & Upcoming Trips</h2>
                  <Badge variant="secondary" className="ml-2">
                    {currentTrips.length}
                  </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentTrips.map((trip) => {
                    const status = getTripStatus(trip);
                    const dateRange = formatDateRange(trip.startDate, trip.endDate);
                    const sortedDestinations = trip.destinations?.sort((a, b) => a.order - b.order) || [];
                    
                    const navigateToPlanner = () => {
                      sessionStorage.setItem("trippenguin_planner_state", JSON.stringify({ currentStep: "plan" }));
                      setLocation(`/trip/${trip.id}`);
                    };
                    
                    return (
                      <Card
                        key={trip.id}
                        className="hover-elevate cursor-pointer transition-all"
                        onClick={navigateToPlanner}
                        data-testid={`card-trip-${trip.id}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={status.variant} data-testid={`badge-status-${trip.id}`}>
                                  {status.label}
                                </Badge>
                                {trip.travelSeason && (
                                  <Badge variant="outline" className="text-xs">
                                    {getSeasonDisplay(trip.travelSeason)}
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-xl mb-1">
                                {sortedDestinations.length > 0 ? (
                                  sortedDestinations.map(d => d.cityName).join(" → ")
                                ) : (
                                  `${trip.travelSeason ? getSeasonDisplay(trip.travelSeason) : "New"} Trip`
                                )}
                              </CardTitle>
                              {sortedDestinations.length > 0 && (
                                <p className="text-sm text-muted-foreground" data-testid={`text-country-${trip.id}`}>
                                  {Array.from(new Set(sortedDestinations.map(d => d.countryName))).join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={navigateToPlanner}
                                data-testid={`button-edit-${trip.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteClick(trip.id)}
                                data-testid={`button-delete-${trip.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {/* Trip Details */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {dateRange || `${trip.tripDuration} days`}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="w-4 h-4" />
                                {getTravelersDisplay(trip.travelers, trip.numberOfTravelers)}
                              </div>
                              {sortedDestinations.length > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                  <MapPin className="w-4 h-4" />
                                  {sortedDestinations.length} {sortedDestinations.length === 1 ? 'destination' : 'destinations'}
                                </div>
                              )}
                            </div>

                            {/* Departure Info */}
                            {trip.departureCity && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded px-2 py-1">
                                <MapPin className="w-3 h-3" />
                                <span>From {trip.departureCity}</span>
                              </div>
                            )}

                            {/* First City Activities Preview */}
                            {sortedDestinations[0]?.activities && sortedDestinations[0].activities.length > 0 && (
                              <div className="border-t pt-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                  <Star className="w-3 h-3" />
                                  Highlights in {sortedDestinations[0].cityName}
                                </div>
                                <p className="text-xs line-clamp-2">
                                  {sortedDestinations[0].activities.slice(0, 2).join(" • ")}
                                  {sortedDestinations[0].activities.length > 2 && " ..."}
                                </p>
                              </div>
                            )}

                            {/* View Button */}
                            <Button
                              variant="secondary"
                              className="w-full gap-2"
                              data-testid={`button-view-${trip.id}`}
                            >
                              View Trip
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past Trips Section */}
            {pastTrips.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <History className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold text-muted-foreground">Past Adventures</h2>
                  <Badge variant="outline" className="ml-2">
                    {pastTrips.length}
                  </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastTrips.map((trip) => {
                    const dateRange = formatDateRange(trip.startDate, trip.endDate);
                    const sortedDestinations = trip.destinations?.sort((a, b) => a.order - b.order) || [];
                    
                    const navigateToGoPage = () => {
                      sessionStorage.setItem("trippenguin_planner_state", JSON.stringify({ currentStep: "go" }));
                      setLocation(`/trip/${trip.id}`);
                    };
                    
                    return (
                      <Card
                        key={trip.id}
                        className="hover-elevate cursor-pointer transition-all opacity-80 hover:opacity-100"
                        onClick={navigateToGoPage}
                        data-testid={`card-trip-${trip.id}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  Completed
                                </Badge>
                              </div>
                              <CardTitle className="text-lg mb-1">
                                {sortedDestinations.length > 0 ? (
                                  sortedDestinations.map(d => d.cityName).join(" → ")
                                ) : (
                                  `${trip.travelSeason ? getSeasonDisplay(trip.travelSeason) : "Past"} Trip`
                                )}
                              </CardTitle>
                              {sortedDestinations.length > 0 && (
                                <p className="text-sm text-muted-foreground" data-testid={`text-country-${trip.id}`}>
                                  {Array.from(new Set(sortedDestinations.map(d => d.countryName))).join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteClick(trip.id)}
                                data-testid={`button-delete-${trip.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {dateRange && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {dateRange}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {getTravelersDisplay(trip.travelers, trip.numberOfTravelers)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              className="w-full text-muted-foreground"
                              data-testid={`button-view-${trip.id}`}
                            >
                              View Memories
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Empty Current Trips but have Past */}
            {currentTrips.length === 0 && pastTrips.length > 0 && (
              <Card className="text-center py-8 mb-8">
                <CardContent>
                  <PenguinLogo size="xl" className="mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready for your next adventure?</h3>
                  <p className="text-muted-foreground mb-4">
                    You have {pastTrips.length} completed {pastTrips.length === 1 ? "trip" : "trips"}. Start planning your next one!
                  </p>
                  <Button
                    onClick={() => setLocation("/getting-started")}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Plan New Trip
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-background border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <PenguinLogo size="sm" />
              <span className="font-bold">TripPenguin</span>
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
            © 2025 TripPenguin
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
