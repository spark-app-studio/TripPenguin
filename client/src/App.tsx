import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Features from "@/pages/features";
import About from "@/pages/about";
import FAQ from "@/pages/faq";
import Privacy from "@/pages/privacy";
import GettingStarted from "@/pages/getting-started";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import TermsOfService from "@/pages/terms-of-service";
import TripsList from "@/pages/trips-list";
import TripPlanner from "@/pages/trip-planner";
import Itinerary from "@/pages/itinerary";
import Quiz from "@/pages/quiz";
import QuizResults from "@/pages/quiz-results";
import QuizRefine from "@/pages/quiz-refine";
import MeetPebbles from "@/pages/meet-pebbles";
import NotFound from "@/pages/not-found";
import { PenguinLogo } from "@/components/PenguinLogo";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <PenguinLogo size="xl" className="mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/features" component={Features} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/meet-pebbles" component={MeetPebbles} />
      <Route path="/getting-started" component={GettingStarted} />

      {/* Conditional routes based on authentication */}
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/trips" component={Landing} />
          <Route path="/planner" component={Landing} />
          <Route path="/trip/:id" component={Landing} />
          <Route path="/quiz" component={Landing} />
          <Route path="/quiz/results" component={Landing} />
          <Route path="/quiz/refine" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/trips" component={TripsList} />
          <Route path="/quiz" component={Quiz} />
          <Route path="/quiz/results" component={QuizResults} />
          <Route path="/quiz/refine" component={QuizRefine} />
          <Route path="/planner" component={TripPlanner} />
          <Route path="/trip-planner" component={TripPlanner} />
          <Route path="/trip/:id" component={TripPlanner} />
          <Route path="/itinerary" component={Itinerary} />
        </>
      )}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
