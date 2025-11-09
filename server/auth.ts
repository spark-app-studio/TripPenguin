import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import type { PublicUser } from "@shared/schema";

const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Rate limiters
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: "Too many password reset requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Check if account is locked
async function isAccountLocked(user: any): Promise<boolean> {
  if (!user.lockedUntil) return false;
  
  const now = new Date();
  if (user.lockedUntil > now) {
    return true;
  }
  
  // Lock has expired, reset failed attempts
  await storage.resetFailedLoginAttempts(user.id);
  return false;
}

export function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable must be set for secure session management");
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Check if account is locked
          if (await isAccountLocked(user)) {
            return done(null, false, { 
              message: `Account is locked due to too many failed login attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.` 
            });
          }

          const isValid = await comparePassword(password, user.password);
          if (!isValid) {
            // Increment failed login attempts
            await storage.incrementFailedLoginAttempts(user.id);
            
            const failedAttempts = (user.failedLoginAttempts || 0) + 1;
            
            // Lock account if max attempts reached
            if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
              await storage.lockAccount(user.id, LOCKOUT_DURATION_MINUTES);
              return done(null, false, { 
                message: `Too many failed login attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.` 
              });
            }
            
            const remainingAttempts = MAX_LOGIN_ATTEMPTS - failedAttempts;
            return done(null, false, { 
              message: `Invalid email or password. ${remainingAttempts} attempts remaining.` 
            });
          }

          // Successful login - reset failed attempts
          await storage.resetFailedLoginAttempts(user.id);

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

          return done(null, publicUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as PublicUser).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }

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

      done(null, publicUser);
    } catch (error) {
      done(error);
    }
  });
}

export const csrfProtection: RequestHandler = (req, res, next) => {
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  
  if (stateChangingMethods.includes(req.method)) {
    const customHeader = req.headers["x-requested-with"];
    
    if (customHeader !== "XMLHttpRequest") {
      res.status(403).json({ message: "Forbidden: CSRF protection" });
      return;
    }
  }
  
  next();
};

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
