import { describe, expect, it } from "vitest";
import { checkRateLimit } from "../../src/services/rateLimiterService";

describe("rateLimiterService", () => {
  it("should enforce rate limits within sliding window", async () => {
    const testKey = `test-client-${Date.now()}`;
    const limit = 3;
    const windowMs = 5000;

    // 1st request -> allowed
    const res1 = await checkRateLimit(testKey, limit, windowMs);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    // 2nd request -> allowed
    const res2 = await checkRateLimit(testKey, limit, windowMs);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    // 3rd request -> allowed
    const res3 = await checkRateLimit(testKey, limit, windowMs);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4th request -> blocked (429)
    const res4 = await checkRateLimit(testKey, limit, windowMs);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.retryAfterInSeconds).toBeGreaterThanOrEqual(0);
  });
});
