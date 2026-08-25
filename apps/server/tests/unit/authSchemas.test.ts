import {
  loginUserSchema,
  refreshTokenSchema,
  registerUserSchema,
  verifyOtpSchema,
} from "@shared/schemas/authSchemas";
import { describe, expect, it } from "vitest";

describe("Shared Auth Zod Schemas", () => {
  describe("registerUserSchema", () => {
    it("should accept valid registration data", () => {
      const valid = {
        name: "Alice Johnson",
        email: "alice@example.com",
        password: "StrongPassword123!",
      };
      const result = registerUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject weak passwords without uppercase", () => {
      const invalid = {
        name: "Alice",
        email: "alice@example.com",
        password: "weakpassword123!",
      };
      const result = registerUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject short passwords", () => {
      const invalid = {
        name: "Alice",
        email: "alice@example.com",
        password: "Pass1!",
      };
      const result = registerUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid email formats", () => {
      const invalid = {
        name: "Alice",
        email: "not-an-email",
        password: "StrongPassword123!",
      };
      const result = registerUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("loginUserSchema", () => {
    it("should validate valid login payload", () => {
      const valid = {
        email: "user@example.com",
        password: "any-password",
      };
      const result = loginUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject missing password", () => {
      const invalid = {
        email: "user@example.com",
        password: "",
      };
      const result = loginUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("verifyOtpSchema", () => {
    it("should accept 6-digit OTP with E.164 phone number", () => {
      const valid = {
        phoneNumber: "+14155552671",
        otp: "123456",
      };
      const result = verifyOtpSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject non-numeric OTP", () => {
      const invalid = {
        phoneNumber: "+14155552671",
        otp: "12345a",
      };
      const result = verifyOtpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject non-E.164 phone numbers", () => {
      const invalid = {
        phoneNumber: "0987654321",
        otp: "123456",
      };
      const result = verifyOtpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("refreshTokenSchema", () => {
    it("should accept valid non-empty refresh token", () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: "valid-token-string-12345",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty refresh token", () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
