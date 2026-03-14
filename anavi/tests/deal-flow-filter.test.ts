import { describe, expect, it } from "vitest";
import { buildStatusFilterSet } from "../client/src/pages/DealFlow";

describe("DealFlow status filter compatibility", () => {
  it("expands pending_consent to supported lifecycle statuses", () => {
    const set = buildStatusFilterSet("pending_consent");
    expect(set).not.toBeNull();
    expect(set && Array.from(set).sort()).toEqual(
      ["nda_pending", "pending", "user1_interested", "user2_interested"].sort()
    );
  });

  it("passes through non-aliased statuses unchanged", () => {
    const set = buildStatusFilterSet("deal_room_created");
    expect(set).not.toBeNull();
    expect(set && Array.from(set)).toEqual(["deal_room_created"]);
  });

  it("preserves match visibility for legacy pending_consent deep links", () => {
    const set = buildStatusFilterSet("pending_consent");
    const statuses = [
      "pending",
      "user1_interested",
      "user2_interested",
      "nda_pending",
      "deal_room_created",
    ];
    const visible = statuses.filter((status) => (set ? set.has(status) : false));
    expect(visible).toEqual([
      "pending",
      "user1_interested",
      "user2_interested",
      "nda_pending",
    ]);
  });
});
