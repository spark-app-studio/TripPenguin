import { Button } from "@/components/ui/button";
import { 
  ChevronRight,
  Sparkles,
  PiggyBank,
  Heart
} from "lucide-react";
import { PenguinLogo } from "@/components/PenguinLogo";
import { useLocation, Link } from "wouter";

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Nav */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <PenguinLogo size="md" />
              <span className="text-xl font-bold">TripPenguin</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</Link>
              <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">How It Works</a>
              <Link href="/about" className="text-foreground text-sm font-medium transition-colors">About</Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Privacy</Link>
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
            About TripPenguin
          </h1>
          <p className="text-xl lg:text-2xl text-primary-foreground/90">
            Family adventures, finally within reach.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            
            {/* Intro */}
            <div className="flex items-start gap-4 p-6 rounded-lg bg-muted/30">
              <Heart className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <p className="text-lg leading-relaxed m-0">
                TripPenguin is a free, family-focused travel app designed to bring people together for unforgettable journeys—without the financial burden. Built for busy families who want seamless dreaming, planning, budgeting, and booking, TripPenguin provides a centralized platform for organizing international trips, domestic adventures, and local staycations—with ease and confidence.
              </p>
            </div>

            {/* AI Section */}
            <div className="flex items-start gap-4 p-6 rounded-lg bg-muted/30">
              <Sparkles className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <p className="text-lg leading-relaxed m-0">
                TripPenguin leverages intelligent technology to simplify planning and remove financial stress from the travel experience. Through its unique AI-driven itinerary engine, the app learns each family's goals, preferences, pace, and budget, and then generates three comprehensive personalized itineraries—each tailored to their aspirations and financial means. Families can then review, personalize, and finalize their chosen itinerary. This transforms family travel dreams into realistic, achievable plans.
              </p>
            </div>

            {/* Budget Tools Section */}
            <div className="flex items-start gap-4 p-6 rounded-lg bg-muted/30">
              <PiggyBank className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <p className="text-lg leading-relaxed m-0">
                At its core, TripPenguin includes powerful planning and budgeting tools. The app provides detailed cost estimates for the selected itinerary across all trip categories—flights, accommodations, transportation, activities, insurance, and more. Families can link their savings accounts to monitor real-time progress toward the total trip cost. As savings accumulate, TripPenguin enables users to book trip components through trusted affiliates, one at a time and in order of priority, ensuring that the joy of travel never comes with debt.
              </p>
            </div>

            {/* Design Philosophy */}
            <p className="text-lg leading-relaxed text-center py-6">
              Designed with a playful, family-friendly interface and sophisticated planning functionality, TripPenguin turns travel from stressful logistics into joyful anticipation. It enables end-to-end trip realization—from dreaming to planning to going—while encouraging thoughtful and responsible spending.
            </p>

            {/* Closing Statement */}
            <div className="text-center py-8 border-t border-b">
              <p className="text-xl font-medium text-muted-foreground italic mb-2">
                Because family adventures should feel exciting—not impossible.
              </p>
              <p className="text-2xl font-bold text-primary font-serif">
                TripPenguin makes travel finally feel within reach.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 font-serif">
            Ready to start your family adventure?
          </h2>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/register")}
            className="text-lg px-10 py-7 min-h-0 bg-white text-primary hover:bg-white/90 border-white"
            data-testid="button-cta"
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
              <PenguinLogo size="sm" />
              <span className="font-bold">TripPenguin</span>
              <span className="text-muted-foreground">— Family adventures, finally within reach.</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Privacy</Link>
            </nav>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © 2025 TripPenguin
          </div>
        </div>
      </footer>
    </div>
  );
}
