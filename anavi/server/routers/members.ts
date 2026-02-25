import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const membersRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getNetworkMembers();
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        status: z.enum(["pending", "active"]).optional(),
        tier: z.enum(["basic", "premium", "partner"]).optional(),
        industry: z.string().optional(),
        allocatedCapital: z.number().optional(),
        expertise: z.array(z.string()).optional(),
        connections: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createNetworkMember(input);
    }),
});
