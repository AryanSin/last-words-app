import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { JWT_SECRET } from "../../src/config/env";
import { generateAccessToken } from "../../src/utils/authUtility";

describe("authUtility", () => {
  it("should generate a valid JWT access token with payload", () => {
    const user = {
      id: 42,
      email: "test@example.com",
      phoneNumber: "+14155552671",
    };

    const token = generateAccessToken(user);
    expect(typeof token).toBe("string");

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.id).toBe(42);
    expect(decoded.email).toBe("test@example.com");
    expect(decoded.phoneNumber).toBe("+14155552671");
    expect(decoded.exp).toBeDefined();
  });
});
