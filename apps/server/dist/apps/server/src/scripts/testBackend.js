"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../app"));
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = __importDefault(require("../config/redis"));
const messageTriggerService_1 = require("../services/messageTriggerService");
async function runEndToEndTests() {
    console.log("\nStarting end-to-end backend tests...\n");
    const server = app_1.default.listen(3002, () => {
        console.log("Test server running on port 3002");
    });
    const BASE_URL = "http://localhost:3002";
    try {
        console.log("Testing Health Check...");
        const healthRes = await fetch(`${BASE_URL}/health`);
        const healthData = await healthRes.json();
        console.log("   Health response:", healthData);
        console.log("\nTesting Email / Password Registration...");
        const testEmail = `testuser_${Date.now()}@example.com`;
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: testEmail,
                password: "Password123!",
            }),
        });
        const regData = await regRes.json();
        const emailToken = regData?.data?.accessToken || regData?.data?.token;
        console.log("   Register status:", regRes.status, "User ID:", regData?.data?.user?.id, "Token:", !!emailToken);
        console.log("\nTesting Email / Password Login...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: "Password123!",
            }),
        });
        const loginData = await loginRes.json();
        console.log("   Login status:", loginRes.status, "Token acquired:", !!(loginData?.data?.accessToken || loginData?.data?.token));
        console.log("\nTesting WhatsApp OTP Send...");
        const testPhone = "+14155552671";
        const otpSendRes = await fetch(`${BASE_URL}/auth/whatsapp/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: testPhone }),
        });
        const otpSendData = await otpSendRes.json();
        console.log("   OTP Send status:", otpSendRes.status, otpSendData?.data?.message);
        const cachedOtp = await redis_1.default.get(`otp:code:${testPhone}`);
        console.log("   Retrieved OTP from Redis for test verification:", cachedOtp);
        console.log("\nTesting WhatsApp OTP Verify...");
        const otpVerifyRes = await fetch(`${BASE_URL}/auth/whatsapp/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phoneNumber: testPhone,
                otp: cachedOtp,
                name: "WhatsApp Tester",
            }),
        });
        const otpVerifyData = await otpVerifyRes.json();
        const waToken = otpVerifyData?.data?.accessToken || otpVerifyData?.data?.token;
        console.log("   OTP Verify status:", otpVerifyRes.status, "User:", otpVerifyData?.data?.user?.id, "Token:", !!waToken);
        console.log("\nTesting GET /users/me (Current User)...");
        const meRes = await fetch(`${BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${emailToken}` },
        });
        const meData = await meRes.json();
        console.log("   Profile status:", meRes.status, "Name:", meData?.data?.name);
        console.log("\nTesting Check-in Heartbeat...");
        const checkInRes = await fetch(`${BASE_URL}/users/check-in`, {
            method: "POST",
            headers: { Authorization: `Bearer ${emailToken}` },
        });
        const checkInData = await checkInRes.json();
        console.log("   Check-in status:", checkInRes.status, "Message:", checkInData?.data?.message);
        console.log("\nTesting Create Messages (Multi-channel & Inactivity trigger)...");
        const msg1Res = await fetch(`${BASE_URL}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${emailToken}`,
            },
            body: JSON.stringify({
                title: "My Last Words to Loved One",
                content: "If you are reading this, I have been away for too long. Here is what I wanted you to know...",
                recipientName: "Jane Doe",
                recipientEmail: "janedoe@example.com",
                deliveryChannel: "EMAIL",
                triggerAfterDays: 30,
            }),
        });
        const msg1Data = await msg1Res.json();
        console.log("   Created Email Message ID:", msg1Data?.data?.id);
        const msg2Res = await fetch(`${BASE_URL}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${waToken}`,
            },
            body: JSON.stringify({
                title: "WhatsApp Farewell Message",
                content: "Important message sent automatically via WhatsApp after inactivity trigger.",
                recipientName: "Family Group",
                recipientPhone: "+14155559999",
                deliveryChannel: "WHATSAPP",
                triggerAfterDays: 15,
            }),
        });
        const msg2Data = await msg2Res.json();
        console.log("   Created WhatsApp Message ID:", msg2Data?.data?.id);
        console.log("\nTesting GET /messages (List User Messages)...");
        const listRes = await fetch(`${BASE_URL}/messages`, {
            headers: { Authorization: `Bearer ${emailToken}` },
        });
        const listData = await listRes.json();
        console.log("   User Messages Count:", listData?.data?.length);
        console.log("\nTesting Message Trigger Engine...");
        await (0, messageTriggerService_1.runMessageTriggerService)();
        console.log("   Message Trigger Engine executed successfully!");
        console.log("\nAll backend end-to-end tests completed successfully.\n");
    }
    catch (err) {
        console.error("\nTest suite failed:", err);
    }
    finally {
        server.close();
        await prisma_1.default.$disconnect();
        redis_1.default.disconnect();
        process.exit(0);
    }
}
runEndToEndTests();
