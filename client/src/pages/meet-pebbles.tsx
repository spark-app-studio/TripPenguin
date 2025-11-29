import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight,
  Heart,
  MapPin,
  Compass,
  Snowflake,
  Sun,
  Mountain,
  Waves,
  Star,
  Sparkles,
  Users,
  PiggyBank,
  Globe
} from "lucide-react";
import { PenguinLogo } from "@/components/PenguinLogo";
import { useLocation, Link } from "wouter";
import penguinImage from "@assets/generated_images/cute_penguin_travel_mascot_logo.png";

export default function MeetPebbles() {
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
              <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
              <Link href="/meet-pebbles" className="text-foreground text-sm font-medium transition-colors">Meet Pebbles</Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
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

      {/* Hero Section with Pebbles */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">Our Mascot</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-serif">
            Meet Pebbles
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground mb-8">
            The adventurous little penguin who believes every family deserves to explore the world together
          </p>
          
          {/* Large Pebbles Image */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-110" />
            <img 
              src={penguinImage} 
              alt="Pebbles the Penguin" 
              className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 object-contain mx-auto drop-shadow-xl"
              data-testid="img-pebbles-hero"
            />
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-serif">The Story of Pebbles</h2>
            <p className="text-muted-foreground">A tale of curiosity, family, and the joy of exploration</p>
          </div>

          <div className="space-y-8">
            {/* Chapter 1 */}
            <Card className="overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                    <Snowflake className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">Born on Antarctic Shores</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Pebbles was born on a crisp Antarctic morning, the smallest chick in a colony of thousands. 
                      While other penguin chicks stayed close to their parents, Pebbles would waddle to the edge 
                      of the ice shelf, gazing at the distant horizon with wonder-filled eyes. "What's out there?" 
                      she would chirp to anyone who listened.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chapter 2 */}
            <Card className="overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
                    <Compass className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">The Wandering Dream</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      One day, a wise old albatross landed near the colony. He told stories of tropical beaches, 
                      ancient cities, towering mountains, and families of all kinds exploring the world together. 
                      Pebbles listened with rapt attention, her little flippers clasped in excitement. "I want to 
                      help families see all of that," she decided that very day.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chapter 3 */}
            <Card className="overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 flex-shrink-0">
                    <Heart className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">A Lesson from Mom & Dad</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Pebbles' parents were practical penguins. "Adventures are wonderful," her mother said, 
                      "but you must plan wisely." Her father added, "Save your fish before you swim far." 
                      These lessons stayed with Pebbles forever: the best adventures are the ones you can 
                      afford without worry. Family trips should bring joy, not stress.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chapter 4 */}
            <Card className="overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0">
                    <Globe className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">Pebbles' Big Mission</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      When Pebbles grew up, she didn't just explore the world herself—she made it her 
                      mission to help other families do the same. With her trusty scarf (a gift from 
                      her grandmother), her well-worn backpack, and a heart full of wanderlust, Pebbles 
                      became the official guide for TripPenguin. Now she helps families dream, save, 
                      and go on adventures—debt-free!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pebbles' Favorite Things */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-serif">Pebbles' Favorite Things</h2>
            <p className="text-muted-foreground">A peek into what makes our mascot waddle with joy</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sun className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Sunny Beach Days</h3>
                <p className="text-sm text-muted-foreground">
                  Despite being an Antarctic penguin, Pebbles loves feeling warm sand between her flippers
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mountain className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Mountain Views</h3>
                <p className="text-sm text-muted-foreground">
                  She believes the best postcards come from the highest peaks
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Family Moments</h3>
                <p className="text-sm text-muted-foreground">
                  Nothing makes Pebbles happier than seeing families make memories together
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Smart Saving</h3>
                <p className="text-sm text-muted-foreground">
                  Pebbles gets excited when savings goals are reached (she does a little dance!)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fun Facts */}
      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-serif">Fun Facts About Pebbles</h2>
            <p className="text-muted-foreground">Get to know our fluffy travel guide a little better</p>
          </div>

          <div className="grid gap-4">
            {[
              { icon: Star, fact: "Pebbles has visited 47 countries (in her imagination) and counting", color: "text-yellow-500" },
              { icon: Waves, fact: "She's an excellent swimmer but prefers waddling on new adventures", color: "text-blue-500" },
              { icon: Sparkles, fact: "Her favorite snack is sardine sandwiches (don't knock it till you try it!)", color: "text-purple-500" },
              { icon: MapPin, fact: "She keeps a tiny journal of every family she's helped plan a trip", color: "text-rose-500" },
              { icon: Heart, fact: "Pebbles believes the best trips are the ones where everyone comes home happy", color: "text-red-500" },
              { icon: Snowflake, fact: "She still visits Antarctica every winter to see her penguin family", color: "text-cyan-500" },
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                <p className="text-foreground">{item.fact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pebbles' Promise */}
      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <PenguinLogo size="xl" className="mx-auto mb-6" />
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 font-serif">
            Pebbles' Promise to You
          </h2>
          <p className="text-xl lg:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            "I promise to help your family dream big, save smart, and explore the world together—without 
            the worry of debt. Every waddle of our journey will be filled with joy and excitement!"
          </p>
          <p className="text-lg italic text-primary-foreground/80">
            — Pebbles the Penguin
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 font-serif">
            Ready to Plan Your Adventure with Pebbles?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of families who are already exploring the world, debt-free.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/register")}
            className="gap-2 text-lg px-8"
            data-testid="button-start-adventure"
          >
            Start Your Adventure
            <ChevronRight className="w-5 h-5" />
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
              <Link href="/meet-pebbles" className="hover:text-foreground transition-colors">Meet Pebbles</Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </nav>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © 2025 TripPenguin. Made with love by Pebbles and friends.
          </div>
        </div>
      </footer>
    </div>
  );
}
