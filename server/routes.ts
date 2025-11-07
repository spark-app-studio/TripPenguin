import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTripSchema,
  insertDestinationSchema,
  insertBudgetCategorySchema,
  insertBookingSchema,
} from "@shared/schema";
import { z } from "zod";
import { getBookingRecommendations, bookingSearchParamsSchema } from "./ai-booking";

export async function registerRoutes(app: Express): Promise<Server> {
  // Trip routes
  app.get("/api/trips", async (req, res) => {
    try {
      const allTrips = await storage.getAllTrips();
      res.json(allTrips);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  app.post("/api/trips", async (req, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid trip data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create trip" });
      }
    }
  });

  app.get("/api/trips/:id", async (req, res) => {
    try {
      const trip = await storage.getTripWithDetails(req.params.id);
      if (!trip) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });

  app.patch("/api/trips/:id", async (req, res) => {
    try {
      const tripData = insertTripSchema.partial().parse(req.body);
      const trip = await storage.updateTrip(req.params.id, tripData);
      if (!trip) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid trip data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update trip" });
      }
    }
  });

  app.delete("/api/trips/:id", async (req, res) => {
    try {
      await storage.deleteTrip(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });

  // Destination routes
  app.post("/api/destinations", async (req, res) => {
    try {
      const destinationData = insertDestinationSchema.parse(req.body);
      const destination = await storage.createDestination(destinationData);
      res.json(destination);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid destination data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create destination" });
      }
    }
  });

  app.get("/api/destinations/trip/:tripId", async (req, res) => {
    try {
      const destinations = await storage.getDestinationsByTrip(req.params.tripId);
      res.json(destinations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch destinations" });
    }
  });

  app.patch("/api/destinations/:id", async (req, res) => {
    try {
      const destinationData = insertDestinationSchema.partial().parse(req.body);
      const destination = await storage.updateDestination(req.params.id, destinationData);
      if (!destination) {
        res.status(404).json({ error: "Destination not found" });
        return;
      }
      res.json(destination);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid destination data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update destination" });
      }
    }
  });

  app.delete("/api/destinations/:id", async (req, res) => {
    try {
      await storage.deleteDestination(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete destination" });
    }
  });

  // Budget category routes
  app.post("/api/budget-categories", async (req, res) => {
    try {
      const categoryData = insertBudgetCategorySchema.parse(req.body);
      const category = await storage.createBudgetCategory(categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid budget category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create budget category" });
      }
    }
  });

  app.get("/api/budget-categories/trip/:tripId", async (req, res) => {
    try {
      const categories = await storage.getBudgetCategoriesByTrip(req.params.tripId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget categories" });
    }
  });

  app.patch("/api/budget-categories/:id", async (req, res) => {
    try {
      const categoryData = insertBudgetCategorySchema.partial().parse(req.body);
      const category = await storage.updateBudgetCategory(req.params.id, categoryData);
      if (!category) {
        res.status(404).json({ error: "Budget category not found" });
        return;
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid budget category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update budget category" });
      }
    }
  });

  app.delete("/api/budget-categories/:id", async (req, res) => {
    try {
      await storage.deleteBudgetCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete budget category" });
    }
  });

  // Booking routes
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid booking data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create booking" });
      }
    }
  });

  app.get("/api/bookings/trip/:tripId", async (req, res) => {
    try {
      const bookingsData = await storage.getBookingsByTrip(req.params.tripId);
      res.json(bookingsData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.partial().parse(req.body);
      const booking = await storage.updateBooking(req.params.id, bookingData);
      if (!booking) {
        res.status(404).json({ error: "Booking not found" });
        return;
      }
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid booking data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update booking" });
      }
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  // AI Booking routes
  app.post("/api/ai/booking-recommendations", async (req, res) => {
    try {
      const searchParams = bookingSearchParamsSchema.parse(req.body);
      const recommendations = await getBookingRecommendations(searchParams);
      res.json(recommendations);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid booking search parameters", details: error.errors });
      } else if (error instanceof Error && error.message.includes("API key")) {
        res.status(503).json({ error: "AI booking service is not configured" });
      } else {
        console.error("AI booking error:", error);
        res.status(500).json({ error: "Failed to get booking recommendations" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
