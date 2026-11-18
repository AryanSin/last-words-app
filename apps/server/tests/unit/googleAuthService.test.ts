import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { googleAuthService } from "../../src/integrations/googleAuthService";
import AppError from "../../src/utils/AppError";

describe("googleAuthService", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should extract user info from valid userinfo endpoint fallback", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("oauth2/v3/userinfo")) {
        return {
          ok: true,
          json: async () => ({
            sub: "google-12345",
            email: "user@example.com",
            name: "Test User",
            picture: "https://example.com/avatar.png",
            email_verified: true,
          }),
        };
      }
      return { ok: false };
    }) as any;

    // Passing invalid token format will bypass client.verifyIdToken and hit userinfo fallback
    const result = await googleAuthService.verifyIdToken("mock_oauth_access_token");
    expect(result).toEqual({
      googleId: "google-12345",
      email: "user@example.com",
      name: "Test User",
      picture: "https://example.com/avatar.png",
      emailVerified: true,
    });
  });

  it("should throw AppError 401 when token verification and all fallbacks fail", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      return { ok: false };
    }) as any;

    await expect(googleAuthService.verifyIdToken("completely_invalid_token")).rejects.toThrow(
      AppError,
    );
  });
});

