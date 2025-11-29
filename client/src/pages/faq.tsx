import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";
import { PenguinLogo } from "@/components/PenguinLogo";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function FAQ() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const faqSections = [
    {
      title: "General",
      questions: [
        {
          question: "What is TripPenguin?",
          answer: "TripPenguin is a free travel planning app built specifically for families. It helps you create personalized itineraries, manage budgets, track savings, and book trip components responsibly—without hidden fees or debt pressure."
        },
        {
          question: "Is TripPenguin really free?",
          answer: "Yes! TripPenguin is completely free for families to use. No monthly fees. No usage charges. No price inflation."
        },
        {
          question: "Why is TripPenguin free?",
          answer: "Because travel companies pay us—not you. When you book through our trusted affiliates, they pay a small referral commission. You pay nothing extra."
        },
      ]
    },
    {
      title: "Planning & Itineraries",
      questions: [
        {
          question: "How does the AI itinerary engine work?",
          answer: "You answer a few questions about your family's preferences, pace, interests, and budget. TripPenguin then generates three personalized itineraries you can review, modify, and customize."
        },
        {
          question: "Can we adjust or change the AI itineraries?",
          answer: "Absolutely. The suggested itineraries are flexible starting points. You can personalize them to match your own style, timing, and comfort level."
        },
      ]
    },
    {
      title: "Budgeting & Savings",
      questions: [
        {
          question: "How does TripPenguin help with budgeting?",
          answer: "TripPenguin provides cost estimates for your finalized itinerary across each category—flights, accommodations, activities, meals, insurance, and more."
        },
        {
          question: "Can I connect my savings account?",
          answer: "Yes — you can link your account so TripPenguin can track real-time savings progress toward the total trip cost."
        },
        {
          question: "Does TripPenguin encourage using credit cards or debt to travel?",
          answer: "No. Our philosophy is responsible, debt-free travel. Trips should enrich your life—not strain your finances."
        },
        {
          question: "Can I book parts of the trip as I save up?",
          answer: "Yes — as your saved funds grow, you can book trip components one at a time, in order of priority."
        },
      ]
    },
    {
      title: "Booking & Security",
      questions: [
        {
          question: "Is it safe to book through TripPenguin?",
          answer: "Yes. TripPenguin routes bookings through trusted partners such as Booking.com, Expedia, and other established providers."
        },
        {
          question: "Does TripPenguin handle payments directly?",
          answer: "Payments are securely processed via Stripe or through affiliate partners. TripPenguin never stores your credit card details."
        },
        {
          question: "Are the accommodations and activities legitimate and vetted?",
          answer: "Yes — TripPenguin only works with reputable booking platforms with verified reviews and strong trust histories."
        },
      ]
    },
    {
      title: "Family Travel, Domestic & Local",
      questions: [
        {
          question: "Does TripPenguin only support international travel?",
          answer: "No — we support international travel, domestic U.S. travel, weekend trips, regional road trips, local city tourism, and low-cost staycations. Family adventure is not defined by distance."
        },
      ]
    },
    {
      title: "Account & Privacy",
      questions: [
        {
          question: "Does TripPenguin sell or share my data?",
          answer: "No. We never sell user data or share personal financial information."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes — and all associated data will be fully removed."
        },
        {
          question: "Is TripPenguin kid-friendly?",
          answer: "Absolutely. It is designed to be safe, playful, and family-appropriate."
        },
      ]
    },
  ];

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
              <Link href="/faq" className="text-foreground text-sm font-medium transition-colors">FAQ</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Privacy</Link>
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
            Frequently Asked Questions
          </h1>
          <p className="text-xl lg:text-2xl text-primary-foreground/90">
            Everything you need to know about TripPenguin
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 space-y-12">
          {faqSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 className="text-2xl font-bold mb-6 font-serif text-primary">
                {section.title}
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {section.questions.map((faq, faqIndex) => (
                  <AccordionItem 
                    key={faqIndex} 
                    value={`${sectionIndex}-${faqIndex}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left font-medium hover:no-underline" data-testid={`faq-question-${sectionIndex}-${faqIndex}`}>
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-serif">
            Still have questions?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Start planning your family adventure today — it's free!
          </p>
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
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
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
