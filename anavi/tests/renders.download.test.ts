import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  createContext: vi.fn(),
  getAnimationStudioRenderJob: vi.fn(),
}));

vi.mock("@trpc/server/adapters/express", () => ({
  createExpressMiddleware: vi
    .fn()
    .mockImplementation(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("../server/routers", () => ({
  appRouter: {},
}));

vi.mock("../server/_core/oauth", () => ({
  registerAuthRoutes: vi.fn(),
}));

vi.mock("../server/_core/verify", () => ({
  registerVerificationRoutes: vi.fn(),
}));

vi.mock("../server/_core/context", () => ({
  createContext: mocks.createContext,
}));

vi.mock("../server/db/animationStudio", () => ({
  getAnimationStudioRenderJob: mocks.getAnimationStudioRenderJob,
}));

const { default: app } = await import("../api/index");

describe("GET /api/renders/:jobId/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when request is unauthenticated", async () => {
    mocks.createContext.mockResolvedValue({ user: null });

    const response = await request(app).get("/api/renders/job_unauth/download");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
    expect(mocks.getAnimationStudioRenderJob).not.toHaveBeenCalled();
  });

  it("scopes render lookup by current user", async () => {
    mocks.createContext.mockResolvedValue({
      user: { id: 42 },
    });
    mocks.getAnimationStudioRenderJob.mockResolvedValue(null);

    const response = await request(app).get("/api/renders/job_owned/download");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Render job not found" });
    expect(mocks.getAnimationStudioRenderJob).toHaveBeenCalledWith(
      "job_owned",
      42
    );
  });

  it("returns 409 when job exists but is not yet downloadable", async () => {
    mocks.createContext.mockResolvedValue({
      user: { id: 9 },
    });
    mocks.getAnimationStudioRenderJob.mockResolvedValue({
      jobId: "job_pending",
      state: "running",
      renderPath: null,
    });

    const response = await request(app).get("/api/renders/job_pending/download");

    expect(response.status).toBe(409);
    expect(response.body.error).toContain(
      "Job not ready for download (state: running)"
    );
  });

  it("returns 410 when artifact path is missing on disk", async () => {
    mocks.createContext.mockResolvedValue({
      user: { id: 9 },
    });
    mocks.getAnimationStudioRenderJob.mockResolvedValue({
      jobId: "job_succeeded",
      state: "succeeded",
      renderPath: "/tmp/non-existent-render-artifact.mp4",
    });

    const response = await request(app).get(
      "/api/renders/job_succeeded/download"
    );

    expect(response.status).toBe(410);
    expect(response.body).toEqual({ error: "Render artifact not on disk" });
  });
});
