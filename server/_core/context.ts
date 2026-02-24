import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import { ENV } from "./env";
import * as db from "../db";

const BYPASS_USER_ID = 0;

const SYNTHETIC_BYPASS_USER: User = {
  id: BYPASS_USER_ID,
  openId: "prelaunch-bypass-demo",
  name: "Demo User",
  email: "demo@prelaunch.local",
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

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const cookies = parseCookieHeader(opts.req.headers.cookie || "");
    const sessionCookie = cookies[COOKIE_NAME];

    if (sessionCookie) {
      const secretKey = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(sessionCookie, secretKey, {
        algorithms: ["HS256"],
      });

      const userId = payload.userId as number;
      if (userId) {
        user = (await db.getUserById(userId)) ?? null;
        if (!user && userId === BYPASS_USER_ID && !ENV.isProduction) {
          user = SYNTHETIC_BYPASS_USER;
        }
      }
    }
  } catch (error) {
    user = null;
  }

  // Prelaunch: when no auth and not production, use synthetic user so all pages are ungated
  if (!user && !ENV.isProduction) {
    user = SYNTHETIC_BYPASS_USER;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
