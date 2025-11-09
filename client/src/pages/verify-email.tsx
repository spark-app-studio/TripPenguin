import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plane, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    setToken(tokenParam);

    if (tokenParam) {
      verifyEmailMutation.mutate(tokenParam);
    }
  }, []);

  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-email", { token });
      return response.json();
    },
    onSuccess: () => {
      setVerificationStatus("success");
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified.",
      });
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    },
    onError: (error: Error) => {
      setVerificationStatus("error");
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify email",
        variant: "destructive",
      });
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-2">
                <Plane className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Guide2Go</span>
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Invalid Link</CardTitle>
            <CardDescription className="text-center">
              This email verification link is invalid.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-2">
              <Plane className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Guide2Go</span>
            </div>
          </div>
          
          {verificationStatus === "pending" && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl text-center">Verifying Email</CardTitle>
              <CardDescription className="text-center">
                Please wait while we verify your email address...
              </CardDescription>
            </>
          )}

          {verificationStatus === "success" && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-center">Email Verified!</CardTitle>
              <CardDescription className="text-center">
                Your email has been successfully verified. Redirecting to home...
              </CardDescription>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              <div className="flex justify-center">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-center">Verification Failed</CardTitle>
              <CardDescription className="text-center">
                This verification link is invalid or has expired.
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        {verificationStatus === "error" && (
          <CardContent className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You can request a new verification email from your account settings.
            </p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

