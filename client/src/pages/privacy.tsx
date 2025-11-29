import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronRight,
  User,
  Smartphone,
  PiggyBank,
  Target,
  DollarSign,
  Share2,
  Shield,
  Baby,
  Trash2,
  RefreshCw,
  Mail
} from "lucide-react";
import { PenguinLogo } from "@/components/PenguinLogo";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Privacy() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

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
              <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
              <Link href="/privacy" className="text-foreground text-sm font-medium transition-colors">Privacy</Link>
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/trips" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors" data-testid="link-my-trips">
                    My Trips
                  </Link>
                  <Button
                    variant="default"
                    onClick={() => setLocation("/trips")}
                    data-testid="button-go-to-trips"
                  >
                    Go to My Trips
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-serif">
            Privacy Policy
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
            TripPenguin is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and how we keep it secure.
          </p>

          <div className="space-y-12">
            
            {/* Section 1 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">1. Information We Collect</h2>
              </div>
              
              <div className="space-y-6 ml-13">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">A) Information You Provide</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>Name</li>
                      <li>Email address</li>
                      <li>Family travel preferences</li>
                      <li>Trip details you enter</li>
                      <li>Linked savings account information (optional)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">B) Automatically Collected Information</h3>
                    <p className="text-muted-foreground mb-3">We may collect:</p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>Device type and OS</li>
                      <li>Browser type</li>
                      <li>App interaction data</li>
                      <li>Non-identifying usage statistics</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">C) Savings Account Data (optional)</h3>
                    <p className="text-muted-foreground mb-3">If you choose to link a savings account, TripPenguin accesses:</p>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li>Account balance</li>
                      <li>Transaction history related to savings accumulation</li>
                      <li>Bank name and account type</li>
                    </ul>
                    <p className="text-sm font-medium">TripPenguin never stores your login credentials for financial accounts.</p>
                    <p className="text-sm text-muted-foreground mt-2">All financial connections are handled through secure bank-grade APIs such as Plaid or similar services.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">2. How We Use Your Information</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">We use your data to:</p>
                  <ul className="space-y-2 text-muted-foreground mb-6">
                    <li>Generate personalized itineraries</li>
                    <li>Estimate trip costs</li>
                    <li>Track savings progress</li>
                    <li>Recommend budget-friendly travel options</li>
                    <li>Improve the app experience</li>
                    <li>Provide customer support</li>
                  </ul>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="font-semibold mb-2">We will never:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Sell your data</li>
                      <li>Rent your data</li>
                      <li>Share personal financial information with advertisers</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 3 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">3. How We Make Money</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    TripPenguin is free to use. We earn commissions from hotels, airlines, tour operators, and other travel partners when bookings are made through the app.
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    Companies pay us — not you.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section 4 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">4. Sharing Your Data</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-3">We may share minimal necessary data with:</p>
                  <ul className="space-y-2 text-muted-foreground mb-6">
                    <li>Booking partners (for confirmations)</li>
                    <li>Payment processors (Stripe)</li>
                    <li>Itinerary delivery providers (email services)</li>
                  </ul>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="font-semibold mb-2">We do not share:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Savings account data</li>
                      <li>Personal financial information</li>
                      <li>Private itinerary details</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 5 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">5. Data Security</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-3">We use:</p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li>Encryption</li>
                    <li>Secure transmission protocols</li>
                    <li>Bank-grade security for financial APIs</li>
                    <li>Limited internal access</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    No system is 100% secure, but we take strong measures to protect your information.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section 6 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Baby className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">6. Children's Privacy</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    TripPenguin is intended for family use. Parents manage accounts and control child involvement. We do not knowingly collect personal information directly from children under 13.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section 7 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">7. Account Deletion</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-3">You can delete your account at any time. When deleted:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>All personal data is erased</li>
                    <li>Linked financial data is removed</li>
                    <li>Stored itineraries are permanently deleted</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Section 8 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">8. Updates to This Policy</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy as we evolve. If changes are significant, we will notify users by email or in-app notice.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section 9 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-serif">9. Contact Us</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    If you have questions, email us at: <a href="mailto:support@trippenguin.com" className="text-primary hover:underline">support@trippenguin.com</a>
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
              <PenguinLogo size="sm" />
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
