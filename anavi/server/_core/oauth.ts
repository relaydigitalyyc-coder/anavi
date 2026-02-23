import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { SignJWT } from "jose";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import type { User } from "../../drizzle/schema";

/** Synthetic user id when DB is unavailable in dev. Context treats this specially. */
const BYPASS_USER_ID = 0;

async function createSessionJWT(user: { id: number; email: string | null }) {
  const secretKey = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secretKey);
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: "name, email, and password are required" });
        return;
      }

      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "A user with this email already exists" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await db.upsertUser({
        openId: nanoid(),
        name,
        email,
        passwordHash,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      const token = await createSessionJWT(user);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ user });
    } catch (error) {
      console.error("[Auth] Registration failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "email and password are required" });
        return;
      }

      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      await db.updateUserProfile(user.id, { lastSignedIn: new Date() });

      const token = await createSessionJWT(user);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ user });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  const DEMO_PASSWORD = "demo123";

  app.post("/api/auth/bypass", async (req: Request, res: Response) => {
    if (ENV.isProduction) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    try {
      const demoEmail = "demo@prelaunch.local";
      let user: User | null = (await db.getUserByEmail(demoEmail)) ?? null;
      if (!user) {
        const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
        await db.upsertUser({
          openId: "prelaunch-bypass-demo",
          name: "Demo User",
          email: demoEmail,
          passwordHash,
          loginMethod: "bypass",
          lastSignedIn: new Date(),
        });
        user = (await db.getUserByEmail(demoEmail)) ?? (await db.getUserByOpenId("prelaunch-bypass-demo")) ?? null;
      } else if (!user.passwordHash) {
        // Existing demo user from old bypass — add password so email sign-in works
        const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
        await db.updateUserProfile(user.id, { passwordHash });
      }
      if (!user) {
        // DB unavailable (e.g. no DATABASE_URL) — use synthetic user for prelaunch
        const synthetic: User = {
          id: BYPASS_USER_ID,
          openId: "prelaunch-bypass-demo",
          name: "Demo User",
          email: demoEmail,
          passwordHash: null,
          emailVerified: false,
          loginMethod: "bypass",
          role: "user",
          verificationTier: "none",
          trustScore: "0.00",
          verificationBadge: null,
          kybStatus: "pending",
          kycStatus: "pending",
          participantType: null,
          onboardingStep: 0,
          onboardingCompleted: false,
          company: null,
          title: null,
          bio: null,
          avatar: null,
          website: null,
          location: null,
          phone: null,
          investmentFocus: null,
          dealVerticals: null,
          typicalDealSize: null,
          geographicFocus: null,
          yearsExperience: null,
          linkedinUrl: null,
          sanctionsCleared: false,
          pepStatus: false,
          adverseMediaCleared: true,
          complianceLastChecked: null,
          jurisdictions: null,
          totalDeals: 0,
          totalDealValue: "0.00",
          totalEarnings: "0.00",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as User;
        user = synthetic;
      }
      const token = await createSessionJWT(user);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ user });
    } catch (error) {
      console.error("[Auth] Bypass failed", error);
      const msg = error instanceof Error ? error.message : "Bypass failed";
      res.status(500).json({ error: !ENV.isProduction ? msg : "Bypass failed" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      // Stub: always return success. No email sent in MVP.
      res.status(200).json({ success: true, message: "If an account exists, we've sent a reset link." });
    } catch (error) {
      console.error("[Auth] Forgot password failed", error);
      res.status(500).json({ error: "Request failed" });
    }
  });
}
