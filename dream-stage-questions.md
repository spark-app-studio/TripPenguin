# Dream Stage Questions

## Overview
The Dream stage is the first step in the trip planning wizard where users manually define their trip basics. This stage is skipped for quiz-based trips (users coming from the quiz refinement flow go directly to the Plan stage).

---

## Question 1: Who's going on this trip?

**Question Text:** "Who's going on this trip?"

**Description:** "Traveling solo or with company? This helps us estimate costs."

**Answer Options:**
- **Just me** (Radio button - value: `just_me`)
- **Me plus family or friends** (Radio button - value: `with_others`)
  - If selected, shows follow-up input:
    - **Total number of travelers** (Number input, min: 2, max: 10)

---

## Question 2: What time of year are you planning to travel?

**Question Text:** "What time of year are you planning to travel?"

**Description:** "Different seasons offer unique experiences and pricing"

**Answer Options:** (Radio buttons)
1. **Summer (June - August)** (value: `summer`)
   - Description: "Warm weather, peak season"

2. **Winter Break (December - January)** (value: `winter`)
   - Description: "Holidays, festive atmosphere"

3. **Thanksgiving (November)** (value: `thanksgiving`)
   - Description: "Week-long break"

4. **Spring Break (March - April)** (value: `spring`)
   - Description: "Mild weather, moderate crowds"

5. **Off-Season (School Year)** (value: `off_season`)
   - Description: "Fewer crowds, better deals"

---

## Question 3: How long will your trip be?

**Question Text:** "How long will your trip be?"

**Description:** "Recommended: At least 10 days for international trips"

**Answer Format:** Slider
- **Minimum:** 7 days (1 week)
- **Maximum:** 21 days (3 weeks)
- **Step:** 1 day
- **Display:** Shows selected number of days in large text

---

## Question 4: Your Destination

**Question Text:** "Your Destination"

**Description:** 
- Before selection: "Select one or more destinations. Aim for 3+ nights per city."
- After selection: "Adjust nights or add more destinations if you'd like"

**Available Destinations:** (Clickable cards with images)
1. Paris, France
2. London, United Kingdom
3. Rome, Italy
4. Amsterdam, Netherlands
5. Barcelona, Spain
6. Tokyo, Japan

**For Each Selected Destination:**
- Shows destination name and country
- Displays number of nights (default: 3 nights)
- **Nights slider:** 1-10 nights per destination
- **Remove button** to deselect destination

**Validation:**
- At least 1 destination must be selected to continue

---

## Continue Action

**Button Text:** "Continue to Planning"

**Enabled When:** At least one destination is selected

**Next Step:** Takes user to Step 2 (Plan stage) with budget planning

---

## Notes

- All Dream stage data is stored locally in the trip planner's state
- When user continues, data is saved to database as part of the trip record
- Quiz-based trips bypass this entire stage and start directly at the Plan stage with pre-populated data
