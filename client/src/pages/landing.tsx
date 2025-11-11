import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Calculator, CheckSquare, TrendingUp, Shield, Clock } from "lucide-react";
import { useLocation, Link } from "wouter";
import heroImage from "@assets/generated_images/Family_travel_hero_image_ae06478c.png";

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Plane,
      title: "Dream Your Trip",
      description: "Define who's going, when, where, and how long with easy-to-use planning tools",
    },
    {
      icon: Calculator,
      title: "Budget & Save",
      description: "Get accurate cost estimates and track savings to avoid debt",
    },
    {
      icon: CheckSquare,
      title: "Book with Confidence",
      description: "Organize all bookings with status tracking and AI assistance (coming soon)",
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Stay Out of Debt",
      description: "Plan and save before you book to enjoy your trip stress-free",
    },
    {
      icon: TrendingUp,
      title: "Track Your Progress",
      description: "See exactly how much you need to save and when you can travel",
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "All-in-one planning tool replaces spreadsheets and guesswork",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Nav */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Plane className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-white">TripPirate</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setLocation("/login")}
              data-testid="button-login"
            >
              Log In
            </Button>
            <Button
              variant="default"
              className="bg-primary border-2 border-primary-border"
              onClick={() => setLocation("/register")}
              data-testid="button-register"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Family traveling together"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-serif">
            Plan Your Dream Trip
            <br />
            <span className="text-primary">Without Going Into Debt</span>
          </h1>
          <p className="text-lg sm:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Follow our simple 3-step guide to plan, budget, and book your overseas adventure with confidence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="default"
              onClick={() => setLocation("/quiz")}
              className="text-lg px-8 py-6 min-h-0 bg-primary hover:bg-primary border-2 border-primary-border"
              data-testid="button-hero-start"
            >
              Start Planning Your Trip
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/trips")}
              className="text-lg px-8 py-6 min-h-0 text-white border-white hover:bg-white/20 backdrop-blur-sm"
              data-testid="button-hero-learn"
            >
              View My Trips
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
              Your Journey in Three Simple Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From dreaming to doing, we guide you through every stage of planning your perfect trip
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover-elevate">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
              Why Choose TripPirate?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Make your travel dreams a reality without the financial stress
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-lg mb-8 text-primary-foreground/90">
            Join thousands who have planned debt-free trips with our proven system
          </p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/trip/new")}
            className="text-lg px-8 py-6 min-h-0 bg-white text-primary hover:bg-white/90 border-white"
            data-testid="button-cta-start"
          >
            Begin Your Trip Plan
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 TripPirate. Plan your dream trip without debt.</p>
        </div>
      </footer>
    </div>
  );
}
