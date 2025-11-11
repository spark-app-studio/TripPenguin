import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import TermsOfService from "@/pages/terms-of-service";
import TripsList from "@/pages/trips-list";
import TripPlanner from "@/pages/trip-planner";
import Quiz from "@/pages/quiz";
import QuizResults from "@/pages/quiz-results";
import NotFound from "@/pages/not-found";
import { Plane } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Plane className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
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

      {/* Conditional routes based on authentication */}
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/trips" component={Landing} />
          <Route path="/planner" component={Landing} />
          <Route path="/trip/:id" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/trips" component={TripsList} />
          <Route path="/quiz" component={Quiz} />
          <Route path="/quiz/results" component={QuizResults} />
          <Route path="/planner" component={TripPlanner} />
          <Route path="/trip-planner" component={TripPlanner} />
          <Route path="/trip/:id" component={TripPlanner} />
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
