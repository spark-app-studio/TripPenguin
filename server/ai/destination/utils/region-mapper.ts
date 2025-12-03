/**
 * Region mapping utilities for US domestic trips
 */

/**
 * US region descriptions for domestic trip planning
 */
const US_REGION_MAP: Record<string, string> = {
  "new-england": "New England (Maine, New Hampshire, Vermont, Massachusetts, Rhode Island, Connecticut) - coastal towns, fall foliage, colonial history, lighthouses, lobster shacks",
  "mid-atlantic": "Mid-Atlantic (New York, New Jersey, Pennsylvania, Delaware, Maryland, Washington D.C.) - world-class museums, historic sites, iconic cities, diverse neighborhoods",
  "southeast": "Southeast (Virginia, North Carolina, South Carolina, Georgia, Florida, Alabama, Mississippi, Louisiana, Tennessee, Kentucky) - beaches, Southern hospitality, music cities, warm weather",
  "midwest": "Midwest (Ohio, Michigan, Indiana, Illinois, Wisconsin, Minnesota, Iowa, Missouri, Kansas, Nebraska, North Dakota, South Dakota) - Great Lakes, friendly towns, American heartland",
  "mountains-west": "Mountain West (Colorado, Wyoming, Montana, Idaho, Utah) - Rocky Mountains, ski towns, national parks, wilderness adventures, alpine scenery",
  "southwest": "Southwest (Arizona, New Mexico, Nevada, Texas) - desert landscapes, canyonlands, stargazing, Native American heritage, vibrant culture",
  "pacific-coast": "Pacific Coast (California, Oregon, Washington, Alaska, Hawaii) - ocean cliffs, redwood forests, coastal drives, diverse landscapes",
  "surprise": "anywhere in the United States that best matches their preferences",
} as const;

/**
 * Gets a human-readable description of a US region
 * Used in AI prompts to guide domestic trip recommendations
 * 
 * @param usRegion - US region identifier (e.g., "pacific-coast", "southeast")
 * @returns Detailed description of the region and its characteristics
 * 
 * @example
 * ```typescript
 * const desc = getUSRegionDescription("pacific-coast");
 * // Returns: "Pacific Coast (California, Oregon, Washington, Alaska, Hawaii) - 
 * //           ocean cliffs, redwood forests, coastal drives, diverse landscapes"
 * ```
 */
export function getUSRegionDescription(usRegion?: string): string {
  return US_REGION_MAP[usRegion || "surprise"] || "anywhere in the United States";
}
