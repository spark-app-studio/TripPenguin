/**
 * Budget Calculation Utilities for TripPenguin
 * 
 * These utilities provide consistent financial calculations across the application,
 * supporting the goal of debt-free travel planning.
 * 
 * Key concepts:
 * - Sequential Savings Allocation: Savings are allocated to categories in priority order
 *   (Flights → Accommodations → Transportation → Activities → Food → Preparation)
 * - Earliest Booking Dates: Each category has an earliest date when booking is recommended,
 *   calculated based on when sufficient savings will be available
 * - Points Conversion: Credit card points can offset flight costs at a fixed rate
 */

// Points conversion rate: 1.5 cents per point (typical travel card value)
export const POINTS_CONVERSION_RATE = 0.015;

/**
 * Budget category types for sequential allocation
 */
export type BudgetCategory = 
  | "flights" 
  | "accommodations" 
  | "transportation" 
  | "activities" 
  | "food" 
  | "preparation";

/**
 * Order of priority for savings allocation
 * Flights are booked first, followed by accommodations, etc.
 */
export const ALLOCATION_ORDER: BudgetCategory[] = [
  "flights",
  "accommodations", 
  "transportation",
  "activities",
  "food",
  "preparation"
];

/**
 * Interface for individual category budget data
 */
export interface CategoryBudgetData {
  estimatedCost: number;
  allocatedSavings: number;
  savingsGap: number;
  isFunded: boolean;
  earliestBookingDate: Date;
  monthsToFund: number;
}

/**
 * Interface for complete trip budget calculation result
 */
export interface TripBudgetCalculation {
  // Total costs
  totalTripCost: number;
  totalCostBeforePoints: number;
  pointsValue: number;
  
  // Savings info
  currentSavings: number;
  monthlySavings: number;
  remainingToSave: number;
  savingsProgress: number; // 0-100 percentage
  
  // Timing
  monthsToFullyFunded: number;
  earliestTravelDate: Date;
  
  // Per-category breakdown
  categories: Record<BudgetCategory, CategoryBudgetData>;
  
  // AI recommendations
  recommendedMonthlySavings: number;
}

/**
 * Category cost inputs for budget calculation
 */
export interface CategoryCosts {
  flights: number;
  accommodations: number;
  transportation: number;
  activities: number;
  food: number;
  preparation: number;
}

/**
 * Calculate the value of credit card points in dollars
 * @param points - Number of points to convert
 * @returns Dollar value of points
 */
export function calculatePointsValue(points: number): number {
  return Math.round(points * POINTS_CONVERSION_RATE);
}

/**
 * Calculate flight cost after applying credit card points
 * @param baseCost - Original flight cost in dollars
 * @param pointsToUse - Number of points to apply
 * @returns Net flight cost after points discount
 */
export function calculateFlightCostAfterPoints(
  baseCost: number,
  pointsToUse: number
): number {
  const pointsValue = calculatePointsValue(pointsToUse);
  return Math.max(0, baseCost - pointsValue);
}

/**
 * Calculate AI-recommended monthly savings based on total trip cost
 * 
 * The algorithm uses adaptive timeframes:
 * - Small trips (< $2,000): Target 6 months
 * - Medium trips ($2,000 - $5,000): Target 9 months
 * - Large trips ($5,000 - $10,000): Target 12 months
 * - Very large trips (> $10,000): Target 15 months
 * 
 * @param totalCost - Total estimated trip cost
 * @param currentSavings - Current savings amount
 * @returns Recommended monthly savings amount
 */
export function calculateRecommendedMonthlySavings(
  totalCost: number,
  currentSavings: number
): number {
  if (totalCost <= 0) return 0;
  
  // Determine target months based on trip cost
  let targetMonths: number;
  if (totalCost < 2000) {
    targetMonths = 6;
  } else if (totalCost < 5000) {
    targetMonths = 9;
  } else if (totalCost < 10000) {
    targetMonths = 12;
  } else {
    targetMonths = 15;
  }
  
  // Calculate amount still needed
  const amountToSave = Math.max(0, totalCost - currentSavings);
  
  // Calculate monthly savings (round up to ensure we reach goal)
  return Math.ceil(amountToSave / targetMonths);
}

/**
 * Calculate the earliest date when a specific amount will be saved
 * 
 * This is used to determine when each category can be booked without going into debt.
 * 
 * @param targetAmount - Amount needed for this category
 * @param currentSavings - Current total savings
 * @param previousAllocations - Total already allocated to higher-priority categories
 * @param monthlySavings - Monthly savings rate
 * @returns Date when the category will be fully funded
 */
export function calculateEarliestDate(
  targetAmount: number,
  currentSavings: number,
  previousAllocations: number,
  monthlySavings: number
): Date {
  const today = new Date();
  
  // Available savings for this category (after higher-priority allocations)
  const availableForCategory = Math.max(0, currentSavings - previousAllocations);
  
  // If already funded, can book today
  if (availableForCategory >= targetAmount) {
    return today;
  }
  
  // If no monthly savings, return a far future date
  if (monthlySavings <= 0) {
    const farFuture = new Date(today);
    farFuture.setFullYear(farFuture.getFullYear() + 10);
    return farFuture;
  }
  
  // Calculate months needed to save the remaining amount
  const remainingNeeded = targetAmount - availableForCategory;
  const monthsNeeded = Math.ceil(remainingNeeded / monthlySavings);
  
  // Calculate the target date
  const targetDate = new Date(today);
  targetDate.setMonth(targetDate.getMonth() + monthsNeeded);
  
  return targetDate;
}

/**
 * Calculate months until a date
 * @param targetDate - Target date
 * @returns Number of months from today
 */
export function calculateMonthsUntil(targetDate: Date): number {
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(diffDays / 30));
}

/**
 * Allocate savings sequentially across budget categories
 * 
 * Savings are allocated in priority order:
 * 1. Flights (must be booked first for travel)
 * 2. Accommodations (need to confirm before trip)
 * 3. Transportation (ground transport, trains, etc.)
 * 4. Activities (tours, tickets, experiences)
 * 5. Food (dining reservations, food tours)
 * 6. Preparation (gear, supplies - can wait longest)
 * 
 * Each category only receives funds after higher-priority categories are fully funded.
 * 
 * @param categoryCosts - Cost for each category
 * @param currentSavings - Total current savings
 * @param monthlySavings - Monthly savings rate
 * @returns Allocation details for each category
 */
export function allocateSavingsSequentially(
  categoryCosts: CategoryCosts,
  currentSavings: number,
  monthlySavings: number
): Record<BudgetCategory, CategoryBudgetData> {
  const result: Record<BudgetCategory, CategoryBudgetData> = {} as Record<BudgetCategory, CategoryBudgetData>;
  
  let remainingSavings = currentSavings;
  let totalPreviousAllocations = 0;
  
  for (const category of ALLOCATION_ORDER) {
    const cost = categoryCosts[category];
    
    // Allocate available savings to this category
    const allocatedSavings = Math.min(remainingSavings, cost);
    const savingsGap = Math.max(0, cost - allocatedSavings);
    const isFunded = savingsGap === 0;
    
    // Calculate earliest booking date
    const earliestDate = calculateEarliestDate(
      cost,
      currentSavings,
      totalPreviousAllocations,
      monthlySavings
    );
    
    const monthsToFund = calculateMonthsUntil(earliestDate);
    
    result[category] = {
      estimatedCost: cost,
      allocatedSavings,
      savingsGap,
      isFunded,
      earliestBookingDate: earliestDate,
      monthsToFund
    };
    
    // Update running totals
    remainingSavings = Math.max(0, remainingSavings - cost);
    totalPreviousAllocations += cost;
  }
  
  return result;
}

/**
 * Calculate complete trip budget including all categories and timing
 * 
 * This is the main calculation function that produces all budget-related data
 * needed by the UI.
 * 
 * @param categoryCosts - Costs for each category
 * @param currentSavings - Current savings balance
 * @param monthlySavings - Monthly savings amount (0 uses AI recommendation)
 * @param pointsToUse - Credit card points to apply to flights
 * @returns Complete budget calculation
 */
export function calculateTripBudget(
  categoryCosts: CategoryCosts,
  currentSavings: number,
  monthlySavings: number,
  pointsToUse: number = 0
): TripBudgetCalculation {
  // Calculate points value and adjusted flight cost
  const pointsValue = calculatePointsValue(pointsToUse);
  const flightCostAfterPoints = calculateFlightCostAfterPoints(
    categoryCosts.flights,
    pointsToUse
  );
  
  // Adjusted costs with points applied to flights
  const adjustedCosts: CategoryCosts = {
    ...categoryCosts,
    flights: flightCostAfterPoints
  };
  
  // Calculate totals
  const totalCostBeforePoints = 
    categoryCosts.flights +
    categoryCosts.accommodations +
    categoryCosts.transportation +
    categoryCosts.activities +
    categoryCosts.food +
    categoryCosts.preparation;
  
  const totalTripCost =
    flightCostAfterPoints +
    categoryCosts.accommodations +
    categoryCosts.transportation +
    categoryCosts.activities +
    categoryCosts.food +
    categoryCosts.preparation;
  
  // Calculate recommended monthly savings
  const recommendedMonthlySavings = calculateRecommendedMonthlySavings(
    totalTripCost,
    currentSavings
  );
  
  // Use provided monthly savings or fall back to recommendation
  const effectiveMonthlySavings = monthlySavings > 0 
    ? monthlySavings 
    : recommendedMonthlySavings;
  
  // Allocate savings across categories
  const categories = allocateSavingsSequentially(
    adjustedCosts,
    currentSavings,
    effectiveMonthlySavings
  );
  
  // Calculate overall metrics
  const remainingToSave = Math.max(0, totalTripCost - currentSavings);
  const savingsProgress = totalTripCost > 0 
    ? Math.min(100, (currentSavings / totalTripCost) * 100)
    : 0;
  
  const monthsToFullyFunded = effectiveMonthlySavings > 0
    ? Math.ceil(remainingToSave / effectiveMonthlySavings)
    : 0;
  
  // Calculate earliest travel date (when all categories are funded)
  const earliestTravelDate = new Date();
  earliestTravelDate.setMonth(earliestTravelDate.getMonth() + monthsToFullyFunded);
  
  return {
    totalTripCost,
    totalCostBeforePoints,
    pointsValue,
    currentSavings,
    monthlySavings: effectiveMonthlySavings,
    remainingToSave,
    savingsProgress,
    monthsToFullyFunded,
    earliestTravelDate,
    categories,
    recommendedMonthlySavings
  };
}

/**
 * Format currency for display
 * @param amount - Dollar amount
 * @returns Formatted string like "$1,234"
 */
export function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

/**
 * Format date for display
 * @param date - Date to format
 * @returns Formatted string like "March 2025"
 */
export function formatDateMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Check if a booking date has been reached (can book today)
 * @param earliestDate - Earliest booking date
 * @returns True if the date is today or earlier
 */
export function canBookNow(earliestDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(earliestDate);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate <= today;
}

/**
 * Get booking button tooltip text based on funding status
 * @param category - Budget category name
 * @param isFunded - Whether the category is fully funded
 * @param monthsToFund - Months until fully funded
 * @param earliestDate - Earliest booking date
 * @returns Tooltip text explaining the button state
 */
export function getBookingTooltip(
  category: string,
  isFunded: boolean,
  monthsToFund: number,
  earliestDate: Date
): string {
  if (isFunded) {
    return `You've saved enough for ${category.toLowerCase()}! Book now to lock in prices.`;
  }
  
  if (monthsToFund === 1) {
    return `Just 1 more month of saving and you can book ${category.toLowerCase()} debt-free!`;
  }
  
  if (monthsToFund <= 3) {
    return `${monthsToFund} months until you can book ${category.toLowerCase()} without going into debt.`;
  }
  
  return `Save for ${monthsToFund} more months to book ${category.toLowerCase()} debt-free. Target date: ${formatDateMonthYear(earliestDate)}.`;
}

/**
 * Get a human-readable label for a budget category
 * @param category - Budget category key
 * @returns Display label
 */
export function getCategoryLabel(category: BudgetCategory): string {
  const labels: Record<BudgetCategory, string> = {
    flights: "Flights",
    accommodations: "Accommodations",
    transportation: "Transportation",
    activities: "Activities",
    food: "Food & Dining",
    preparation: "Trip Preparation"
  };
  return labels[category] || category;
}
