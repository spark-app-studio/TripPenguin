import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Trip table - main entity
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  
  // Step 1: Dream - Know the Basics
  travelers: text("travelers").notNull(), // "Just me" or "Me plus family/friends"
  numberOfTravelers: integer("number_of_travelers").notNull().default(1),
  travelSeason: text("travel_season").notNull(), // "Summer", "Winter Break", etc.
  tripDuration: integer("trip_duration").notNull(), // in days
  
  // Step 2: Plan - Budget
  monthlySavingsAmount: decimal("monthly_savings_amount", { precision: 10, scale: 2 }).default("0"),
  currentSavings: decimal("current_savings", { precision: 10, scale: 2 }).default("0"),
  creditCardPoints: integer("credit_card_points").default(0),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Destinations for a trip (cities to visit)
export const destinations = pgTable("destinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  cityName: text("city_name").notNull(),
  countryName: text("country_name").notNull(),
  numberOfNights: integer("number_of_nights").notNull().default(3),
  imageUrl: text("image_url"),
  order: integer("order").notNull().default(0), // for ordering destinations in trip
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

// Insert schemas
export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDestinationSchema = createInsertSchema(destinations).omit({
  id: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookedAt: true,
});

// Types
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinations.$inferSelect;

export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Complete trip data type (trip with all related data)
export type TripWithDetails = Trip & {
  destinations: Destination[];
  budgetCategories: BudgetCategory[];
  bookings: Booking[];
};
