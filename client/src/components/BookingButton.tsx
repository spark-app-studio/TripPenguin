/**
 * BookingButton Component
 * 
 * A specialized button for booking trip components (flights, hotels, etc.)
 * that enforces debt-free travel by disabling booking until sufficient savings
 * are available.
 * 
 * Features:
 * - Disabled state when category isn't fully funded
 * - Lock icon and visual indication when locked
 * - Tooltips explaining why button is locked/unlocked
 * - Consistent styling across all booking sections
 */

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, CheckCircle2, Calendar, ExternalLink } from "lucide-react";
import { BudgetCategory, getCategoryLabel } from "@/lib/budgetCalculations";
import { formatDateMonthYear } from "@/lib/budgetCalculations";

export interface BookingButtonProps {
  /** Budget category this button is for */
  category: BudgetCategory;
  /** Whether the category is fully funded */
  isFunded: boolean;
  /** Months until the category is funded */
  monthsToFund: number;
  /** Earliest date when booking is recommended */
  earliestDate: Date;
  /** Click handler when button is enabled */
  onClick?: () => void;
  /** Custom button text (defaults to "Book [Category]") */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: "default" | "outline" | "secondary";
  /** Whether to show external link icon */
  showExternalIcon?: boolean;
  /** Test ID for the button */
  testId?: string;
}

/**
 * Generate tooltip text based on funding status
 */
function getTooltipText(
  category: BudgetCategory,
  isFunded: boolean,
  monthsToFund: number,
  earliestDate: Date
): string {
  const categoryLabel = getCategoryLabel(category).toLowerCase();
  
  if (isFunded) {
    return `Great news! You've saved enough for ${categoryLabel}. Book now to lock in the best prices!`;
  }
  
  if (monthsToFund === 0) {
    return `Almost there! Just a bit more saving to book ${categoryLabel} debt-free.`;
  }
  
  if (monthsToFund === 1) {
    return `Just 1 more month of saving! Then you can book ${categoryLabel} without going into debt.`;
  }
  
  if (monthsToFund <= 3) {
    return `${monthsToFund} months until you can book ${categoryLabel} debt-free. Keep saving!`;
  }
  
  const dateStr = formatDateMonthYear(earliestDate);
  return `Continue saving until ${dateStr} to book ${categoryLabel} without debt. We're helping you travel without financial stress!`;
}

/**
 * BookingButton - A button that encourages debt-free booking
 * 
 * This button is designed to help users avoid going into debt for travel.
 * It remains locked until the user has saved enough for the specific category,
 * calculated using sequential savings allocation.
 */
export function BookingButton({
  category,
  isFunded,
  monthsToFund,
  earliestDate,
  onClick,
  label,
  className = "",
  variant = "default",
  showExternalIcon = false,
  testId
}: BookingButtonProps) {
  const categoryLabel = getCategoryLabel(category);
  const buttonLabel = label || `Book ${categoryLabel}`;
  const tooltipText = getTooltipText(category, isFunded, monthsToFund, earliestDate);
  
  // Determine if button should be enabled
  const isEnabled = isFunded;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-block">
          <Button
            variant={isEnabled ? variant : "secondary"}
            onClick={isEnabled ? onClick : undefined}
            disabled={!isEnabled}
            className={`gap-2 ${className} ${!isEnabled ? "cursor-not-allowed opacity-70" : ""}`}
            data-testid={testId || `button-book-${category}`}
          >
            {isEnabled ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {buttonLabel}
                {showExternalIcon && <ExternalLink className="w-4 h-4 ml-1" />}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {buttonLabel}
                {monthsToFund > 0 && (
                  <span className="text-xs opacity-75">
                    ({monthsToFund}mo)
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-xs text-center"
        data-testid={`tooltip-book-${category}`}
      >
        <div className="flex flex-col gap-1">
          {isEnabled ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Ready to Book!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">
                {formatDateMonthYear(earliestDate)}
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {tooltipText}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * BookingStatusBadge - Shows the funding status for a category
 */
export interface BookingStatusBadgeProps {
  isFunded: boolean;
  monthsToFund: number;
  savingsGap: number;
}

export function BookingStatusBadge({
  isFunded,
  monthsToFund,
  savingsGap
}: BookingStatusBadgeProps) {
  if (isFunded) {
    return (
      <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
        <CheckCircle2 className="w-4 h-4" />
        <span className="font-medium">Fully Funded</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
      <Lock className="w-4 h-4" />
      <span>
        ${savingsGap.toLocaleString()} to go
        {monthsToFund > 0 && ` (~${monthsToFund}mo)`}
      </span>
    </div>
  );
}

/**
 * SavingsProgressIndicator - Visual progress bar for savings
 */
export interface SavingsProgressIndicatorProps {
  allocated: number;
  target: number;
  label?: string;
}

export function SavingsProgressIndicator({
  allocated,
  target,
  label
}: SavingsProgressIndicatorProps) {
  const percentage = target > 0 ? Math.min(100, (allocated / target) * 100) : 0;
  const isFunded = allocated >= target;
  
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>${allocated.toLocaleString()} / ${target.toLocaleString()}</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            isFunded 
              ? "bg-green-500" 
              : percentage > 50 
                ? "bg-amber-500" 
                : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default BookingButton;
