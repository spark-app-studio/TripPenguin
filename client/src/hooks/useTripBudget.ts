/**
 * useTripBudget Hook
 * 
 * A centralized hook for managing trip budget calculations.
 * This hook provides:
 * - Real-time cost totals across all categories
 * - Sequential savings allocation
 * - Earliest booking date calculations for each category
 * - AI-recommended monthly savings
 * - Booking readiness status
 * 
 * Usage:
 * ```tsx
 * const budget = useTripBudget({
 *   categoryCosts: { flights: 1200, accommodations: 800, ... },
 *   currentSavings: 2000,
 *   monthlySavings: 500,
 *   pointsToUse: 50000
 * });
 * 
 * // Access calculated values
 * budget.totalTripCost
 * budget.categories.flights.isFunded
 * budget.categories.flights.earliestBookingDate
 * ```
 */

import { useMemo } from 'react';
import {
  calculateTripBudget,
  CategoryCosts,
  TripBudgetCalculation,
  BudgetCategory,
  canBookNow,
  getBookingTooltip,
  formatCurrency,
  formatDateMonthYear,
  getCategoryLabel,
  calculatePointsValue
} from '@/lib/budgetCalculations';

/**
 * Input parameters for the useTripBudget hook
 */
export interface UseTripBudgetParams {
  /** Cost estimates for each category */
  categoryCosts: CategoryCosts;
  /** Current savings balance in dollars */
  currentSavings: number;
  /** Monthly savings rate in dollars (0 = use AI recommendation) */
  monthlySavings: number;
  /** Credit card points to apply to flights (optional) */
  pointsToUse?: number;
  /** Whether points should be used (optional toggle) */
  usePoints?: boolean;
}

/**
 * Extended output with helper methods
 */
export interface UseTripBudgetResult extends TripBudgetCalculation {
  /** Check if a specific category can be booked now */
  canBookCategory: (category: BudgetCategory) => boolean;
  /** Get tooltip text for a category's booking button */
  getTooltip: (category: BudgetCategory) => string;
  /** Format any amount as currency */
  formatAmount: (amount: number) => string;
  /** Format any date as month/year */
  formatDate: (date: Date) => string;
  /** Get display label for a category */
  getLabel: (category: BudgetCategory) => string;
  /** Get points value in dollars */
  getPointsValue: () => number;
  /** Check if the trip is fully funded */
  isFullyFunded: boolean;
  /** Check if user has started saving */
  hasSavings: boolean;
  /** Percentage to display (capped at 100) */
  displayProgress: number;
}

/**
 * Hook for calculating and managing trip budget data
 * 
 * This hook memoizes all calculations to prevent unnecessary re-renders
 * and provides a clean interface for accessing budget information.
 */
export function useTripBudget({
  categoryCosts,
  currentSavings,
  monthlySavings,
  pointsToUse = 0,
  usePoints = false
}: UseTripBudgetParams): UseTripBudgetResult {
  
  // Only apply points if the usePoints flag is enabled
  const effectivePoints = usePoints ? pointsToUse : 0;
  
  // Calculate the complete budget
  const budgetCalculation = useMemo(() => {
    return calculateTripBudget(
      categoryCosts,
      currentSavings,
      monthlySavings,
      effectivePoints
    );
  }, [
    categoryCosts.flights,
    categoryCosts.accommodations,
    categoryCosts.transportation,
    categoryCosts.activities,
    categoryCosts.food,
    categoryCosts.preparation,
    currentSavings,
    monthlySavings,
    effectivePoints
  ]);
  
  // Helper functions memoized together
  const helpers = useMemo(() => ({
    canBookCategory: (category: BudgetCategory): boolean => {
      const categoryData = budgetCalculation.categories[category];
      return categoryData.isFunded || canBookNow(categoryData.earliestBookingDate);
    },
    
    getTooltip: (category: BudgetCategory): string => {
      const categoryData = budgetCalculation.categories[category];
      return getBookingTooltip(
        getCategoryLabel(category),
        categoryData.isFunded,
        categoryData.monthsToFund,
        categoryData.earliestBookingDate
      );
    },
    
    formatAmount: formatCurrency,
    formatDate: formatDateMonthYear,
    getLabel: getCategoryLabel,
    
    getPointsValue: (): number => {
      return calculatePointsValue(effectivePoints);
    },
    
    isFullyFunded: budgetCalculation.remainingToSave === 0,
    hasSavings: currentSavings > 0,
    displayProgress: Math.min(100, budgetCalculation.savingsProgress)
  }), [budgetCalculation, effectivePoints, currentSavings]);
  
  return {
    ...budgetCalculation,
    ...helpers
  };
}

/**
 * Type guard to check if a string is a valid budget category
 */
export function isBudgetCategory(value: string): value is BudgetCategory {
  return ['flights', 'accommodations', 'transportation', 'activities', 'food', 'preparation'].includes(value);
}

/**
 * Default category costs for when no data is available
 */
export const DEFAULT_CATEGORY_COSTS: CategoryCosts = {
  flights: 0,
  accommodations: 0,
  transportation: 0,
  activities: 0,
  food: 0,
  preparation: 0
};

export { type BudgetCategory, type CategoryCosts } from '@/lib/budgetCalculations';
