"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../app"));
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = __importDefault(require("../config/redis"));
async function testRateLimiters() {
    console.log("\n🧪 TESTING DEDICATED ROUTER RATE LIMITERS & GLOBAL RATE LIMITER...\n");
    const server = app_1.default.listen(3007, () => { });
    const BASE_URL = "http://localhost:3007";
    try {
        // 1. Register a test user
        const testEmail = `ratelimit_${Date.now()}@example.com`;
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Rate Limit User",
                email: testEmail,
                password: "Password123!",
            }),
        });
        const regData = await regRes.json();
        const token = regData?.data?.accessToken;
        console.log("1️⃣ Testing Auth Router Rate Limiter Headers on /auth/login...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: "Password123!",
            }),
        });
        console.log("   Status:", loginRes.status);
        console.log("   X-RateLimit-Global-Limit:", loginRes.headers.get("x-ratelimit-global-limit"));
        console.log("   X-RateLimit-Auth-Limit:", loginRes.headers.get("x-ratelimit-auth-limit"));
        console.log("   X-RateLimit-Auth-Remaining:", loginRes.headers.get("x-ratelimit-auth-remaining"));
        if (loginRes.headers.get("x-ratelimit-global-limit") === "300" &&
            loginRes.headers.get("x-ratelimit-auth-limit") === "20") {
            console.log("   ✅ Auth rate limiter headers verified (Auth limit: 20, Global limit: 300)!");
        }
        else {
            throw new Error("Auth rate limit headers mismatch");
        }
        console.log("\n2️⃣ Testing User Router Rate Limiter Headers on /users/me...");
        const userRes = await fetch(`${BASE_URL}/users/me`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("   Status:", userRes.status);
        console.log("   X-RateLimit-Users-Limit:", userRes.headers.get("x-ratelimit-users-limit"));
        console.log("   X-RateLimit-Users-Remaining:", userRes.headers.get("x-ratelimit-users-remaining"));
        if (userRes.headers.get("x-ratelimit-users-limit") === "60") {
            console.log("   ✅ User rate limiter verified (User limit: 60)!");
        }
        else {
            throw new Error("User rate limit headers mismatch");
        }
        console.log("\n3️⃣ Testing Message Router Rate Limiter Headers on /messages...");
        const msgRes = await fetch(`${BASE_URL}/messages`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("   Status:", msgRes.status);
        console.log("   X-RateLimit-Messages-Limit:", msgRes.headers.get("x-ratelimit-messages-limit"));
        console.log("   X-RateLimit-Messages-Remaining:", msgRes.headers.get("x-ratelimit-messages-remaining"));
        if (msgRes.headers.get("x-ratelimit-messages-limit") === "60") {
            console.log("   ✅ Message rate limiter verified (Message limit: 60)!");
        }
        else {
            throw new Error("Message rate limit headers mismatch");
        }
        console.log("\n4️⃣ Testing Metrics Router Rate Limiter Headers on /metrics/messages...");
        const metricsRes = await fetch(`${BASE_URL}/metrics/messages`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("   Status:", metricsRes.status);
        console.log("   X-RateLimit-Metrics-Limit:", metricsRes.headers.get("x-ratelimit-metrics-limit"));
        console.log("   X-RateLimit-Metrics-Remaining:", metricsRes.headers.get("x-ratelimit-metrics-remaining"));
        if (metricsRes.headers.get("x-ratelimit-metrics-limit") === "30") {
            console.log("   ✅ Metrics rate limiter verified (Metrics limit: 30)!");
        }
        else {
            throw new Error("Metrics rate limit headers mismatch");
        }
        console.log("\n5️⃣ Testing Job Router Rate Limiter Headers on /jobs/trigger-message...");
        const jobRes = await fetch(`${BASE_URL}/jobs/trigger-message`, {
            method: "POST",
        });
        console.log("   Status:", jobRes.status);
        console.log("   X-RateLimit-Jobs-Limit:", jobRes.headers.get("x-ratelimit-jobs-limit"));
        console.log("   X-RateLimit-Jobs-Remaining:", jobRes.headers.get("x-ratelimit-jobs-remaining"));
        if (jobRes.headers.get("x-ratelimit-jobs-limit") === "10") {
            console.log("   ✅ Job rate limiter verified (Job limit: 10)!");
        }
        else {
            throw new Error("Job rate limit headers mismatch");
        }
        console.log("\n🎉 ALL ROUTER & GLOBAL RATE LIMITER TESTS PASSED SUCCESSFULLY!\n");
    }
    catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
    finally {
        server.close();
        await prisma_1.default.$disconnect();
        redis_1.default.disconnect();
        process.exit(0);
    }
}
testRateLimiters();
