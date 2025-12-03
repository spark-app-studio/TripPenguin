/**
 * Validator for itinerary structure
 * Validates itinerary constraints and structure integrity
 */

import type { ItineraryRecommendation } from "@shared/schema";

export interface ValidationOptions {
  expectedNights: number;
  originalCityNames?: string[];
  allowCityRemoval?: boolean;
  maxCities?: number;
}

/**
 * Validates that itinerary structure matches constraints
 * 
 * @param itinerary - Itinerary to validate
 * @param options - Validation options
 * @throws Error if validation fails
 */
export function validateItineraryStructure(
  itinerary: ItineraryRecommendation,
  options: ValidationOptions
): void {
  const { expectedNights, originalCityNames, allowCityRemoval, maxCities } = options;

  // Validate total nights matches sum of city nights
  const summedNights = itinerary.cities.reduce((sum, city) => sum + city.stayLengthNights, 0);
  if (summedNights !== itinerary.totalNights) {
    throw new Error(`Sum of city nights (${summedNights}) doesn't match totalNights (${itinerary.totalNights})`);
  }
  
  if (itinerary.totalNights !== expectedNights) {
    throw new Error(`Expected ${expectedNights} nights but got ${itinerary.totalNights}`);
  }
  
  // Validate city orders are sequential
  const orders = itinerary.cities.map(c => c.order);
  const expectedOrders = Array.from({ length: itinerary.cities.length }, (_, i) => i + 1);
  if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
    throw new Error(`City orders are not sequential: ${orders.join(', ')}`);
  }
  
  // Validate each city has at least 1 night
  const invalidCity = itinerary.cities.find(c => c.stayLengthNights < 1);
  if (invalidCity) {
    throw new Error(`City ${invalidCity.cityName} has ${invalidCity.stayLengthNights} nights (minimum is 1)`);
  }
  
  // Validate city count constraints
  if (maxCities && itinerary.cities.length > maxCities) {
    throw new Error(`Itinerary has ${itinerary.cities.length} cities but max allowed is ${maxCities}`);
  }
  
  // Validate city removal constraint
  if (originalCityNames && allowCityRemoval === false) {
    const currentCityNames = itinerary.cities.map(c => c.cityName);
    const removedCities = originalCityNames.filter(name => !currentCityNames.includes(name));
    if (removedCities.length > 0) {
      throw new Error(`Cities were removed (${removedCities.join(', ')}) but allowCityRemoval is false`);
    }
  }
  
  // Validate cost breakdown sums to reasonable total
  const breakdownSum = Object.values(itinerary.costBreakdown).reduce((sum, val) => sum + val, 0);
  if (breakdownSum < itinerary.totalCost.min * 0.8 || breakdownSum > itinerary.totalCost.max * 1.2) {
    throw new Error(`Cost breakdown sum (${breakdownSum}) is inconsistent with total cost range`);
  }
  
  // Validate all costs are non-negative
  Object.entries(itinerary.costBreakdown).forEach(([category, amount]) => {
    if (amount < 0) {
      throw new Error(`Negative cost for ${category}: ${amount}`);
    }
  });
}
