import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestCaller } from "../test/setup";
import * as db from "../db";
import * as docusign from "../services/docusign";

type EnvelopeStatus =
  | "draft"
  | "created"
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided"
  | "expired"
  | "error";

type MockRoom = {
  id: number;
  name: string;
  dealId: number | null;
  ndaTemplateId: number | null;
};

type MockAccessRow = {
  dealRoomId: number;
  userId: number;
  ndaSigned: boolean;
  ndaSignedAt: Date | null;
};

type MockEnvelope = {
  id: number;
  dealRoomId: number;
  dealId: number | null;
  providerEnvelopeId: string;
  templateId: string | null;
  subject: string;
  status: EnvelopeStatus;
  createdByUserId: number;
  sentAt: Date | null;
  completedAt: Date | null;
  voidedAt: Date | null;
  lastProviderEventAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockRecipient = {
  id: number;
  envelopeId: number;
  providerRecipientId: string;
  role: "signer" | "viewer" | "cc";
  routingOrder: number;
  name: string;
  email: string;
  userId: number | null;
  status: "created" | "sent" | "delivered" | "signed" | "declined" | "completed";
  signedAt: Date | null;
  declinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const now = new Date("2026-03-13T00:00:00.000Z");
const roomId = 42;
const ownerId = 1;
const counterpartyId = 2;

const store = {
  room: {
    id: roomId,
    name: "Solar JV",
    dealId: 901,
    ndaTemplateId: null,
  } satisfies MockRoom,
  accessRows: [] as MockAccessRow[],
  users: new Map<number, { id: number; name: string; email: string }>(),
  envelopes: [] as MockEnvelope[],
  recipientsByEnvelopeId: new Map<number, MockRecipient[]>(),
  nextEnvelopeId: 1,
  nextProviderEnvelopeSeq: 1,
};

function resetStore() {
  store.accessRows = [
    { dealRoomId: roomId, userId: ownerId, ndaSigned: false, ndaSignedAt: null },
    { dealRoomId: roomId, userId: counterpartyId, ndaSigned: false, ndaSignedAt: null },
  ];
  store.users = new Map<number, { id: number; name: string; email: string }>([
    [ownerId, { id: ownerId, name: "Owner User", email: "owner@example.com" }],
    [counterpartyId, { id: counterpartyId, name: "Counterparty User", email: "counterparty@example.com" }],
  ]);
  store.envelopes = [];
  store.recipientsByEnvelopeId = new Map<number, MockRecipient[]>();
  store.nextEnvelopeId = 1;
  store.nextProviderEnvelopeSeq = 1;
}

function seedEnvelope(status: EnvelopeStatus, recipientUserIds: number[] = [ownerId, counterpartyId]) {
  const id = store.nextEnvelopeId++;
  const providerEnvelopeId = `provider-seeded-${id}`;
  store.envelopes.push({
    id,
    dealRoomId: roomId,
    dealId: store.room.dealId,
    providerEnvelopeId,
    templateId: null,
    subject: `NDA - ${store.room.name}`,
    status,
    createdByUserId: ownerId,
    sentAt: null,
    completedAt: null,
    voidedAt: null,
    lastProviderEventAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const recipients = recipientUserIds.map((userId, index) => {
    const user = store.users.get(userId)!;
    return {
      id: id * 10 + index,
      envelopeId: id,
      providerRecipientId: `seeded-recipient-${id}-${index + 1}`,
      role: "signer" as const,
      routingOrder: index + 1,
      name: user.name,
      email: user.email,
      userId,
      status: "created" as const,
      signedAt: null,
      declinedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  });
  store.recipientsByEnvelopeId.set(id, recipients);
  return id;
}

vi.mock("../db", () => ({
  getUserFlags: vi.fn(async () => []),
  getDealRoomById: vi.fn(async (id: number) => (id === store.room.id ? store.room : null)),
  getDealRoomAccessByUserAndRoom: vi.fn(async (dealRoomId: number, userId: number) => {
    return store.accessRows.find(
      row => row.dealRoomId === dealRoomId && row.userId === userId
    ) ?? null;
  }),
  listDocusignEnvelopesByDealRoom: vi.fn(async (dealRoomId: number) => {
    return store.envelopes.filter(envelope => envelope.dealRoomId === dealRoomId);
  }),
  getDealRoomAccessByRoom: vi.fn(async (dealRoomId: number) => {
    return store.accessRows.filter(row => row.dealRoomId === dealRoomId);
  }),
  getUserById: vi.fn(async (id: number) => store.users.get(id) ?? null),
  createDocusignEnvelopeGraph: vi.fn(async (input: any) => {
    const id = store.nextEnvelopeId++;
    const envelope: MockEnvelope = {
      id,
      dealRoomId: input.dealRoomId,
      dealId: input.dealId ?? null,
      providerEnvelopeId: input.providerEnvelopeId,
      templateId: input.templateId ?? null,
      subject: input.subject,
      status: input.status,
      createdByUserId: input.createdByUserId,
      sentAt: null,
      completedAt: null,
      voidedAt: null,
      lastProviderEventAt: null,
      createdAt: now,
      updatedAt: now,
    };
    store.envelopes.push(envelope);
    const recipients: MockRecipient[] = (input.recipients ?? []).map((recipient: any, index: number) => ({
      id: id * 10 + index,
      envelopeId: id,
      providerRecipientId: recipient.providerRecipientId,
      role: recipient.role,
      routingOrder: recipient.routingOrder,
      name: recipient.name,
      email: recipient.email,
      userId: recipient.userId ?? null,
      status: recipient.status ?? "created",
      signedAt: null,
      declinedAt: null,
      createdAt: now,
      updatedAt: now,
    }));
    store.recipientsByEnvelopeId.set(id, recipients);
    return id;
  }),
  logAuditEvent: vi.fn(async () => undefined),
  getDocusignEnvelopeById: vi.fn(async (envelopeId: number) => {
    return store.envelopes.find(envelope => envelope.id === envelopeId) ?? null;
  }),
  updateDocusignEnvelopeStatusMonotonic: vi.fn(
    async (input: { envelopeId: number; status: EnvelopeStatus }) => {
      const row = store.envelopes.find(envelope => envelope.id === input.envelopeId);
      if (!row) return;
      row.status = input.status;
      row.updatedAt = now;
    }
  ),
  listDocusignRecipientsByEnvelopeId: vi.fn(async (envelopeId: number) => {
    return store.recipientsByEnvelopeId.get(envelopeId) ?? [];
  }),
}));

vi.mock("../services/docusign", () => ({
  isDocusignConfigured: vi.fn(() => true),
  createProviderEnvelope: vi.fn(async (input: any) => {
    const seq = store.nextProviderEnvelopeSeq++;
    return {
      providerEnvelopeId: `provider-created-${seq}`,
      status: "created",
      recipients: (input.recipients ?? []).map((recipient: any, index: number) => ({
        ...recipient,
        providerRecipientId: `provider-recipient-${seq}-${index + 1}`,
        status: "created",
      })),
      documents: [
        {
          providerDocumentId: `provider-doc-${seq}-1`,
          name: input.documents?.[0]?.name ?? "NDA",
        },
      ],
    };
  }),
  sendProviderEnvelope: vi.fn(async (providerEnvelopeId: string) => ({
    providerEnvelopeId,
    status: "sent",
  })),
  createProviderRecipientView: vi.fn(async () => ({
    url: "https://example.com/docusign/signing-session",
  })),
}));

const { appRouter } = await import("./index");

describe("dealRoom router - DocuSign lifecycle", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it("reuses an existing open NDA envelope instead of creating a duplicate", async () => {
    const existingEnvelopeId = seedEnvelope("created");
    const caller = createTestCaller(appRouter, ownerId);

    const result = await caller.dealRoom.createNdaEnvelope({ dealRoomId: roomId });

    expect(result.reused).toBe(true);
    expect(result.envelopeId).toBe(existingEnvelopeId);
    expect((docusign.createProviderEnvelope as any).mock.calls.length).toBe(0);
    expect((db.createDocusignEnvelopeGraph as any).mock.calls.length).toBe(0);
  });

  it("creates envelope graph and audit entry when no open envelope exists", async () => {
    const caller = createTestCaller(appRouter, ownerId);

    const result = await caller.dealRoom.createNdaEnvelope({
      dealRoomId: roomId,
      subject: "NDA - Custom Subject",
    });

    expect(result.reused).toBe(false);
    expect(result.status).toBe("created");
    expect((docusign.createProviderEnvelope as any).mock.calls.length).toBe(1);
    expect((db.createDocusignEnvelopeGraph as any).mock.calls.length).toBe(1);
    const createdAuditCall = (db.logAuditEvent as any).mock.calls.find(
      ([payload]: any[]) => payload?.action === "docusign_nda_envelope_created"
    );
    expect(createdAuditCall).toBeDefined();
  });

  it("treats duplicate send on sent lifecycle as idempotent no-op", async () => {
    const envelopeId = seedEnvelope("sent");
    const caller = createTestCaller(appRouter, ownerId);

    const result = await caller.dealRoom.sendNdaEnvelope({ envelopeId });

    expect(result.alreadySent).toBe(true);
    expect(result.status).toBe("sent");
    expect((docusign.sendProviderEnvelope as any).mock.calls.length).toBe(0);
    expect((db.updateDocusignEnvelopeStatusMonotonic as any).mock.calls.length).toBe(0);
  });

  it("sends draft envelope, persists status, and audits the transition", async () => {
    const envelopeId = seedEnvelope("created");
    const caller = createTestCaller(appRouter, ownerId);

    const result = await caller.dealRoom.sendNdaEnvelope({ envelopeId });

    expect(result.alreadySent).toBe(false);
    expect(result.status).toBe("sent");
    expect((docusign.sendProviderEnvelope as any).mock.calls.length).toBe(1);
    expect((db.updateDocusignEnvelopeStatusMonotonic as any).mock.calls[0]?.[0]).toEqual({
      envelopeId,
      status: "sent",
    });
    const sentAuditCall = (db.logAuditEvent as any).mock.calls.find(
      ([payload]: any[]) => payload?.action === "docusign_nda_envelope_sent"
    );
    expect(sentAuditCall).toBeDefined();
  });

  it("blocks send attempts from terminal statuses", async () => {
    const envelopeId = seedEnvelope("voided");
    const caller = createTestCaller(appRouter, ownerId);

    await expect(caller.dealRoom.sendNdaEnvelope({ envelopeId })).rejects.toThrow(
      "Envelope cannot be sent from status 'voided'"
    );
    expect((docusign.sendProviderEnvelope as any).mock.calls.length).toBe(0);
  });

  it("requires current user to be a signer when requesting DocuSign signing URL", async () => {
    const envelopeId = seedEnvelope("sent", [counterpartyId]);
    const ownerCaller = createTestCaller(appRouter, ownerId);

    await expect(
      ownerCaller.dealRoom.getNdaSignUrl({
        envelopeId,
        returnUrl: "https://app.example.com/deal-rooms/42",
      })
    ).rejects.toThrow("Current user is not a signer on this envelope");

    const counterpartyCaller = createTestCaller(appRouter, counterpartyId);
    const signedView = await counterpartyCaller.dealRoom.getNdaSignUrl({
      envelopeId,
      returnUrl: "https://app.example.com/deal-rooms/42",
    });

    expect(signedView.signingUrl).toContain("docusign/signing-session");
    expect((docusign.createProviderRecipientView as any).mock.calls.length).toBe(1);
  });
});
