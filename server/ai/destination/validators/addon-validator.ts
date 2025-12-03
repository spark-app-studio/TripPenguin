/**
 * Validator for itinerary add-ons
 * Validates add-on structure, constraints, and consistency
 */

import type { ItineraryAddon, ItineraryRecommendation } from "@shared/schema";

/**
 * Validates a single add-on structure
 * 
 * @param addon - Add-on to validate
 * @param index - Index of add-on in array (for error messages)
 * @throws Error if validation fails
 */
export function validateAddonStructure(addon: ItineraryAddon, index: number): void {
  if (addon.deltaNights < 1) {
    throw new Error(`Add-on ${index + 1} has invalid deltaNights: ${addon.deltaNights} (minimum is 1)`);
  }
  
  if (addon.deltaCost.min <= 0 || addon.deltaCost.max <= 0) {
    throw new Error(`Add-on ${index + 1} has non-positive costs: min=${addon.deltaCost.min}, max=${addon.deltaCost.max}`);
  }
  
  if (addon.deltaCost.min > addon.deltaCost.max) {
    throw new Error(`Add-on ${index + 1} has min cost greater than max: ${addon.deltaCost.min} > ${addon.deltaCost.max}`);
  }
}

/**
 * Validates an array of add-ons
 * 
 * @param addons - Array of add-ons to validate
 * @throws Error if validation fails
 */
export function validateAddons(addons: ItineraryAddon[]): void {
  // Validate each add-on structure
  addons.forEach((addon, index) => {
    validateAddonStructure(addon, index);
  });
  
  // Validate add-ons are monotonically sized (first should be shortest)
  for (let i = 1; i < addons.length; i++) {
    if (addons[i].deltaNights <= addons[i - 1].deltaNights) {
      throw new Error(`Add-ons are not progressively sized: addon ${i} has ${addons[i].deltaNights} nights vs addon ${i - 1} has ${addons[i - 1].deltaNights} nights`);
    }
  }
  
  // Validate unique IDs
  const ids = addons.map(a => a.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error(`Add-ons have duplicate IDs: ${ids.join(', ')}`);
  }
}

/**
 * Validates that original cities are preserved when applying an add-on
 * 
 * @param originalItinerary - Original itinerary before add-on
 * @param updatedItinerary - Updated itinerary after add-on
 * @throws Error if cities were removed
 */
export function validateCitiesPreserved(
  originalItinerary: ItineraryRecommendation,
  updatedItinerary: ItineraryRecommendation
): void {
  const originalCityNames = originalItinerary.cities.map(c => c.cityName);
  const updatedCityNames = updatedItinerary.cities.map(c => c.cityName);
  const missingCities = originalCityNames.filter(name => !updatedCityNames.includes(name));
  
  if (missingCities.length > 0) {
    throw new Error(`Add-on removed original cities (${missingCities.join(', ')}), which is not allowed`);
  }
}

/**
 * Validates that cost increase matches add-on expectations
 * 
 * @param originalItinerary - Original itinerary before add-on
 * @param updatedItinerary - Updated itinerary after add-on
 * @param addon - Add-on that was applied
 * @throws Error if cost increase doesn't match expectations
 */
export function validateAddonCostIncrease(
  originalItinerary: ItineraryRecommendation,
  updatedItinerary: ItineraryRecommendation,
  addon: ItineraryAddon
): void {
  const expectedMinCost = originalItinerary.totalCost.min + addon.deltaCost.min;
  const expectedMaxCost = originalItinerary.totalCost.max + addon.deltaCost.max;
  
  // For small add-ons (<$500), allow ±30% variance; for large add-ons, allow ±20%
  const minTolerance = addon.deltaCost.min < 500 ? 0.3 : 0.2;
  const maxTolerance = addon.deltaCost.max < 500 ? 0.3 : 0.2;
  
  if (updatedItinerary.totalCost.min < expectedMinCost * (1 - minTolerance) || 
      updatedItinerary.totalCost.min > expectedMinCost * (1 + minTolerance)) {
    throw new Error(`Cost increase doesn't match add-on (expected ~${expectedMinCost}, got ${updatedItinerary.totalCost.min})`);
  }
  
  if (updatedItinerary.totalCost.max < expectedMaxCost * (1 - maxTolerance) || 
      updatedItinerary.totalCost.max > expectedMaxCost * (1 + maxTolerance)) {
    throw new Error(`Max cost increase doesn't match add-on (expected ~${expectedMaxCost}, got ${updatedItinerary.totalCost.max})`);
  }
}
