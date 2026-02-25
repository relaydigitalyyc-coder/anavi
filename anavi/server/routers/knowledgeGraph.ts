import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const knowledgeGraphRouter = router({
  graphData: protectedProcedure.query(async ({ ctx }) => {
    const [relationships, deals] = await Promise.all([
      db.getRelationshipsByOwner(ctx.user.id),
      db.getDealsByUser(ctx.user.id),
    ]);

    const nodes: Array<{
      id: string;
      label: string;
      type: "person" | "company" | "deal" | "meeting" | "topic" | "action";
      data?: Record<string, unknown>;
    }> = [];
    const links: Array<{
      source: string;
      target: string;
      type: string;
      label?: string;
      strength?: number;
    }> = [];

    nodes.push({
      id: `user-${ctx.user.id}`,
      label: ctx.user.name || "You",
      type: "person",
      data: { role: "Owner" },
    });

    for (const rel of relationships) {
      const nodeId = `contact-${rel.contactId}`;
      nodes.push({
        id: nodeId,
        label: `Contact ${rel.contactId}`,
        type: "person",
        data: { strength: rel.strength },
      });
      links.push({
        source: `user-${ctx.user.id}`,
        target: nodeId,
        type: "relationship",
        strength: (Number(rel.strength) || 50) / 100,
      });
    }

    for (const deal of deals) {
      const nodeId = `deal-${deal.id}`;
      nodes.push({
        id: nodeId,
        label: deal.title,
        type: "deal",
        data: { stage: deal.stage, value: deal.dealValue },
      });
      links.push({
        source: `user-${ctx.user.id}`,
        target: nodeId,
        type: "owns",
      });
    }

    return { nodes, links };
  }),
});
