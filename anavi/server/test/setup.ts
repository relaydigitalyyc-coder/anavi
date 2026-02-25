import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

export function createAuthContext(userOverrides?: Partial<AuthenticatedUser>) {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...userOverrides,
  } as AuthenticatedUser;

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as unknown as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };

  return { ctx, user };
}

export function createTestCaller(
  appRouter: { createCaller: (ctx: TrpcContext) => unknown },
  userId: number,
  userOverrides?: Partial<AuthenticatedUser>
) {
  const { ctx } = createAuthContext({ ...userOverrides, id: userId });
  return appRouter.createCaller(ctx) as ReturnType<typeof appRouter.createCaller>;
}
