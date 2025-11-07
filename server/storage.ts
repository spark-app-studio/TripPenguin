import {
  trips,
  destinations,
  budgetCategories,
  bookings,
  type Trip,
  type InsertTrip,
  type Destination,
  type InsertDestination,
  type BudgetCategory,
  type InsertBudgetCategory,
  type Booking,
  type InsertBooking,
  type TripWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Trip operations
  getAllTrips(): Promise<Trip[]>;
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
  // Trip operations
  async getAllTrips(): Promise<Trip[]> {
    return await db.select().from(trips);
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
}

export const storage = new DatabaseStorage();
