/**
 * Prompt builder for full itinerary plan (day-by-day planning)
 */

import { buildPreferencesContext, type QuizPreferences } from "../utils/preferences-context";
import type { ItineraryRecommendation } from "@shared/schema";

export interface FullItineraryPlanPromptParams {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

export interface FullItineraryPlanRequest {
  itinerary: ItineraryRecommendation;
  numberOfTravelers: number;
  tripType: "international" | "domestic" | "staycation";
  tripPersonality?: {
    pace: "slow" | "moderate" | "fast";
    expenseLevel?: "budget" | "balanced" | "premium";
    energyTone?: "calm" | "playful" | "adventurous";
  };
  departureLocation?: string;
  quizPreferences: QuizPreferences;
}

/**
 * Builds prompts for full itinerary plan generation
 * 
 * @param request - Full itinerary plan request
 * @returns Object containing system prompt, user prompt, and max tokens
 */
export function buildFullItineraryPlanPrompt(
  request: FullItineraryPlanRequest
): FullItineraryPlanPromptParams {
  const preferencesContext = buildPreferencesContext(request.quizPreferences);
  
  // Build pace-specific instructions
  const pace = request.tripPersonality?.pace || "moderate";
  let paceInstructions = "";
  
  switch (pace) {
    case "slow":
      paceInstructions = `
PACE SETTING: SLOW (Relaxed & Leisurely)
- Maximum 2-3 activities per day (not counting meals)
- Activity durations: 2-3 hours each (spend quality time at each place)
- Travel buffer between activities: 45-60 minutes (never rush)
- Include extended rest periods (2+ hours in afternoon)
- Day typically starts at 9:30-10:00 AM, ends by 8:00 PM
- Schedule plenty of "free time to explore at your own pace"
- Focus on depth over breadth - spend more time at fewer places
- Include spa visits, park relaxation, cafe time, or scenic strolls`;
      break;
    case "fast":
      paceInstructions = `
PACE SETTING: FAST (Energetic & Packed)
- Plan 5-6 activities per day (not counting meals)
- Activity durations: 45 min - 1.5 hours (efficient but meaningful)
- Travel buffer between activities: 15-30 minutes (quick transitions)
- Day starts early at 7:30-8:00 AM, can extend to 10:00 PM
- Brief rest breaks only (30-45 min max)
- Minimize downtime - keep the momentum going
- Include iconic highlights AND hidden gems
- Walking tours, multiple neighborhoods, and back-to-back experiences`;
      break;
    case "moderate":
    default:
      paceInstructions = `
PACE SETTING: MODERATE (Balanced)
- Plan 3-4 activities per day (not counting meals)
- Activity durations: 1.5-2 hours each (comfortable exploration)
- Travel buffer between activities: 30-45 minutes (reasonable transitions)
- Day starts at 9:00 AM, ends around 9:00 PM
- Include 1-2 hour rest/downtime periods
- Balance must-see attractions with relaxation
- Morning energy, afternoon ease, evening enjoyment`;
      break;
  }
  
  const citiesOverview = request.itinerary.cities.map(city => 
    `${city.cityName}, ${city.countryName} (${city.stayLengthNights} nights)`
  ).join(" -> ");
  
  // Build origin travel context for Day 1
  const departureLocation = request.departureLocation || "";
  const firstCity = request.itinerary.cities[0];
  const originTravelContext = departureLocation && firstCity 
    ? `\nINITIAL TRAVEL: Day 1 starts with travel from ${departureLocation} to ${firstCity.cityName}, ${firstCity.countryName}. Include a "Travel: Depart from ${departureLocation}" activity with appropriate travel mode (flight for international/long distances, drive for nearby destinations).`
    : "";

  let currentDay = 1;
  const dayStructure: { dayNumber: number; city: typeof request.itinerary.cities[0]; dayInCity: number; totalDaysInCity: number; isArrival: boolean; isDeparture: boolean }[] = [];
  
  for (let i = 0; i < request.itinerary.cities.length; i++) {
    const city = request.itinerary.cities[i];
    for (let d = 0; d < city.stayLengthNights; d++) {
      dayStructure.push({
        dayNumber: currentDay,
        city,
        dayInCity: d + 1,
        totalDaysInCity: city.stayLengthNights,
        isArrival: d === 0,
        isDeparture: d === city.stayLengthNights - 1 && i < request.itinerary.cities.length - 1,
      });
      currentDay++;
    }
  }

  // Build accessibility and family context
  const kidsAges = request.quizPreferences?.kidsAges || [];
  const hasYoungKids = kidsAges.some(age => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum <= 5;
  });
  const hasToddlers = kidsAges.some(age => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum <= 3;
  });
  const hasTweens = kidsAges.some(age => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 8 && ageNum <= 12;
  });
  
  let familyContext = "";
  if (kidsAges.length > 0) {
    familyContext = `\nFAMILY CONSIDERATIONS:
- Traveling with children ages: ${kidsAges.join(", ")}`;
    if (hasToddlers) {
      familyContext += `
- TODDLERS PRESENT: Schedule nap times (early afternoon), include stroller-friendly routes, plan for shorter activity windows (1-2 hours max), include playground/park breaks`;
    }
    if (hasYoungKids) {
      familyContext += `
- YOUNG KIDS PRESENT: Include kid-friendly attractions, plan for snack/bathroom breaks every 2 hours, avoid long walking distances, include interactive/hands-on activities`;
    }
    if (hasTweens) {
      familyContext += `
- TWEENS PRESENT: Include age-appropriate attractions, consider their interests (technology, adventure, etc.), balance educational and fun activities`;
    }
  }

  const systemPrompt = `Travel planner creating day-by-day itinerary. Route: ${citiesOverview}. ${request.numberOfTravelers} travelers. ${preferencesContext}${familyContext}
${paceInstructions}${originTravelContext}

RULES:
- No emojis. Follow pace setting above.
- Times: "9:00 AM - 11:00 AM" format. No overlapping times.
- Include travel between locations (walk/taxi/bus/train/flight).
- Include travel between locations (walk/taxi/bus/train/flight).
- Day 1 MUST start with travel from origin (if provided) - include flight/drive time.
- ARRIVAL days: "Arrival: Check into hotel" then light evening activities.
- DEPARTURE days: Morning only, then "Travel: Depart to [city] via [mode]".

Return JSON:
{"dayPlans":[{"dayNumber":1,"dayTitle":"Short Theme","cityName":"City","countryName":"Country","isArrivalDay":false,"isDepartureDay":false,"dailyCostEstimate":100,"structuredActivities":[{"id":"day1-act1","startTime":"9:00 AM","endTime":"11:00 AM","title":"Activity Name","description":"Brief description","location":"Area","costEstimate":25,"externalLink":"https://...","isTravel":false,"alternates":[{"id":"day1-alt1","title":"Alternative","description":"Brief","costEstimate":20}]},{"id":"day1-travel1","startTime":"11:00 AM","endTime":"11:30 AM","title":"Travel to Next","isTravel":true,"travelMode":"walk","costEstimate":0}],"activities":["9:00 AM - 11:00 AM: Activity Name"]}]}

FIELDS: id (dayX-actY), startTime/endTime (H:MM AM/PM), title, description (1 sentence), location, costEstimate (USD), externalLink (official URL if known), isTravel, travelMode (walk/taxi/bus/train/ferry), alternates (1 nearby option for main activities only).`;

  const daysDescription = dayStructure.map((d, idx) => {
    let dayDesc = `Day ${d.dayNumber}: ${d.city.cityName}, ${d.city.countryName} (Day ${d.dayInCity}/${d.totalDaysInCity}`;
    if (d.isArrival) dayDesc += ", ARRIVAL";
    if (d.isDeparture) {
      const nextCity = dayStructure[idx + 1]?.city;
      if (nextCity) {
        dayDesc += `, TRAVEL DAY - departing to ${nextCity.cityName}, ${nextCity.countryName}`;
      } else {
        dayDesc += ", DEPARTURE";
      }
    }
    dayDesc += ")";
    return dayDesc;
  }).join("\n");

  const userPrompt = `Plan ${request.itinerary.totalNights}-night trip:\n${daysDescription}\nInclude times, travel, meals. Be concise.`;

  // Calculate max_tokens based on trip length
  const uniqueDayNumbers = new Set(dayStructure.map(d => d.dayNumber));
  const confirmedDays = uniqueDayNumbers.size;
  const totalNights = request.itinerary.totalNights;
  const expectedDays = (typeof totalNights === 'number' && totalNights > 0) 
    ? totalNights + 1  // N nights means N+1 days
    : 8;
  const numberOfDays = Math.max(confirmedDays, expectedDays, 1);
  const estimatedTokensPerDay = 1200;
  const baseTokens = 2000;
  const calculatedTokens = baseTokens + (numberOfDays * estimatedTokensPerDay);
  const maxTokens = Number.isFinite(calculatedTokens) 
    ? Math.min(16000, Math.max(8000, calculatedTokens)) 
    : 10000;

  return { systemPrompt, userPrompt, maxTokens };
}
