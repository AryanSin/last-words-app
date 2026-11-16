import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";

describe("Message Service Test API (/messages/test & /jobs/test-message)", () => {
  it("POST /messages/test with service='dev' should succeed using dev mock provider", async () => {
    const res = await request(app)
      .post("/messages/test")
      .send({
        service: "dev",
        recipientPhone: "+14155552671",
        title: "Dev WhatsApp Test",
        content: "Testing dev whatsapp delivery",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.data).toHaveProperty("overallSuccess", true);
    expect(res.body.data.servicesTested).toContain("dev");
    expect(res.body.data.results.dev).toMatchObject({
      success: true,
      provider: "dev",
      recipient: "+14155552671",
    });
    expect(res.body.data.results.dev.messageId).toBeDefined();
    expect(typeof res.body.data.results.dev.durationMs).toBe("number");
  });

  it("POST /messages/test with service='twilio' without credentials should report diagnostic failure gracefully", async () => {
    const res = await request(app)
      .post("/messages/test")
      .send({
        service: "twilio",
        recipientPhone: "+14155552671",
        content: "Testing twilio credentials check",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.data.servicesTested).toContain("twilio");
    expect(res.body.data.results.twilio).toBeDefined();
    expect(res.body.data.results.twilio.provider).toBe("twilio");
    expect(res.body.data.results.twilio.details.mode).toBe("whatsapp");
    // Since environment or payload has no Twilio credentials, it should report false with clear error message
    expect(res.body.data.results.twilio.success).toBe(false);
    expect(res.body.data.results.twilio.error).toMatch(/credentials/i);
  });

  it("POST /messages/test with twilioMode='sms' should target SMS mode", async () => {
    const res = await request(app)
      .post("/messages/test")
      .send({
        service: "twilio",
        twilioMode: "sms",
        recipientPhone: "+14155552671",
        content: "Testing twilio SMS dispatch mode",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.results.twilio.details.mode).toBe("sms");
  });

  it("POST /messages/test with service='smtp' should enqueue test mail into background queue immediately without timeout", async () => {
    const res = await request(app)
      .post("/messages/test")
      .send({
        service: "smtp",
        recipientEmail: "tester@example.com",
        title: "SMTP Queue Verification",
        content: "Hello from test suite verifying email queue",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.data.servicesTested).toContain("smtp");
    expect(res.body.data.results.smtp).toBeDefined();
    expect(res.body.data.results.smtp.provider).toBe("smtp");
    expect(res.body.data.results.smtp.success).toBe(true);
    expect(res.body.data.results.smtp.recipient).toBe("tester@example.com");
    expect(res.body.data.results.smtp.details.status).toBe("queued");
    expect(res.body.data.results.smtp.details.jobId).toMatch(/^mail-job-/);
  });

  it("GET /messages/test/queue/:jobId should retrieve queued mail job status", async () => {
    const postRes = await request(app)
      .post("/messages/test")
      .send({
        service: "smtp",
        recipientEmail: "queued-test@example.com",
      });

    const jobId = postRes.body.data.results.smtp.details.jobId;
    expect(jobId).toBeDefined();

    const getRes = await request(app).get(`/messages/test/queue/${jobId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(jobId);
    expect(getRes.body.data.recipient).toBe("queued-test@example.com");
    expect(["queued", "processing", "completed"]).toContain(getRes.body.data.status);
  });

  it("GET /messages/test/queue should return list of recent queued jobs", async () => {
    const res = await request(app).get("/messages/test/queue");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("POST /messages/test with service='all' should evaluate all service components", async () => {
    const res = await request(app)
      .post("/messages/test")
      .send({
        service: "all",
        recipientEmail: "tester@example.com",
        recipientPhone: "+14155552671",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.servicesTested).toEqual(
      expect.arrayContaining(["smtp", "twilio", "meta", "dev"]),
    );
    expect(res.body.data.results.dev.success).toBe(true);
  }, 15000);

  it("POST /messages/test-send alias should also function identically", async () => {
    const res = await request(app)
      .post("/messages/test-send")
      .send({
        service: "dev",
        recipientPhone: "+14155552671",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.overallSuccess).toBe(true);
  });

  it("POST /jobs/test-message should allow testing from background/ops route without token", async () => {
    const res = await request(app)
      .post("/jobs/test-message")
      .send({
        service: "dev",
        recipientPhone: "+14155552671",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.overallSuccess).toBe(true);
    expect(res.body.data.servicesTested).toContain("dev");
  });

  it("POST /jobs/test-send alias should work on jobs router", async () => {
    const res = await request(app)
      .post("/jobs/test-send")
      .send({
        service: "dev",
        recipientPhone: "+14155552671",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.overallSuccess).toBe(true);
  });

  it("POST /messages/test should reject invalid recipient email with 400", async () => {
    const res = await request(app)
      .post("/messages/test")
      .send({
        recipientEmail: "not-a-valid-email",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("status", "fail");
  });

  it("POST /messages/test should reject invalid phone format with 400", async () => {
    const res = await request(app)
      .post("/messages/test")
      .send({
        recipientPhone: "12345", // missing + and country code
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("status", "fail");
  });

  it("POST /messages/test should reject invalid service name with 400", async () => {
    const res = await request(app)
      .post("/messages/test")
      .send({
        service: "unknown_service",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("status", "fail");
  });

  it("POST /messages/test with JWT token should extract user email/phone when omitted", async () => {
    const testEmail = `tester_${Date.now()}@example.com`;
    const regRes = await request(app).post("/auth/register").send({
      name: "JWT Test User",
      email: testEmail,
      password: "Password123!",
    });

    const token = regRes.body?.data?.token || regRes.body?.data?.accessToken;
    expect(token).toBeDefined();

    const res = await request(app)
      .post("/messages/test")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service: "dev",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.overallSuccess).toBe(true);
  });
});
