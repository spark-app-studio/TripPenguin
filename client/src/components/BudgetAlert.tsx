import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface BudgetAlertProps {
  totalEstimated: number;
  totalSavings: number;
  className?: string;
}

export function BudgetAlert({ totalEstimated, totalSavings, className }: BudgetAlertProps) {
  const percentageUsed = totalSavings > 0 ? (totalEstimated / totalSavings) * 100 : 0;
  const isOverBudget = totalEstimated > totalSavings;
  const isNearLimit = percentageUsed >= 90 && percentageUsed < 100;
  const isOnTrack = percentageUsed < 90;

  if (totalSavings === 0) return null;

  return (
    <Alert
      className={cn(
        "border-2",
        isOverBudget && "bg-destructive/5 border-destructive",
        isNearLimit && "bg-yellow-500/5 border-yellow-500",
        isOnTrack && "bg-green-500/5 border-green-500",
        className
      )}
      data-testid="budget-alert"
    >
      {isOverBudget && <AlertCircle className="h-5 w-5 text-destructive" />}
      {isNearLimit && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
      {isOnTrack && <CheckCircle className="h-5 w-5 text-green-600" />}

      <AlertTitle className={cn(
        "font-semibold",
        isOverBudget && "text-destructive",
        isNearLimit && "text-yellow-700",
        isOnTrack && "text-green-700"
      )}>
        {isOverBudget && "Over Budget!"}
        {isNearLimit && "Approaching Budget Limit"}
        {isOnTrack && "On Track!"}
      </AlertTitle>

      <AlertDescription className="text-sm">
        {isOverBudget && (
          <>
            You're <span className="font-semibold">${(totalEstimated - totalSavings).toFixed(2)}</span> over budget.
            Consider reducing costs in flights, housing, or fun activities to get back on track.
          </>
        )}
        {isNearLimit && (
          <>
            You've used <span className="font-semibold">{percentageUsed.toFixed(0)}%</span> of your budget.
            Keep an eye on remaining costs to stay within limits.
          </>
        )}
        {isOnTrack && (
          <>
            Great job! You're using <span className="font-semibold">{percentageUsed.toFixed(0)}%</span> of your budget
            and have <span className="font-semibold">${(totalSavings - totalEstimated).toFixed(2)}</span> remaining.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
