/**
 * Prompt builder for staycation recommendations
 * Staycations are local getaways within driving distance (max 2-3 hours)
 */

import type { ExtendedQuizResponse } from "@shared/schema";
import { sanitizeInput } from "../utils/sanitization";

export interface StaycationPromptParams {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Builds prompts for staycation recommendations
 * 
 * @param quiz - Extended quiz response with staycation preferences
 * @returns Object containing system and user prompts
 */
export function buildStaycationPrompt(
  quiz: ExtendedQuizResponse
): StaycationPromptParams {
  const departureLocation = sanitizeInput(quiz.departureLocation || "");
  if (!departureLocation) {
    throw new Error("Departure location is required for staycation recommendations");
  }
  
  const numberOfTravelers = quiz.numberOfTravelers;
  const adults = quiz.adults || 2;
  const kids = quiz.kids || 0;
  const childAges = quiz.childAges || [];
  
  // Map time available to duration description
  const durationMap: Record<string, string> = {
    "afternoon": "a few hours (3-5 hours)",
    "full-day": "a full day trip (8-10 hours)",
    "weekend": "a weekend getaway (1-2 nights)",
  };
  const tripDuration = quiz.timeAvailable || "full-day";
  const durationDescription = durationMap[tripDuration] || "a full day trip";
  
  // Map travel distance to max drive time - enforce maximum of 3 hours
  const distanceMap: Record<string, number> = {
    "home": 60, // Staying in general area = ~1 hour max
    "2-3hrs": 180, // Within 2-3 hours
  };
  // Cap at 180 minutes (3 hours) maximum
  const maxDriveMinutes = Math.min(distanceMap[quiz.travelDistance || "2-3hrs"] || 120, 180);
  const maxDriveHours = Math.round(maxDriveMinutes / 60 * 10) / 10;
  
  // Map budget preference
  const budgetMap: Record<string, string> = {
    "0-100": "very low cost ($0-100 total for the whole group)",
    "150-300": "moderate spending ($150-300 total for the whole group)",
    "400-700": "comfortable budget ($400-700 total for the whole group)",
    "700+": "treat yourself, premium experiences ($700+ for the whole group)",
  };
  const budgetDescription = budgetMap[quiz.staycationBudget || "150-300"] || "moderate spending";
  
  // Build detailed goals description from quiz answers
  const goals = quiz.staycationGoal || [];
  const goalDescriptions: Record<string, string> = {
    "outdoor-adventure": "outdoor activities, hiking, nature exploration, and physical adventures",
    "relax-unwind": "relaxation, unwinding, spa experiences, and peaceful settings",
    "explore-new": "exploring new places, discovering local gems, and unique experiences",
    "quality-time": "quality family time, bonding activities, and shared experiences",
    "learn-discover": "educational experiences, museums, historical sites, and learning opportunities",
    "food-dining": "culinary experiences, local restaurants, food tours, and dining adventures",
    "entertainment": "entertainment, shows, events, amusement parks, and fun activities",
    "photography": "scenic views, photography opportunities, and picture-perfect locations",
  };
  const detailedGoals = goals.map(g => goalDescriptions[g] || g).join("; ");
  const goalsDescription = detailedGoals || "relaxation and quality time";

  // Build family context with kid-specific activities if applicable
  let familyContext = `${adults} adult(s)`;
  const kidActivities = quiz.kidActivities || [];
  if (kids > 0) {
    familyContext += ` and ${kids} kid(s)`;
    if (childAges.length > 0) {
      familyContext += ` (ages: ${childAges.join(", ")})`;
    }
    if (kidActivities.length > 0) {
      familyContext += `. Kids are interested in: ${kidActivities.join(", ")}`;
    }
  }

  // Accessibility needs - detailed requirements
  const accessibilityNeeds = quiz.accessibilityNeeds || [];
  const accessibilityDescriptions: Record<string, string> = {
    "wheelchair": "wheelchair accessible paths and facilities",
    "stroller": "stroller-friendly terrain and amenities",
    "limited-mobility": "limited walking distances and easy access",
    "sensory": "sensory-friendly environments (quiet spaces, reduced stimulation)",
    "none": "",
  };
  const accessibilityText = accessibilityNeeds.length > 0 && !accessibilityNeeds.includes("none")
    ? `IMPORTANT ACCESSIBILITY REQUIREMENTS: ${accessibilityNeeds.map(n => accessibilityDescriptions[n] || n).join("; ")}. All recommended destinations must accommodate these needs.`
    : "";

  const systemPrompt = `You are a local travel expert specializing in staycations, day trips, and weekend getaways near ${departureLocation}. You have deep knowledge of the area within a 2-3 hour driving radius and help families discover amazing destinations. You focus on practical, real destinations that exist and can be visited.

ABSOLUTE REQUIREMENTS - MUST BE FOLLOWED:
1. ALL destinations MUST be within ${maxDriveMinutes} minutes (${maxDriveHours} hours) ACTUAL driving time from ${departureLocation}
2. You must know the real driving distance from ${departureLocation} to each destination you recommend
3. Destinations must be REAL, SPECIFIC places that actually exist (parks, towns, beaches, museums, state parks, etc.)
4. NO FLIGHTS - these are driving trips only
5. The driveTime field must be the ACCURATE driving time in minutes from ${departureLocation}
6. Distance field must include the ACTUAL city/town and driving time (e.g., "1 hour 15 minutes from ${departureLocation}")

If you're not certain a destination is within the driving distance, DO NOT recommend it.`;

  const userPrompt = `Create 3 staycation recommendations specifically tailored to this family's quiz answers:

===== DEPARTURE LOCATION =====
${departureLocation}
(All destinations MUST be within ${maxDriveMinutes} minutes / ${maxDriveHours} hours driving from here)

===== TRIP DETAILS =====
MAX DRIVE TIME: ${maxDriveMinutes} minutes (${maxDriveHours} hours) - DO NOT EXCEED THIS
TRIP DURATION: ${durationDescription}
BUDGET: ${budgetDescription}

===== TRAVELERS =====
${familyContext}

===== WHAT THEY'RE LOOKING FOR (from quiz) =====
${goalsDescription}

${accessibilityText}

Create exactly 3 staycation recommendations:

===== CRITICAL DISTANCE VALIDATION =====
Before including ANY destination, verify:
1. Is this destination ACTUALLY within ${maxDriveMinutes} minutes (${maxDriveHours} hours) driving from ${departureLocation}?
2. Do you know the REAL driving time from ${departureLocation} to this destination?
3. If uncertain about the distance, DO NOT include this destination.

===== RECOMMENDATION REQUIREMENTS =====
Each recommendation MUST directly address the quiz answers above:
- Recommendation 1: Perfect match for their stated goals (${goalsDescription}) and family composition (${familyContext})
- Recommendation 2: Another great option with a different vibe, still matching their preferences
- Recommendation 3: "Hidden gem" - a lesser-known local discovery that still fits their criteria

For each recommendation, provide:
1. id: unique identifier (e.g., "staycation-1")
2. title: Creative, fun name reflecting their goals (e.g., "Coastal Escape", "Mountain Day Trip")
3. vibeTagline: Short 1-sentence description (max 100 chars) that speaks to what they're looking for
4. isCurveball: true only for recommendation 3
5. tripDuration: MUST match "${tripDuration}" unless they said flexible
6. totalCost: Estimated cost range for ALL ${numberOfTravelers} traveler(s), respecting their ${budgetDescription} budget
   - min: Budget-conscious estimate
   - max: More comfortable estimate
   - currency: "USD"
7. costBreakdown: Costs for the entire trip (in USD for ALL travelers):
   - gas: Fuel for round trip based on ACTUAL distance from ${departureLocation}
   - food: Meals and snacks
   - activities: Entry fees, rentals, tours
   - parking: Parking fees
   - misc: Tips, souvenirs
8. destination: Object with:
   - name: REAL, specific place name that EXISTS (state parks, beaches, towns, museums, etc.)
   - type: Category matching their interests (e.g., "nature", "beach", "museum", "town", "park")
   - distance: "X hours Y minutes from ${departureLocation}" - MUST BE ACCURATE
   - driveTime: ACCURATE number of minutes to drive from ${departureLocation} - MUST NOT EXCEED ${maxDriveMinutes}
   - address: Actual location or address
   - description: 2-3 sentence description explaining why this matches their quiz answers
   - activities: Array of 3-5 specific things to do that match their stated goals
   - bestFor: Array reflecting their family composition (include "families with kids" if they have kids)
   - imageQuery: Search query for destination images
9. suggestedItinerary: Array of time-blocked activities matching the ${tripDuration} duration:
   - time: Start time (e.g., "9:00 AM")
   - activity: Specific activity matching their interests
   - duration: How long
   - tips: Helpful tip, especially for families with kids if applicable
10. packingList: Array of 5-8 items appropriate for this destination and their activities
11. bestTimeToVisit: Best season/time for this destination
12. familyFriendlyRating: 1-5 rating (if they have kids, recommend destinations with rating 4-5)

Format response as valid JSON:
{
  "recommendations": [
    {
      "id": "staycation-1",
      "title": "Coastal Escape",
      "vibeTagline": "Stunning cliffs, tide pools, and fresh sea air",
      "isCurveball": false,
      "tripDuration": "full-day",
      "totalCost": {
        "min": 80,
        "max": 150,
        "currency": "USD"
      },
      "costBreakdown": {
        "gas": 25,
        "food": 60,
        "activities": 40,
        "parking": 15,
        "misc": 10
      },
      "destination": {
        "name": "Point Reyes National Seashore",
        "type": "nature",
        "distance": "1 hour 15 minutes from San Francisco, CA",
        "driveTime": 75,
        "address": "Point Reyes Station, CA",
        "description": "Dramatic coastal cliffs, lighthouse, and incredible wildlife viewing. Perfect for nature lovers seeking outdoor adventure.",
        "activities": ["Visit Point Reyes Lighthouse", "Explore tide pools at Sculptured Beach", "Hike Bear Valley Trail", "Spot elephant seals at Chimney Rock"],
        "bestFor": ["nature lovers", "families with kids", "photographers"],
        "imageQuery": "Point Reyes lighthouse California coast"
      },
      "suggestedItinerary": [
        {
          "time": "9:00 AM",
          "activity": "Drive to Point Reyes and stop at Bear Valley Visitor Center",
          "duration": "1.5 hours",
          "tips": "Pick up a trail map and check tide schedules for tide pooling"
        }
      ],
      "packingList": ["Sunscreen", "Layers for wind", "Binoculars", "Snacks", "Water", "Camera"],
      "bestTimeToVisit": "Spring and Fall for best weather and wildlife viewing",
      "familyFriendlyRating": 4
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}
