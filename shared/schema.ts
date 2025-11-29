import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  acceptedTermsAt: timestamp("accepted_terms_at"),
  emailVerified: boolean("email_verified").default(false),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table for express-session
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip table - main entity
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Trip title
  title: text("title"), // Creative name like "The Mediterranean Dream"
  
  // Step 1: Dream - Know the Basics
  travelers: text("travelers").notNull(), // "Just me" or "Me plus family/friends"
  numberOfTravelers: integer("number_of_travelers").notNull().default(1),
  travelSeason: text("travel_season").notNull(), // "Summer", "Winter Break", etc.
  tripDuration: integer("trip_duration").notNull(), // in days
  
  // Trip dates and departure info
  startDate: text("start_date"), // ISO date string YYYY-MM-DD
  endDate: text("end_date"), // ISO date string YYYY-MM-DD
  departureCity: text("departure_city"), // User's home city they're departing from
  departureCountry: text("departure_country"), // Country of departure (typically user's home country)
  departureAirport: text("departure_airport"), // IATA airport code like "SFO"
  
  // Step 2: Save & Book - Savings Account
  savingsAccountLinked: boolean("savings_account_linked").default(false),
  savingsAccountId: text("savings_account_id"), // Plaid account ID (stub)
  savingsAmountManual: boolean("savings_amount_manual").default(false), // true if amount was entered manually
  
  // Step 2: Save & Book - Budget
  monthlySavingsAmount: decimal("monthly_savings_amount", { precision: 10, scale: 2 }).default("0"),
  currentSavings: decimal("current_savings", { precision: 10, scale: 2 }).default("0"),
  creditCardPoints: integer("credit_card_points").default(0),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transport segment type for travel between destinations
export const transportSegmentSchema = z.object({
  mode: z.string(), // "flight", "train", "bus", "car", "ferry"
  durationMinutes: z.number().optional(),
  estimatedCost: z.number().optional(),
  notes: z.string().optional(),
});

export type TransportSegment = z.infer<typeof transportSegmentSchema>;

// Destinations for a trip (cities to visit)
export const destinations = pgTable("destinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  cityName: text("city_name").notNull(),
  countryName: text("country_name").notNull(),
  numberOfNights: integer("number_of_nights").notNull().default(3),
  imageUrl: text("image_url"),
  order: integer("order").notNull().default(0), // for ordering destinations in trip
  
  // Arrival and departure dates for this destination
  arrivalDate: text("arrival_date"), // ISO date string YYYY-MM-DD
  departureDate: text("departure_date"), // ISO date string YYYY-MM-DD
  
  // Airport information
  arrivalAirport: text("arrival_airport"), // IATA code like "CDG"
  departureAirport: text("departure_airport"), // IATA code - may differ for open-jaw tickets
  
  // AI-recommended activities for this destination
  activities: jsonb("activities").$type<string[]>().default([]),
  
  // Transport to next destination (null for last destination)
  transportToNext: jsonb("transport_to_next").$type<TransportSegment>(),
});

// Budget categories and items
export const budgetCategories = pgTable("budget_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "flights", "housing", "food", "transportation", "fun", "preparation"
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  usePoints: boolean("use_points").default(false), // for flights: use points or cash
});

// Booking items (Step 3: Do)
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "flights", "housing", "transportation", "fun", "preparation"
  itemName: text("item_name").notNull(),
  status: text("status").notNull().default("not_started"), // "not_started", "in_progress", "booked"
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }).notNull(),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  bookingDetails: text("booking_details"),
  bookedAt: timestamp("booked_at"),
  order: integer("order").notNull().default(0),
});

// Trip memories for photo sharing (Go stage)
export const tripMemories = pgTable("trip_memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  sharedBy: varchar("shared_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Password validation with complexity requirements
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Registration schema with password confirmation and terms acceptance
export const registerUserSchema = insertUserSchema.extend({
  password: passwordSchema,
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zipCode: z.string().optional().default(""),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Resend verification email schema
export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  userId: true, // userId is added from authenticated session
  createdAt: true,
  updatedAt: true,
});

// Destination insert schema with proper jsonb type refinements
export const insertDestinationSchema = createInsertSchema(destinations, {
  activities: () => z.array(z.string()).optional(),
  transportToNext: () => transportSegmentSchema.optional().nullable(),
}).omit({
  id: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookedAt: true,
});

export const insertTripMemorySchema = createInsertSchema(tripMemories).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type ResendVerification = z.infer<typeof resendVerificationSchema>;

// Public user type (without password and sensitive security fields)
export type PublicUser = Omit<User, 'password' | 'failedLoginAttempts' | 'lockedUntil'>;

// Token types
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinations.$inferSelect;

export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertTripMemory = z.infer<typeof insertTripMemorySchema>;
export type TripMemory = typeof tripMemories.$inferSelect;

// Complete trip data type (trip with all related data)
export type TripWithDetails = Trip & {
  destinations: Destination[];
  budgetCategories: BudgetCategory[];
  bookings: Booking[];
};

// Trip summary for list views (trip with destination names only)
export type TripWithDestinations = Trip & {
  destinations: Pick<Destination, 'id' | 'cityName' | 'countryName' | 'numberOfNights' | 'order' | 'arrivalDate' | 'departureDate' | 'arrivalAirport' | 'departureAirport' | 'activities' | 'transportToNext'>[];
};

// Quiz schemas for destination recommendations
// Note: Quiz responses are intentionally ephemeral (not persisted to database)
// They are only used to generate AI destination recommendations via the API
// If future analytics or historical tracking is needed, a database table can be added
export const quizResponseSchema = z.object({
  tripGoal: z.enum(["rest", "culture", "thrill", "magic"]),
  placeType: z.enum(["ocean", "mountains", "ancientCities", "modernSkyline"]),
  temperature: z.enum(["warm", "cool", "flexible"]),
  dayPace: z.enum(["relaxed", "balanced", "packed"]),
  spendingPriority: z.enum(["food", "experiences", "comfort", "souvenirs"]),
  desiredEmotion: z.enum(["wonder", "freedom", "connection", "awe"]),
  region: z.enum(["europe", "asia", "southAmerica", "tropicalIslands", "surprise"]),
  favoriteMovie: z.string().min(1, "Please enter a movie").max(200),
  favoriteBook: z.string().min(1, "Please enter a book").max(200),
  dreamMoment: z.string().min(1, "Please describe your dream moment").max(500),
  numberOfTravelers: z.number().int().min(1).max(50),
  tripLengthPreference: z.enum(["1-3 days", "4-7 days", "1-2 weeks", "2-3 weeks", "3+ weeks", "flexible"]),
});

// Extended quiz schema with trip type support for Getting Started flow
export const extendedQuizResponseSchema = z.object({
  // Trip type determines which AI prompt and constraints to use
  tripType: z.enum(["international", "domestic", "staycation"]),
  
  // Core traveler info
  numberOfTravelers: z.number().int().min(1).max(50),
  adults: z.number().int().min(1).max(20).default(2),
  kids: z.number().int().min(0).max(20).default(0),
  childAges: z.array(z.number().int().min(0).max(17)).optional(),
  
  // Staycation-specific fields (required when tripType === "staycation")
  timeAvailable: z.enum(["afternoon", "full-day", "weekend"]).optional(),
  travelDistance: z.enum(["home", "2-3hrs"]).optional(),
  staycationGoal: z.array(z.string()).optional(),
  staycationBudget: z.enum(["0-100", "150-300", "400-700", "700+"]).optional(),
  departureLocation: z.string().optional(), // User's home city/ZIP for local recommendations
  
  // Domestic-specific fields
  usRegion: z.string().optional(),
  tripLength: z.string().optional(),
  
  // International-specific fields  
  internationalRegion: z.string().optional(),
  
  // Common fields mapped from legacy quiz
  tripGoal: z.enum(["rest", "culture", "thrill", "magic"]).optional(),
  placeType: z.enum(["ocean", "mountains", "ancientCities", "modernSkyline"]).optional(),
  dayPace: z.enum(["relaxed", "balanced", "packed"]).optional(),
  spendingPriority: z.enum(["food", "experiences", "comfort", "souvenirs"]).optional(),
  postcardImage: z.string().optional(),
  favoriteMedia: z.string().optional(),
  kidActivities: z.array(z.string()).optional(),
  accessibilityNeeds: z.array(z.string()).optional(),
});

export type ExtendedQuizResponse = z.infer<typeof extendedQuizResponseSchema>;

// Staycation recommendation schema (single destination, no flights)
export const staycationDestinationSchema = z.object({
  name: z.string(), // e.g., "Muir Woods National Monument"
  type: z.string(), // e.g., "nature", "museum", "beach", "town"
  distance: z.string(), // e.g., "45 minutes from San Francisco"
  driveTime: z.number().int().min(10).max(180), // Minutes
  address: z.string().optional(),
  description: z.string(),
  activities: z.array(z.string()).min(1),
  bestFor: z.array(z.string()), // e.g., ["families", "couples", "adventure seekers"]
  imageQuery: z.string(),
});

export const staycationCostBreakdownSchema = z.object({
  gas: z.number(), // Estimated fuel cost
  food: z.number(), // Meals and snacks
  activities: z.number(), // Entry fees, rentals, etc.
  parking: z.number(), // Parking fees
  misc: z.number(), // Tips, souvenirs, etc.
});

export const staycationRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(), // Creative name like "Coastal Escape" or "Mountain Day Trip"
  vibeTagline: z.string(),
  isCurveball: z.boolean().default(false),
  tripDuration: z.enum(["afternoon", "full-day", "weekend"]),
  totalCost: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default("USD"),
  }),
  costBreakdown: staycationCostBreakdownSchema,
  destination: staycationDestinationSchema,
  suggestedItinerary: z.array(z.object({
    time: z.string(), // e.g., "9:00 AM"
    activity: z.string(),
    duration: z.string(), // e.g., "2 hours"
    tips: z.string().optional(),
  })),
  packingList: z.array(z.string()).optional(),
  bestTimeToVisit: z.string(),
  familyFriendlyRating: z.number().int().min(1).max(5).optional(),
});

export const staycationRecommendationsResponseSchema = z.object({
  recommendations: z.array(staycationRecommendationSchema).length(3),
});

export type StaycationDestination = z.infer<typeof staycationDestinationSchema>;
export type StaycationCostBreakdown = z.infer<typeof staycationCostBreakdownSchema>;
export type StaycationRecommendation = z.infer<typeof staycationRecommendationSchema>;
export type StaycationRecommendationsResponse = z.infer<typeof staycationRecommendationsResponseSchema>;

// Multi-city itinerary schemas for AI recommendations
export const itineraryCitySegmentSchema = z.object({
  order: z.number().int().min(1),
  cityName: z.string(),
  countryName: z.string(),
  arrivalAirport: z.string().optional(), // IATA code like "CDG" for Paris
  departureAirport: z.string().optional(), // IATA code - may differ for open-jaw tickets
  stayLengthNights: z.number().int().min(1),
  activities: z.array(z.string()).min(1), // Array of activity descriptions
  imageQuery: z.string(), // Used to fetch stock images for this city
});

export const costBreakdownSchema = z.object({
  flights: z.number(),
  housing: z.number(),
  food: z.number(),
  transportation: z.number(),
  fun: z.number(),
  preparation: z.number(),
});

export const itineraryRecommendationSchema = z.object({
  id: z.string(), // Unique identifier for the itinerary
  title: z.string(), // Creative name like "The Mediterranean Dream" or "Island Hopper's Paradise"
  vibeTagline: z.string(), // Short description of the itinerary's vibe
  isCurveball: z.boolean().default(false),
  totalCost: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default("USD"),
  }),
  costBreakdown: costBreakdownSchema, // Average per category for the entire trip
  cities: z.array(itineraryCitySegmentSchema).min(2), // At least 2 cities for a multi-city itinerary
  bestTimeToVisit: z.string(),
  totalNights: z.number().int().min(1), // Total nights across all cities
});

export const itineraryRecommendationsResponseSchema = z.object({
  recommendations: z.array(itineraryRecommendationSchema).length(3),
});

export type QuizResponse = z.infer<typeof quizResponseSchema>;
export type ItineraryCitySegment = z.infer<typeof itineraryCitySegmentSchema>;
export type CostBreakdown = z.infer<typeof costBreakdownSchema>;
export type ItineraryRecommendation = z.infer<typeof itineraryRecommendationSchema>;
export type ItineraryRecommendationsResponse = z.infer<typeof itineraryRecommendationsResponseSchema>;

// Legacy type for backward compatibility
export type DestinationRecommendation = ItineraryRecommendation;

// Itinerary refinement schemas
export const adjustItineraryDurationRequestSchema = z.object({
  itinerary: itineraryRecommendationSchema,
  newTotalNights: z.number().int().min(2).max(50),
  numberOfTravelers: z.number().int().min(1).max(50),
  allowCityRemoval: z.boolean().default(true), // Allow AI to remove cities if duration is reduced
  maxCities: z.number().int().optional(), // Optional constraint on maximum cities
});

export const itineraryAddonSchema = z.object({
  id: z.string(),
  title: z.string(), // e.g., "Add 2 More Days"
  description: z.string(), // e.g., "Extend your adventure with 2 additional days exploring..."
  deltaNights: z.number().int().min(1), // Additional nights to add
  deltaCost: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default("USD"),
  }),
  suggestedAddition: z.string(), // What cities/activities would be added
});

export const itineraryAddonsRequestSchema = z.object({
  itinerary: itineraryRecommendationSchema,
  numberOfTravelers: z.number().int().min(1).max(50),
});

export const itineraryAddonsResponseSchema = z.object({
  addons: z.array(itineraryAddonSchema).min(2).max(3), // 2-3 add-on options
});

export const applyAddonRequestSchema = z.object({
  itinerary: itineraryRecommendationSchema,
  addon: itineraryAddonSchema,
  numberOfTravelers: z.number().int().min(1).max(50),
});

export const applyAddonResponseSchema = z.object({
  updatedItinerary: itineraryRecommendationSchema,
});

export type AdjustItineraryDurationRequest = z.infer<typeof adjustItineraryDurationRequestSchema>;
export type ItineraryAddon = z.infer<typeof itineraryAddonSchema>;
export type ItineraryAddonsRequest = z.infer<typeof itineraryAddonsRequestSchema>;
export type ItineraryAddonsResponse = z.infer<typeof itineraryAddonsResponseSchema>;
export type ApplyAddonRequest = z.infer<typeof applyAddonRequestSchema>;
export type ApplyAddonResponse = z.infer<typeof applyAddonResponseSchema>;
