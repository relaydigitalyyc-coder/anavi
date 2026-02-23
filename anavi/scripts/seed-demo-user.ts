#!/usr/bin/env tsx
/**
 * Seeds the demo user for prelaunch. Run: pnpm run db:seed
 * Stakeholders can sign in with demo@prelaunch.local / demo123
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import * as db from "../server/db";

const DEMO_EMAIL = "demo@prelaunch.local";
const DEMO_PASSWORD = "demo123";
const DEMO_NAME = "Demo User";

async function main() {
  const database = await db.getDb();
  if (!database) {
    throw new Error("DATABASE_URL is required. Set it in .env to run the seed.");
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await db.upsertUser({
    openId: "prelaunch-bypass-demo",
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });

  console.log(`[Seed] Demo user ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});
