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
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  acceptedTermsAt: timestamp("accepted_terms_at"),
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

// Trip table - main entity
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
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
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Registration schema with password confirmation and terms acceptance
export const registerUserSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
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
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

// Public user type (without password)
export type PublicUser = Omit<User, 'password'>;

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
