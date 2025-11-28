import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plane, 
  Sparkles, 
  DollarSign, 
  PiggyBank, 
  ShoppingCart, 
  Shield,
  Baby,
  Globe,
  Smartphone,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  CreditCard,
  Wallet,
  Users,
  MapPin,
  Heart
} from "lucide-react";
import { useLocation, Link } from "wouter";

export default function Features() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Sparkles,
      title: "Personalized AI-Generated Family Itineraries",
      description: "Your family is unique — your trip should be too. TripPirate learns your family's interests, pace, budget, and travel style, then generates three tailored trip options. Not generic. Not influencer-fantasy-travel. Realistic trips for real families.",
      bullets: [
        "Age-smart recommendations",
        "Trip pace aligned with kid stamina",
        "Cultural, relaxing, adventurous, or mixed itineraries",
        "Fully customizable suggestions",
      ],
    },
    {
      icon: DollarSign,
      title: "Smart Trip Budgeting & Cost Transparency",
      description: "See every cost upfront — no surprises. TripPirate breaks down projected costs for your chosen itinerary:",
      bullets: [
        "Flights",
        "Lodging",
        "Activities",
        "Meals",
        "Local transportation",
        "Insurance",
      ],
      footer: "You get a realistic view of total trip cost, helping ensure that family adventures never feel impossible.",
    },
    {
      icon: PiggyBank,
      title: "Savings Integration & Progress Tracking",
      description: "Watch your trip come closer each week. You can manually enter savings or link your bank — TripPirate tracks it and visualizes your progress.",
      bullets: [
        "Real-time savings progress",
        "Encouraging milestone celebrations (\"You're halfway there!\")",
        "Savings timeline predictions",
      ],
      footer: "This transforms travel from someday into let's go.",
    },
    {
      icon: ShoppingCart,
      title: "Book As You're Ready — One Step at a Time",
      description: "Travel at the pace of your savings. TripPirate lets you book trip components individually as you're financially ready:",
      bullets: [
        "Flights first",
        "Or lodging first",
        "Or activities first",
      ],
      footer: "This prevents debt. This encourages confident planning. This keeps you in control.",
    },
    {
      icon: Shield,
      title: "Trusted Affiliate Booking — Same Price or Lower",
      description: "TripPirate is free because companies pay us — not you. When you book through a partner link:",
      bullets: [
        "You don't pay extra",
        "No hidden fees",
        "No price inflation",
        "We earn commission, not you",
      ],
      footer: "Radical transparency with ZERO user cost.",
    },
    {
      icon: Baby,
      title: "Built for Families at Every Stage",
      description: "Finally — a travel planning tool designed with real family needs in mind. TripPirate considers:",
      bullets: [
        "Ages of your children",
        "Nap & downtime needs",
        "Stroller or wheelchair logistics",
        "Sensory-friendly options",
        "Meal and dietary considerations",
      ],
      footer: "We're not building for backpackers, luxury influencers, or digital nomads. We're building for you.",
    },
    {
      icon: Globe,
      title: "Domestic, International, or Staycation Support",
      description: "Adventure exists at every scale. TripPirate helps families plan:",
      bullets: [
        "Big international vacations",
        "Cross-country road trips",
        "Nearby weekend escapes",
        "Affordable local staycations",
      ],
      footer: "You don't always need a passport — sometimes you just need a plan.",
    },
    {
      icon: Smartphone,
      title: "Joyful, Simple, Stress-Reducing Interface",
      description: "Travel planning doesn't need to be overwhelming. TripPirate uses:",
      bullets: [
        "Friendly language",
        "Clean layout",
        "Clear guidance",
        "Encouraging prompts",
        "Simple steps",
      ],
      footer: "The entire experience is designed to be emotionally uplifting and easy to use — even for tired parents planning at 10 pm.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Nav */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <Plane className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TripPirate</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-foreground text-sm font-medium transition-colors">Features</Link>
              <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">How It Works</a>
              <a href="/#about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</a>
              <a href="/#faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</a>
              <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Privacy</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setLocation("/login")}
                data-testid="button-signin"
              >
                Sign In
              </Button>
              <Button
                variant="default"
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
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-serif">
            Features
          </h1>
          <p className="text-xl lg:text-2xl text-primary-foreground/90 max-w-2xl mx-auto">
            Everything you need to plan family travel — without the stress, without the debt.
          </p>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl lg:text-2xl mb-2">
                        {feature.title}
                      </CardTitle>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 ml-16">
                    {feature.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  {feature.footer && (
                    <p className="mt-4 ml-16 text-muted-foreground font-medium italic">
                      {feature.footer}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
            TripPirate — Family adventures, finally within reach.
          </h2>
          <p className="text-xl mb-10 text-primary-foreground/90">
            Plan your trip at your pace, with your budget, your way.
          </p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/register")}
            className="text-lg px-10 py-7 min-h-0 bg-white text-primary hover:bg-white/90 border-white"
            data-testid="button-final-cta"
          >
            Get Started — It's Free
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
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
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Privacy</Link>
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
