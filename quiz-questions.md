# Quiz Questions - "Find Your Adventure Type"

## Overview
A 12-question personality quiz that generates personalized multi-city itinerary recommendations. The quiz covers personality traits, cultural interests, dream moments, and practical trip planning details.

---

## Question 1: Trip Goal

**Question:** "What do you want MOST from this trip?"

**Type:** Multiple choice (single select)

**Options:**
- Rest + wake up slow
- Culture + history + learning
- Thrill + adventure + movement
- Magic + wonder + once-in-a-lifetime moments

**Data Key:** `tripGoal`

---

## Question 2: Place Type

**Question:** "Which place makes your heart jump?"

**Type:** Multiple choice (single select)

**Options:**
- Ocean + turquoise water
- Mountains + dramatic nature
- Ancient cities + old streets
- Modern skyline + neon nightlife

**Data Key:** `placeType`

---

## Question 3: Temperature Preference

**Question:** "What temperature do you prefer for this dream?"

**Type:** Multiple choice (single select)

**Options:**
- Warm + sunny
- Cool + crisp
- I'm flexible — depends on the experience

**Data Key:** `temperature`

---

## Question 4: Day Pace

**Question:** "How full do you want your days?"

**Type:** Multiple choice (single select)

**Options:**
- 70% chill / 30% planned
- 50/50 balance
- 30% chill / 70% planned

**Data Key:** `dayPace`

---

## Question 5: Spending Priority

**Question:** "What do you value most spending on?"

**Type:** Multiple choice (single select)

**Options:**
- Food + cafés + bakery moments
- Experiences + excursions
- Comfort + views
- Meaningful souvenirs + memory items

**Data Key:** `spendingPriority`

---

## Question 6: Desired Emotion

**Question:** "What's one emotion you want to feel on this trip that you don't feel enough right now?"

**Type:** Multiple choice (single select)

**Options:**
- Wonder
- Freedom
- Connection
- Awe

**Data Key:** `desiredEmotion`

---

## Question 7: Region Preference

**Question:** "What region calls to you most right now?"

**Type:** Multiple choice (single select)

**Options:**
- Europe
- Asia
- South America
- Tropical Islands
- Not sure — surprise me

**Data Key:** `region`

---

## Question 8: Favorite Movie

**Question:** "What's your favorite movie?"

**Type:** Text input

**Placeholder:** "e.g., The Lord of the Rings, Before Sunrise, The Darjeeling Limited"

**Character Limit:** 200 characters

**Data Key:** `favoriteMovie`

---

## Question 9: Favorite Book

**Question:** "What's your favorite book?"

**Type:** Text input

**Placeholder:** "e.g., Harry Potter, Eat Pray Love, Wild"

**Character Limit:** 200 characters

**Data Key:** `favoriteBook`

---

## Question 10: Dream Moment

**Question:** "Describe your dream moment"

**Description:** "Describe the dream moment you picture — even if it's just one sentence."

**Type:** Text area (multi-line)

**Placeholder:** "Picture yourself there... What are you doing? What do you see, hear, or feel?"

**Character Limit:** 500 characters (shows character counter)

**Data Key:** `dreamMoment`

---

## Question 11: Number of Travelers

**Question:** "How many travelers?"

**Description:** "This will help us plan your budget accurately."

**Type:** Multiple choice (single select)

**Options:**
- Just me (1)
- 2 travelers
- 3 travelers
- 4 travelers
- 5-6 travelers
- 7+ travelers

**Data Key:** `numberOfTravelers`

**Note:** This is stored as a number (1, 2, 3, 4, 5, or 7)

---

## Question 12: Trip Length Preference

**Question:** "Do you have a preference for how long the trip is?"

**Type:** Multiple choice (single select)

**Options:**
- 1-3 days (quick getaway)
- 4-7 days (one week)
- 1-2 weeks
- 2-3 weeks
- 3+ weeks (extended trip)
- I'm flexible

**Data Key:** `tripLengthPreference`

---

## Submit Action

**Button Text:** "Get My Recommendations"

**Next Step:** Takes user to quiz results page with 3 AI-generated multi-city itinerary recommendations

---

## Notes

- All answers are stored in sessionStorage under key `quizData`
- Progress bar shows completion (Question X of 12)
- Users can navigate back to previous questions to change answers
- All questions must be answered before user can proceed
- Text inputs require at least 1 character to proceed
- Quiz data is sent to AI (GPT-4o-mini) to generate personalized itineraries
