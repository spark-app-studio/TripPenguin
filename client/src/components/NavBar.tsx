import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PenguinLogo } from "@/components/PenguinLogo";

interface NavBarProps {
  showAuthButtons?: boolean;
}

export function NavBar({ showAuthButtons = true }: NavBarProps) {
  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <PenguinLogo size="md" />
            <span className="text-xl font-bold">TripPenguin</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">About</Link>
            <Link href="/meet-pebbles" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Meet Pebbles</Link>
            <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">FAQ</Link>
          </nav>

          {showAuthButtons && (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" data-testid="button-signup">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
