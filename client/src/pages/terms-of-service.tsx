import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plane, 
  ChevronRight,
  Compass,
  UserCheck,
  ShoppingCart,
  DollarSign,
  PiggyBank,
  Copyright,
  AlertTriangle,
  Ban,
  RefreshCw,
  Mail,
  Handshake
} from "lucide-react";
import { useLocation, Link } from "wouter";

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Nav */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <Plane className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TripPenguin</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</Link>
              <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">How It Works</a>
              <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
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
            Terms of Service
          </h1>
          <p className="text-xl text-primary-foreground/90">
            Last updated: November 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-lg text-muted-foreground mb-12">
            Welcome to TripPenguin! By using our app or website, you agree to these Terms of Service.
          </p>

          <div className="space-y-12">
            
            {/* Section 1 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">1. What TripPenguin Does</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-3">TripPenguin helps families:</p>
                  <ul className="space-y-2 text-muted-foreground mb-6">
                    <li>Plan trips</li>
                    <li>Build budgets</li>
                    <li>Create itineraries</li>
                    <li>Track savings</li>
                    <li>Book travel components through trusted partners</li>
                  </ul>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-semibold mb-2">TripPenguin is not:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>A direct travel agency</li>
                      <li>A financial institution</li>
                      <li>Liable for third-party travel services</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 2 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">2. User Responsibilities</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-3">You agree to:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>Use TripPenguin legally and responsibly</li>
                    <li>Provide accurate information</li>
                    <li>Not misuse or attempt to hack the platform</li>
                    <li>Not exploit the service commercially without permission</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Section 3 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">3. Booking Disclaimer</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-3">When you book:</p>
                  <ul className="space-y-2 text-muted-foreground mb-6">
                    <li>The booking is made with the third-party provider</li>
                    <li>Their terms and policies apply</li>
                    <li>They hold responsibility for fulfillment and service</li>
                  </ul>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-semibold mb-2">TripPenguin is not responsible for:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Flight cancellations</li>
                      <li>Hotel errors</li>
                      <li>Tour modifications</li>
                      <li>Weather disruptions</li>
                      <li>Travel document issues</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 4 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">4. Financial Disclaimers</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    TripPenguin encourages responsible, debt-free travel, but:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>We do not provide financial advice</li>
                    <li>We do not guarantee pricing or availability</li>
                    <li>Cost estimates are approximate and subject to change</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Section 5 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">5. Savings Account Integration</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-3">If you connect a financial account:</p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>TripPenguin only reads balance data</li>
                    <li>TripPenguin never sees or stores your bank login credentials</li>
                    <li>All data connections are encrypted</li>
                  </ul>
                  <p className="text-sm font-medium">
                    You are responsible for ensuring any financial decisions are appropriate for your situation.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section 6 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Copyright className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">6. Intellectual Property</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    TripPenguin, its logo, brand language, and interface are proprietary and protected. You agree not to copy, resell, reverse-engineer, or extract trade secrets.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section 7 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">7. Limitation of Liability</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="font-medium mb-4">TripPenguin is offered "as is" without warranties.</p>
                  <p className="mb-3">TripPenguin is not liable for:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>Third-party travel provider errors</li>
                    <li>Trip cancellations</li>
                    <li>Lost baggage</li>
                    <li>Injury or loss during travel</li>
                    <li>Inaccurate estimates</li>
                    <li>User misuse</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Section 8 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">8. Termination</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-3">We may suspend or terminate accounts for:</p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>Violations of terms</li>
                    <li>Abuse or fraud</li>
                    <li>Malicious or illegal activity</li>
                  </ul>
                  <p className="text-sm font-medium">
                    Users may delete their accounts at any time.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section 9 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">9. Changes to Terms</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    We may update these Terms as TripPenguin grows. We will notify users of material changes.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section 10 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">10. Contact Information</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    Questions about Terms? Email: <a href="mailto:legal@trippenguin.com" className="text-primary hover:underline">legal@trippenguin.com</a>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* How We Make Money Section */}
            <div className="pt-8 border-t">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Handshake className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">How TripPenguin Makes Money</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    TripPenguin is free for users. We do not charge families for using the platform.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    TripPenguin earns revenue through affiliate partnerships and commissions from third-party travel providers when users make bookings through the app. These commissions are paid by the provider and do not increase the cost to the user.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    TripPenguin does not sell personal data, financial data, or itinerary information.
                  </p>
                  <p className="text-muted-foreground">
                    We may receive compensation from booking links, recommended services, and integrated partners.
                  </p>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-bold">TripPenguin</span>
              <span className="text-muted-foreground">— Family adventures, finally within reach.</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
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
