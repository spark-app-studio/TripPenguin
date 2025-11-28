import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plane, 
  Sparkles, 
  DollarSign, 
  PiggyBank, 
  ShoppingCart, 
  Eye, 
  Handshake, 
  Gift,
  Users,
  Compass,
  TrendingUp,
  CreditCard,
  MapPin,
  Globe,
  Mountain,
  Car,
  Building,
  TreeDeciduous,
  Home,
  Shield,
  CheckCircle,
  Lock,
  BadgeCheck,
  Quote,
  ChevronRight
} from "lucide-react";
import { useLocation, Link } from "wouter";
import heroImage from "@assets/generated_images/Family_travel_hero_image_ae06478c.png";

export default function Landing() {
  const [, setLocation] = useLocation();

  const valueProps = [
    { icon: Sparkles, title: "Personalized AI itineraries" },
    { icon: DollarSign, title: "Realistic budgets & cost estimates" },
    { icon: PiggyBank, title: "Track savings & book as you go" },
    { icon: Eye, title: "Clear cost transparency" },
    { icon: Handshake, title: "Booking through trusted partners" },
    { icon: Gift, title: "100% free to use" },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Dream",
      description: "Take a quick quiz about your family's travel style, preferences, and budget.",
      icon: Sparkles,
    },
    {
      step: 2,
      title: "Plan",
      description: "Get 3 personalized itineraries with real cost estimates — pick and customize your favorite.",
      icon: Compass,
    },
    {
      step: 3,
      title: "Go",
      description: "Track your savings and book when you're ready — no debt, no stress.",
      icon: Plane,
    },
  ];

  const features = [
    "Custom itineraries",
    "Cost estimates on everything",
    "Savings progress bar",
    "Book-by-priority system",
    "Safety & accessibility filters",
    "Family-friendly options",
    "Simple & intuitive design",
  ];

  const tripTypes = [
    { icon: Globe, title: "International travel" },
    { icon: MapPin, title: "Domestic family vacations" },
    { icon: Mountain, title: "National parks" },
    { icon: Car, title: "Road trips" },
    { icon: Building, title: "Weekend getaways" },
    { icon: TreeDeciduous, title: "City breaks" },
    { icon: Home, title: "Staycations" },
  ];

  const securityFeatures = [
    { icon: Lock, title: "Secure payment processing via Stripe" },
    { icon: Handshake, title: "Trusted affiliate partners" },
    { icon: BadgeCheck, title: "Verified reviews" },
    { icon: Shield, title: "Established travel providers" },
    { icon: CheckCircle, title: "No risky intermediaries" },
  ];

  const testimonials = [
    {
      quote: "TripPirate helped us plan our first international trip with the kids — and we stayed on budget!",
      author: "Sarah M.",
    },
    {
      quote: "I finally feel like travel is possible for us.",
      author: "David K.",
    },
    {
      quote: "The savings tracker gave us hope—we could literally watch the trip getting closer.",
      author: "Jennifer L.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <Plane className="h-6 w-6 text-white" />
              <span className="text-xl font-bold text-white">TripPirate</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Features</Link>
              <a href="#how-it-works" className="text-white/80 hover:text-white text-sm font-medium transition-colors">How It Works</a>
              <Link href="/about" className="text-white/80 hover:text-white text-sm font-medium transition-colors">About</Link>
              <a href="#faq" className="text-white/80 hover:text-white text-sm font-medium transition-colors">FAQ</a>
              <Link href="/terms-of-service" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Privacy</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setLocation("/login")}
                data-testid="button-signin"
              >
                Sign In
              </Button>
              <Button
                variant="default"
                className="bg-primary border-2 border-primary-border"
                onClick={() => setLocation("/register")}
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Family traveling together"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white py-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 font-serif">
            TripPirate
          </h1>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-medium mb-6 text-white/95">
            Family adventures, finally within reach.
          </p>
          <p className="text-lg sm:text-xl mb-10 text-white/80 max-w-2xl mx-auto font-lora">
            Dream it. Plan it. Budget it. Go. All in one free app built for real families.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              variant="default"
              onClick={() => setLocation("/register")}
              className="text-lg px-10 py-7 min-h-0 bg-primary hover:bg-primary border-2 border-primary-border"
              data-testid="button-hero-cta"
            >
              Start Planning Your Trip
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-white/60">
              No credit card required · Free forever
            </p>
          </div>
        </div>
      </section>

      {/* Key Value Proposition Section */}
      <section id="features" className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
              A smarter way to travel as a family
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {valueProps.map((prop, index) => {
              const Icon = prop.icon;
              return (
                <Card key={index} className="hover-elevate">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-lg font-medium">{prop.title}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setLocation("/register")}
              className="text-lg px-8 py-6 min-h-0"
              data-testid="button-try-free"
            >
              Try TripPirate Free
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto mb-12">
            {howItWorks.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setLocation("/register")}
              className="text-lg px-8 py-6 min-h-0"
              data-testid="button-create-itinerary"
            >
              Create Your Itinerary
            </Button>
          </div>
        </div>
      </section>

      {/* Trust & Money Transparency Section */}
      <section id="about" className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 font-serif">
            Because family travel shouldn't feel impossible
          </h2>
          <p className="text-lg mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            TripPirate is free because travel companies pay us a small commission when you book through us.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
            {[
              "You pay the same price — or less",
              "No hidden fees",
              "No inflated costs",
              "No data selling",
              "No pressure to overspend",
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
              Built for families, not influencers
            </h2>
            <p className="text-lg text-muted-foreground">
              You'll get:
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Types of Trips Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
              Adventure isn't measured by distance
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 max-w-4xl mx-auto mb-12">
            {tripTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <Card key={index} className="hover-elevate">
                  <CardContent className="pt-6 pb-6 text-center">
                    <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    <p className="font-medium text-sm">{type.title}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setLocation("/register")}
              className="text-lg px-8 py-6 min-h-0"
              data-testid="button-plan-trip"
            >
              Plan Any Type of Trip
            </Button>
          </div>
        </div>
      </section>

      {/* Security & Safety Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
              Book safely and confidently
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30">
                  <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-medium text-sm">{feature.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
              What families are saying
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="pt-6 pb-6">
                  <Quote className="w-8 h-8 text-primary/30 mb-4" />
                  <p className="text-lg mb-4 font-lora italic">
                    "{testimonial.quote}"
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    — {testimonial.author}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4 font-serif">
            Ready to turn "someday" into "let's go"?
          </h2>
          <p className="text-xl mb-10 text-primary-foreground/90">
            Family adventures are finally within reach.
          </p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/register")}
            className="text-lg px-10 py-7 min-h-0 bg-white text-primary hover:bg-white/90 border-white"
            data-testid="button-final-cta"
          >
            Get Started — It's Free
          </Button>
          <p className="mt-4 text-sm text-primary-foreground/70">
            Takes 2 minutes · No payment required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-bold">TripPirate</span>
              <span className="text-muted-foreground">— Family adventures, finally within reach.</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#about" className="hover:text-foreground transition-colors">About</a>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Privacy</Link>
              <a href="mailto:contact@trippirate.com" className="hover:text-foreground transition-colors">Contact</a>
            </nav>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © 2025 TripPirate
          </div>
        </div>
      </footer>
    </div>
  );
}
