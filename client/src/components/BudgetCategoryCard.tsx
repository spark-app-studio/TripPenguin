import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plane, Home, Utensils, Car, PartyPopper, ShoppingBag, Sparkles, Loader2, BookOpen } from "lucide-react";

interface BudgetCategoryCardProps {
  category: string;
  estimatedCost: string;
  notes?: string;
  usePoints?: boolean;
  onEstimatedCostChange: (value: string) => void;
  onNotesChange?: (value: string) => void;
  onUsePointsChange?: (value: boolean) => void;
  tips?: string[];
  onGetAIGuidance?: () => void;
  isLoadingAI?: boolean;
}

const categoryIcons: Record<string, any> = {
  flights: Plane,
  housing: Home,
  food: Utensils,
  transportation: Car,
  fun: PartyPopper,
  preparation: ShoppingBag,
  booksMovies: BookOpen,
};

const categoryTitles: Record<string, string> = {
  flights: "Flight Costs",
  housing: "Accommodations",
  food: "Food Costs",
  transportation: "Transportation",
  fun: "Fun & Activities",
  preparation: "Trip Preparation",
  booksMovies: "Books & Movies",
};

const categoryDescriptions: Record<string, string> = {
  flights: "Roundtrip airfare for all travelers",
  housing: "Hotels, Airbnb, or other accommodations",
  food: "Restaurants, groceries, and dining",
  transportation: "Local transit, trains, car rentals",
  fun: "Tours, attractions, entertainment",
  preparation: "Luggage, travel gear, supplies",
  booksMovies: "Travel guides, in-flight entertainment, destination-themed media",
};

export function BudgetCategoryCard({
  category,
  estimatedCost,
  notes,
  usePoints = false,
  onEstimatedCostChange,
  onNotesChange,
  onUsePointsChange,
  tips,
  onGetAIGuidance,
  isLoadingAI = false,
}: BudgetCategoryCardProps) {
  const Icon = categoryIcons[category] || ShoppingBag;
  const title = categoryTitles[category] || category;
  const description = categoryDescriptions[category] || "";

  return (
    <Card data-testid={`budget-card-${category}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          {onGetAIGuidance && (
            <Button
              size="sm"
              onClick={onGetAIGuidance}
              disabled={isLoadingAI}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all gap-1.5 shrink-0"
              data-testid={`button-ai-guidance-${category}`}
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">AI Guide</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${category}-cost`}>Estimated Cost (USD)</Label>
          <Input
            id={`${category}-cost`}
            type="number"
            min="0"
            step="0.01"
            value={estimatedCost}
            onChange={(e) => onEstimatedCostChange(e.target.value)}
            placeholder="0.00"
            data-testid={`input-${category}-cost`}
          />
        </div>

        {category === "flights" && onUsePointsChange && (
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <Label htmlFor={`${category}-points`} className="flex-1 cursor-pointer">
              Use Credit Card Points
            </Label>
            <Switch
              id={`${category}-points`}
              checked={usePoints}
              onCheckedChange={onUsePointsChange}
              data-testid="switch-use-points"
            />
          </div>
        )}

        {onNotesChange && (
          <div className="space-y-2">
            <Label htmlFor={`${category}-notes`}>Notes</Label>
            <Textarea
              id={`${category}-notes`}
              value={notes || ""}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add notes, websites, or reminders..."
              rows={2}
              data-testid={`textarea-${category}-notes`}
            />
          </div>
        )}

        {tips && tips.length > 0 && (
          <div className="p-3 rounded-md bg-muted/30 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Tips:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {tips.map((tip, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Total</span>
            <span className="text-xl font-semibold text-primary" data-testid={`text-${category}-total`}>
              ${parseFloat(estimatedCost || "0").toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
