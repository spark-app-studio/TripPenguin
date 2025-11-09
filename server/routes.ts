import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTripSchema,
  insertDestinationSchema,
  insertBudgetCategorySchema,
  insertBookingSchema,
  registerUserSchema,
  loginUserSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  resendVerificationSchema,
  type PublicUser,
} from "@shared/schema";
import { z } from "zod";
import { getBookingRecommendations, bookingSearchParamsSchema } from "./ai-booking";
import { getBudgetAdvice, budgetAdviceParamsSchema } from "./ai-budget";
import { setupAuth, hashPassword, isAuthenticated, csrfProtection, authRateLimiter, passwordResetRateLimiter } from "./auth";
import { emailService } from "./email";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Apply CSRF protection to all routes
  app.use(csrfProtection);

  // Auth routes
  app.post("/api/auth/register", authRateLimiter, async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        acceptedTermsAt: new Date(),
        emailVerified: false,
      });

      // Create email verification token and send email
      const verificationToken = await storage.createEmailVerificationToken(user.id);
      await emailService.sendVerificationEmail(user.email, verificationToken.token);

      const publicUser: PublicUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        acceptedTermsAt: user.acceptedTermsAt,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) {
          res.status(500).json({ error: "Failed to create session" });
          return;
        }
        
        req.login(publicUser, (err) => {
          if (err) {
            res.status(500).json({ error: "Failed to login after registration" });
            return;
          }
          res.status(201).json(publicUser);
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid registration data", details: error.errors });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Failed to register user", details: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  app.post("/api/auth/login", authRateLimiter, (req, res, next) => {
    try {
      loginUserSchema.parse(req.body);
      passport.authenticate("local", (err: any, user: PublicUser | false, info: any) => {
        if (err) {
          res.status(500).json({ error: "Authentication failed" });
          return;
        }
        if (!user) {
          res.status(401).json({ error: info?.message || "Invalid credentials" });
          return;
        }
        
        req.session.regenerate((regenerateErr) => {
          if (regenerateErr) {
            res.status(500).json({ error: "Failed to create session" });
            return;
          }
          
          req.login(user, (loginErr) => {
            if (loginErr) {
              res.status(500).json({ error: "Login failed" });
              return;
            }
            res.json(user);
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid login data", details: error.errors });
      } else {
        res.status(500).json({ error: "Login failed" });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        res.status(500).json({ error: "Logout failed" });
        return;
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    res.json(req.user);
  });

  // Email verification routes
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }

      const verificationToken = await storage.getEmailVerificationToken(token);
      if (!verificationToken) {
        res.status(400).json({ error: "Invalid or expired verification token" });
        return;
      }

      await storage.updateUser(verificationToken.userId, { emailVerified: true });
      await storage.deleteEmailVerificationToken(token);

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  app.post("/api/auth/resend-verification", authRateLimiter, async (req, res) => {
    try {
      const { email } = resendVerificationSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        res.json({ message: "If the email exists, a verification link has been sent" });
        return;
      }

      if (user.emailVerified) {
        res.status(400).json({ error: "Email is already verified" });
        return;
      }

      const verificationToken = await storage.createEmailVerificationToken(user.id);
      await emailService.sendVerificationEmail(user.email, verificationToken.token);

      res.json({ message: "Verification email sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid email", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to send verification email" });
      }
    }
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", passwordResetRateLimiter, async (req, res) => {
    try {
      const { email } = passwordResetRequestSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        res.json({ message: "If the email exists, a password reset link has been sent" });
        return;
      }

      const resetToken = await storage.createPasswordResetToken(user.id);
      await emailService.sendPasswordResetEmail(user.email, resetToken.token);

      res.json({ message: "Password reset email sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid email", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to send password reset email" });
      }
    }
  });

  app.post("/api/auth/reset-password", passwordResetRateLimiter, async (req, res) => {
    try {
      const resetData = passwordResetSchema.parse(req.body);
      
      const resetToken = await storage.getPasswordResetToken(resetData.token);
      if (!resetToken) {
        res.status(400).json({ error: "Invalid or expired reset token" });
        return;
      }

      const hashedPassword = await hashPassword(resetData.password);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      await storage.deletePasswordResetToken(resetData.token);
      await storage.resetFailedLoginAttempts(resetToken.userId);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid password reset data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to reset password" });
      }
    }
  });

  // Trip routes
  app.get("/api/trips", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as PublicUser;
      const userTrips = await storage.getTripsByUser(user.id);
      res.json(userTrips);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  app.post("/api/trips", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as PublicUser;
      const tripData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip({ ...tripData, userId: user.id });
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid trip data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create trip" });
      }
    }
  });

  app.get("/api/trips/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as PublicUser;
      const trip = await storage.getTripWithDetails(req.params.id);
      if (!trip) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      if (trip.userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });

  app.patch("/api/trips/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as PublicUser;
      const existingTrip = await storage.getTrip(req.params.id);
      if (!existingTrip) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      if (existingTrip.userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      
      const tripData = insertTripSchema.partial().parse(req.body);
      const trip = await storage.updateTrip(req.params.id, tripData);
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid trip data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update trip" });
      }
    }
  });

  app.delete("/api/trips/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as PublicUser;
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      if (trip.userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      
      await storage.deleteTrip(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });

  // Destination routes
  app.post("/api/destinations", isAuthenticated, async (req, res) => {
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

  app.get("/api/destinations/trip/:tripId", isAuthenticated, async (req, res) => {
    try {
      const destinations = await storage.getDestinationsByTrip(req.params.tripId);
      res.json(destinations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch destinations" });
    }
  });

  app.patch("/api/destinations/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/destinations/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDestination(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete destination" });
    }
  });

  // Budget category routes
  app.post("/api/budget-categories", isAuthenticated, async (req, res) => {
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

  app.get("/api/budget-categories/trip/:tripId", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getBudgetCategoriesByTrip(req.params.tripId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget categories" });
    }
  });

  app.patch("/api/budget-categories/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/budget-categories/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBudgetCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete budget category" });
    }
  });

  // Booking routes
  app.post("/api/bookings", isAuthenticated, async (req, res) => {
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

  app.get("/api/bookings/trip/:tripId", isAuthenticated, async (req, res) => {
    try {
      const bookingsData = await storage.getBookingsByTrip(req.params.tripId);
      res.json(bookingsData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.patch("/api/bookings/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  // AI routes
  app.post("/api/ai/booking-recommendations", isAuthenticated, async (req, res) => {
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

  app.post("/api/ai/budget-recommendations", isAuthenticated, async (req, res) => {
    try {
      const adviceParams = budgetAdviceParamsSchema.parse(req.body);
      const advice = await getBudgetAdvice(adviceParams);
      res.json(advice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid budget recommendation parameters", details: error.errors });
      } else if (error instanceof Error && error.message.includes("API key")) {
        res.status(503).json({ error: "AI budget recommendation service is not configured" });
      } else {
        console.error("AI budget recommendation error:", error);
        res.status(500).json({ error: "Failed to get budget recommendations" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
