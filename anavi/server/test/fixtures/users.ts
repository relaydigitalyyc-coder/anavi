import type { User } from "../../../drizzle/schema";

export const originatorUser: Partial<User> = {
  id: 1,
  openId: "originator-1",
  email: "originator@test.local",
  name: "Originator User",
  role: "user",
  participantType: "originator",
  onboardingCompleted: true,
};

export const investorUser: Partial<User> = {
  id: 2,
  openId: "investor-2",
  email: "investor@test.local",
  name: "Investor User",
  role: "user",
  participantType: "investor",
  onboardingCompleted: true,
};
