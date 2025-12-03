/**
 * Preferences context builder for AI prompts
 * Converts quiz preferences into formatted context strings for prompts
 */

export interface QuizPreferences {
  tripGoal?: string;
  placeType?: string;
  dayPace?: string;
  spendingPriority?: string;
  travelersType?: string;
  kidsAges?: string[];
  accommodationType?: string;
  mustHave?: string;
}

/**
 * Builds a formatted preferences context string from quiz preferences
 * Used across multiple prompt builders to incorporate traveler preferences
 * 
 * @param prefs - Quiz preferences object
 * @returns Formatted string describing all preferences
 * 
 * @example
 * ```typescript
 * const context = buildPreferencesContext({
 *   tripGoal: "culture",
 *   dayPace: "relaxed",
 *   kidsAges: ["5", "8"]
 * });
 * // Returns formatted string with all preferences
 * ```
 */
export function buildPreferencesContext(prefs: QuizPreferences): string {
  const parts: string[] = [];
  
  if (prefs.tripGoal) {
    const goalMap: Record<string, string> = {
      rest: "seeking relaxation and peaceful experiences - prioritize spas, scenic viewpoints, leisurely strolls, and peaceful cafes",
      culture: "interested in culture, history, and learning - include museums, historical sites, local traditions, and cultural experiences",
      thrill: "looking for adventure and excitement - suggest active experiences, unique adventures, and energetic activities",
      magic: "wanting magical, once-in-a-lifetime moments - focus on iconic experiences, bucket-list items, and unforgettable moments",
    };
    parts.push(`Trip goal: ${goalMap[prefs.tripGoal] || prefs.tripGoal}`);
  }
  
  if (prefs.placeType) {
    const placeMap: Record<string, string> = {
      ocean: "loves beaches and ocean views - include waterfront activities, coastal walks, and ocean-related experiences",
      mountains: "drawn to mountains and nature - prioritize hiking, scenic overlooks, and outdoor activities",
      ancientCities: "fascinated by historic places - focus on old town areas, historical landmarks, and heritage sites",
      modernSkyline: "enjoys modern urban environments - include observation decks, contemporary architecture, and city experiences",
    };
    parts.push(`Environment preference: ${placeMap[prefs.placeType] || prefs.placeType}`);
  }
  
  if (prefs.dayPace) {
    const paceMap: Record<string, string> = {
      relaxed: "prefers a RELAXED pace - plan only 3-4 activities with long breaks, late starts, and extended meal times",
      balanced: "likes a BALANCED mix - plan 5-6 activities with reasonable breaks between each",
      packed: "wants a PACKED schedule - plan 7-8 activities to maximize the day, shorter breaks",
    };
    parts.push(`Day pace: ${paceMap[prefs.dayPace] || prefs.dayPace}`);
  }
  
  if (prefs.spendingPriority) {
    const spendMap: Record<string, string> = {
      food: "prioritizes food experiences - include excellent restaurants, food tours, local specialties, and culinary highlights",
      experiences: "values unique experiences - focus on tours, activities, and memorable excursions over dining",
      comfort: "values comfort - suggest quality venues, comfortable transport options, and premium experiences",
      souvenirs: "enjoys shopping and souvenirs - include markets, artisan shops, and local shopping areas",
    };
    parts.push(`Spending priority: ${spendMap[prefs.spendingPriority] || prefs.spendingPriority}`);
  }
  
  if (prefs.travelersType) {
    const travelersMap: Record<string, string> = {
      solo: "traveling solo - suggest safe, social-friendly activities",
      couple: "traveling as a couple - include romantic spots and couple-friendly experiences",
      "family-young": "traveling with young kids - ALL activities must be kid-friendly with age-appropriate options",
      "family-teens": "traveling with teenagers - include activities that appeal to teens",
      friends: "traveling with friends - suggest group-friendly and social activities",
      multigenerational: "multigenerational family trip - balance activities for all age groups",
    };
    parts.push(`Traveler type: ${travelersMap[prefs.travelersType] || prefs.travelersType}`);
  }
  
  if (prefs.kidsAges && prefs.kidsAges.length > 0) {
    const ageGroups = prefs.kidsAges.map(age => {
      if (age === "0-2") return "infant/toddler (0-2 years) - need stroller-friendly venues, nap time consideration";
      if (age === "3-5") return "preschooler (3-5 years) - short attention spans, need playgrounds and interactive activities";
      if (age === "6-9") return "elementary age (6-9 years) - can handle longer activities, enjoy hands-on experiences";
      if (age === "10-12") return "preteen (10-12 years) - interested in more complex activities and some independence";
      if (age === "13-17") return "teenager (13-17 years) - want cool experiences, may prefer more freedom";
      return age;
    });
    parts.push(`Children traveling: ${ageGroups.join("; ")} - CRITICAL: Every activity must accommodate these age groups`);
  }
  
  if (prefs.mustHave) {
    parts.push(`MUST-HAVE experience (prioritize this): ${prefs.mustHave}`);
  }
  
  if (prefs.accommodationType) {
    parts.push(`Accommodation preference: ${prefs.accommodationType}`);
  }
  
  return parts.length > 0 
    ? `TRAVELER PREFERENCES (you MUST incorporate ALL of these into your plan):\n- ${parts.join("\n- ")}` 
    : "No specific preferences provided.";
}
