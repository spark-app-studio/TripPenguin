import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Map, Calendar, LogOut, Plus } from "lucide-react";
import { PenguinLogo } from "@/components/PenguinLogo";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trip } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const { data: trips, isLoading: isLoadingTrips } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      // Clear user data immediately to ensure isAuthenticated becomes false
      queryClient.setQueryData(["/api/auth/user"], null);
      // Clear all other cached data
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      // Redirect to landing page
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PenguinLogo size="xl" className="mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <PenguinLogo size="md" />
            <span className="text-xl font-bold">TripPenguin</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Welcome,</span>
              <span className="font-medium">{user?.firstName || user?.email}</span>
            </div>
            <Avatar data-testid="avatar-user">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Log Out"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2 font-serif">
            Your Trips
          </h1>
          <p className="text-muted-foreground">
            Plan, budget, and book your dream adventures
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/getting-started")} data-testid="card-new-trip">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">New Trip</CardTitle>
                  <CardDescription className="text-sm">Start planning</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/trips")}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Map className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">All Trips</CardTitle>
                  <CardDescription className="text-sm">View & manage</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {trips?.length || 0} {trips?.length === 1 ? "Trip" : "Trips"}
                  </CardTitle>
                  <CardDescription className="text-sm">Total planned</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Trips */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Trips</h2>
          {isLoadingTrips ? (
            <div className="text-center py-12">
              <PenguinLogo size="lg" className="mx-auto mb-3 animate-pulse" />
              <p className="text-muted-foreground">Loading trips...</p>
            </div>
          ) : trips && trips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.slice(0, 6).map((trip) => (
                <Card
                  key={trip.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/trips/${trip.id}`)}
                  data-testid={`card-trip-${trip.id}`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-1">
                      {trip.travelers === "Just me" ? "Solo Adventure" : "Group Trip"}
                    </CardTitle>
                    <CardDescription>
                      {trip.tripDuration} days • {trip.travelSeason}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {trip.numberOfTravelers} {trip.numberOfTravelers === 1 ? "traveler" : "travelers"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <PenguinLogo size="xl" className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No trips yet</p>
                <p className="text-muted-foreground mb-6">
                  Start planning your first adventure today!
                </p>
                <Button onClick={() => setLocation("/planner")} data-testid="button-start-planning">
                  <Plus className="h-4 w-4 mr-2" />
                  Plan Your First Trip
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
