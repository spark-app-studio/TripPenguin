import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Terms of Service</h1>
          <Link href="/">
            <Button variant="outline" data-testid="button-back-home">
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Guide2Go Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Guide2Go, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use Guide2Go for personal, non-commercial trip planning purposes.
              This license shall automatically terminate if you violate any of these restrictions.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and current information.
              You are responsible for safeguarding the password and for all activities under your account.
            </p>

            <h2>4. Privacy</h2>
            <p>
              Your privacy is important to us. We collect and use your personal information in accordance with our Privacy Policy.
              By using Guide2Go, you consent to our collection and use of your information as described.
            </p>

            <h2>5. Trip Planning and AI Features</h2>
            <p>
              Guide2Go provides AI-powered budget and booking recommendations. These are suggestions only and should not be
              considered financial advice. You are solely responsible for your travel decisions and budget management.
            </p>

            <h2>6. Disclaimer</h2>
            <p>
              The materials on Guide2Go are provided on an 'as is' basis. We make no warranties, expressed or implied,
              and hereby disclaim and negate all other warranties including, without limitation, implied warranties or
              conditions of merchantability, fitness for a particular purpose, or non-infringement.
            </p>

            <h2>7. Limitations</h2>
            <p>
              In no event shall Guide2Go or its suppliers be liable for any damages (including, without limitation, damages
              for loss of data or profit, or due to business interruption) arising out of the use or inability to use Guide2Go.
            </p>

            <h2>8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material changes.
              Your continued use of Guide2Go after changes constitutes acceptance of the new terms.
            </p>

            <h2>9. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us.
            </p>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground font-semibold">
                Note: This is a placeholder Terms of Service. Please replace with actual legal terms appropriate for your jurisdiction.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
