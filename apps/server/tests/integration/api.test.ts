import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";

describe("API Integration Endpoints", () => {
  it("GET / should return healthy status and metadata", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name", "Last Words API");
    expect(res.body).toHaveProperty("status", "healthy");
    expect(res.headers).toHaveProperty("x-ratelimit-limit");
  });

  it("GET /health should return status and uptime", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "healthy");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("POST /auth/register with invalid data should return 400 validation error", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "",
      email: "invalid-email",
      password: "123",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("status", "fail");
  });

  it("POST /auth/login with missing password should return 400 validation error", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "user@example.com",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("status", "fail");
  });

  it("POST /auth/refresh with empty payload should return 400", async () => {
    const res = await request(app).post("/auth/refresh").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("status", "fail");
  });

  it("GET /docs should serve Swagger UI documentation", async () => {
    const res = await request(app).get("/docs/");
    expect([200, 301, 302]).toContain(res.status);
  });
});

