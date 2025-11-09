import {
  trips,
  destinations,
  budgetCategories,
  bookings,
  users,
  emailVerificationTokens,
  passwordResetTokens,
  type Trip,
  type InsertTrip,
  type Destination,
  type InsertDestination,
  type BudgetCategory,
  type InsertBudgetCategory,
  type Booking,
  type InsertBooking,
  type TripWithDetails,
  type User,
  type InsertUser,
  type EmailVerificationToken,
  type PasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  incrementFailedLoginAttempts(userId: string): Promise<void>;
  resetFailedLoginAttempts(userId: string): Promise<void>;
  lockAccount(userId: string, duration: number): Promise<void>;
  
  // Email verification operations
  createEmailVerificationToken(userId: string): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(token: string): Promise<void>;
  
  // Password reset operations
  createPasswordResetToken(userId: string): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  deletePasswordResetTokensByUser(userId: string): Promise<void>;
  
  // Trip operations
  getAllTrips(): Promise<Trip[]>;
  getTripsByUser(userId: string): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  getTrip(id: string): Promise<Trip | undefined>;
  getTripWithDetails(id: string): Promise<TripWithDetails | undefined>;
  updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: string): Promise<void>;
  
  // Destination operations
  createDestination(destination: InsertDestination): Promise<Destination>;
  getDestinationsByTrip(tripId: string): Promise<Destination[]>;
  updateDestination(id: string, destination: Partial<InsertDestination>): Promise<Destination | undefined>;
  deleteDestination(id: string): Promise<void>;
  
  // Budget category operations
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  getBudgetCategoriesByTrip(tripId: string): Promise<BudgetCategory[]>;
  updateBudgetCategory(id: string, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: string): Promise<void>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingsByTrip(tripId: string): Promise<Booking[]>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  // Trip operations
  async getAllTrips(): Promise<Trip[]> {
    return await db.select().from(trips);
  }

  async getTripsByUser(userId: string): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.userId, userId));
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db
      .insert(trips)
      .values(insertTrip)
      .returning();
    return trip;
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }

  async getTripWithDetails(id: string): Promise<TripWithDetails | undefined> {
    const trip = await this.getTrip(id);
    if (!trip) return undefined;

    const tripDestinations = await this.getDestinationsByTrip(id);
    const tripBudgetCategories = await this.getBudgetCategoriesByTrip(id);
    const tripBookings = await this.getBookingsByTrip(id);

    return {
      ...trip,
      destinations: tripDestinations,
      budgetCategories: tripBudgetCategories,
      bookings: tripBookings,
    };
  }

  async updateTrip(id: string, tripData: Partial<InsertTrip>): Promise<Trip | undefined> {
    const [updated] = await db
      .update(trips)
      .set({ ...tripData, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTrip(id: string): Promise<void> {
    await db.delete(trips).where(eq(trips.id, id));
  }

  // Destination operations
  async createDestination(insertDestination: InsertDestination): Promise<Destination> {
    const [destination] = await db
      .insert(destinations)
      .values(insertDestination)
      .returning();
    return destination;
  }

  async getDestinationsByTrip(tripId: string): Promise<Destination[]> {
    return await db.select().from(destinations).where(eq(destinations.tripId, tripId));
  }

  async updateDestination(id: string, destinationData: Partial<InsertDestination>): Promise<Destination | undefined> {
    const [updated] = await db
      .update(destinations)
      .set(destinationData)
      .where(eq(destinations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDestination(id: string): Promise<void> {
    await db.delete(destinations).where(eq(destinations.id, id));
  }

  // Budget category operations
  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const [category] = await db
      .insert(budgetCategories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getBudgetCategoriesByTrip(tripId: string): Promise<BudgetCategory[]> {
    return await db.select().from(budgetCategories).where(eq(budgetCategories.tripId, tripId));
  }

  async updateBudgetCategory(id: string, categoryData: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> {
    const [updated] = await db
      .update(budgetCategories)
      .set(categoryData)
      .where(eq(budgetCategories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBudgetCategory(id: string): Promise<void> {
    await db.delete(budgetCategories).where(eq(budgetCategories.id, id));
  }

  // Booking operations
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async getBookingsByTrip(tripId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.tripId, tripId));
  }

  async updateBooking(id: string, bookingData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set(bookingData)
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  // Account lockout operations
  async incrementFailedLoginAttempts(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    await db
      .update(users)
      .set({
        failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async resetFailedLoginAttempts(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async lockAccount(userId: string, durationMinutes: number): Promise<void> {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + durationMinutes);
    
    await db
      .update(users)
      .set({
        lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Email verification operations
  async createEmailVerificationToken(userId: string): Promise<EmailVerificationToken> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration
    
    const [verificationToken] = await db
      .insert(emailVerificationTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();
    
    return verificationToken;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, token),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      );
    return verificationToken || undefined;
  }

  async deleteEmailVerificationToken(token: string): Promise<void> {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
  }

  // Password reset operations
  async createPasswordResetToken(userId: string): Promise<PasswordResetToken> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration
    
    // Delete any existing tokens for this user
    await this.deletePasswordResetTokensByUser(userId);
    
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();
    
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );
    return resetToken || undefined;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  }

  async deletePasswordResetTokensByUser(userId: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  }
}

export const storage = new DatabaseStorage();
