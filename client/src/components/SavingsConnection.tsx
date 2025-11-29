import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  PiggyBank, 
  Link2, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2,
  Loader2,
  ChevronRight,
  RefreshCw,
  Wallet,
  ExternalLink
} from "lucide-react";

interface SavingsConnectionProps {
  initialSavings?: string;
  initialLinked?: boolean;
  initialManual?: boolean;
  onComplete: (data: { 
    currentSavings: string; 
    savingsAccountLinked: boolean; 
    savingsAmountManual: boolean;
  }) => void;
  onBack?: () => void;
}

export function SavingsConnection({ 
  initialSavings = "0",
  initialLinked = false,
  initialManual = false,
  onComplete,
  onBack 
}: SavingsConnectionProps) {
  const [connectionMethod, setConnectionMethod] = useState<"none" | "linked" | "manual">(
    initialLinked ? "linked" : initialManual ? "manual" : "none"
  );
  const [manualAmount, setManualAmount] = useState(initialSavings);
  const [isConnecting, setIsConnecting] = useState(false);
  const [linkedAccountName, setLinkedAccountName] = useState(initialLinked ? "Chase Savings ****4521" : "");
  const [linkedBalance, setLinkedBalance] = useState(initialLinked ? initialSavings : "");

  const handleConnectPlaid = async () => {
    setIsConnecting(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockBalance = Math.floor(Math.random() * 5000) + 1000;
    setLinkedAccountName("Chase Savings ****4521");
    setLinkedBalance(mockBalance.toString());
    setConnectionMethod("linked");
    setIsConnecting(false);
  };

  const handleManualEntry = () => {
    setConnectionMethod("manual");
  };

  const handleContinue = () => {
    const savings = connectionMethod === "linked" ? linkedBalance : manualAmount;
    onComplete({
      currentSavings: savings || "0",
      savingsAccountLinked: connectionMethod === "linked",
      savingsAmountManual: connectionMethod === "manual",
    });
  };

  const canContinue = connectionMethod !== "none" && 
    ((connectionMethod === "linked" && linkedBalance) || 
     (connectionMethod === "manual" && parseFloat(manualAmount) >= 0));

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <PiggyBank className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect Your Savings</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          To help you track your progress toward this trip, let's connect your savings account or enter your current savings amount.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        <Card 
          className={`hover-elevate cursor-pointer transition-all ${
            connectionMethod === "linked" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => !isConnecting && connectionMethod !== "linked" && handleConnectPlaid()}
          data-testid="card-connect-bank"
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  Link Bank Account
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </CardTitle>
                <CardDescription>Automatically sync your balance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {connectionMethod === "linked" && linkedAccountName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Account Connected</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{linkedAccountName}</p>
                  <p className="text-2xl font-bold" data-testid="text-linked-balance">
                    ${parseFloat(linkedBalance).toLocaleString()}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnectPlaid();
                  }}
                  data-testid="button-refresh-balance"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Balance
                </Button>
              </div>
            ) : isConnecting ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Connecting to your bank...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Securely connect through Plaid to automatically track your savings balance.
                </p>
                <Button className="w-full" data-testid="button-connect-plaid">
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect with Plaid
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Powered by Plaid · Bank-level security
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`hover-elevate cursor-pointer transition-all ${
            connectionMethod === "manual" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => handleManualEntry()}
          data-testid="card-manual-entry"
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Wallet className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Enter Manually</CardTitle>
                <CardDescription>Update your savings yourself</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {connectionMethod === "manual" ? (
              <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-2">
                  <Label htmlFor="manual-savings">Current Savings Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="manual-savings"
                      type="number"
                      min="0"
                      step="100"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="pl-9"
                      placeholder="0"
                      data-testid="input-manual-savings"
                    />
                  </div>
                </div>
                <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 dark:text-amber-400">Keep it updated</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                    You'll need to manually update this amount as your savings grow. We recommend updating it at least once a month.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Prefer to track savings yourself? Enter your current amount and update it as you save.
                </p>
                <Button variant="outline" className="w-full" data-testid="button-enter-manual">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Enter Amount
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {connectionMethod !== "none" && (
        <div className="max-w-3xl mx-auto">
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <PiggyBank className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              <strong>Why track savings?</strong> TripPirate uses your savings to show you when you can afford to book each part of your trip — helping you travel debt-free!
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex justify-between pt-6 max-w-3xl mx-auto">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            data-testid="button-back"
          >
            Back
          </Button>
        )}
        <div className={onBack ? "" : "ml-auto"}>
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!canContinue}
            className="min-h-0"
            data-testid="button-continue-savings"
          >
            Continue
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
