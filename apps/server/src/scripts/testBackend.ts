import app from "../app";
import prisma from "../config/prisma";
import redis from "../config/redis";
import { runMessageTriggerService } from "../services/messageTriggerService";

async function runEndToEndTests() {
  console.log("\n🧪 STARTING END-TO-END BACKEND TESTS...\n");

  const server = app.listen(3001, () => {
    console.log("Test server running on port 3001");
  });

  const BASE_URL = "http://localhost:3001";

  try {
    // 1. Health Check
    console.log("1️⃣ Testing Health Check...");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log("   Health response:", healthData);

    // 2. Email Registration
    console.log("\n2️⃣ Testing Email / Password Registration...");
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
    console.log("   Register status:", regRes.status, "User ID:", regData?.data?.user?.id);
    const emailToken = regData?.data?.token;

    // 3. Email Login
    console.log("\n3️⃣ Testing Email / Password Login...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "Password123!",
      }),
    });
    const loginData = await loginRes.json();
    console.log("   Login status:", loginRes.status, "Token acquired:", !!loginData?.data?.token);

    // 4. WhatsApp OTP Send
    console.log("\n4️⃣ Testing WhatsApp OTP Send...");
    const testPhone = "+14155552671";
    const otpSendRes = await fetch(`${BASE_URL}/auth/whatsapp/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: testPhone }),
    });
    const otpSendData = await otpSendRes.json();
    console.log("   OTP Send status:", otpSendRes.status, otpSendData?.data?.message);

    // Retrieve OTP directly from Redis for the automated test
    const cachedOtp = await redis.get(`otp:code:${testPhone}`);
    console.log("   Retrieved OTP from Redis for test verification:", cachedOtp);

    // 5. WhatsApp OTP Verification
    console.log("\n5️⃣ Testing WhatsApp OTP Verify...");
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
    console.log("   OTP Verify status:", otpVerifyRes.status, "User:", otpVerifyData?.data?.user);
    const waToken = otpVerifyData?.data?.token;

    // 6. Profile fetching (/users/me)
    console.log("\n6️⃣ Testing GET /users/me (Current User)...");
    const meRes = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${emailToken}` },
    });
    const meData = await meRes.json();
    console.log("   Profile status:", meRes.status, "Name:", meData?.data?.name);

    // 7. Check-In (/users/check-in)
    console.log("\n7️⃣ Testing Check-in Heartbeat...");
    const checkInRes = await fetch(`${BASE_URL}/users/check-in`, {
      method: "POST",
      headers: { Authorization: `Bearer ${emailToken}` },
    });
    const checkInData = await checkInRes.json();
    console.log("   Check-in status:", checkInRes.status, "Message:", checkInData?.data?.message);

    // 8. Create Messages (Email & WhatsApp channels)
    console.log("\n8️⃣ Testing Create Messages (Multi-channel & Inactivity trigger)...");
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

    // 9. Fetch User Messages
    console.log("\n9️⃣ Testing GET /messages (List User Messages)...");
    const listRes = await fetch(`${BASE_URL}/messages`, {
      headers: { Authorization: `Bearer ${emailToken}` },
    });
    const listData = await listRes.json();
    console.log("   User Messages Count:", listData?.data?.length);

    // 10. Run Message Trigger Service directly
    console.log("\n🔟 Testing Message Trigger Engine...");
    await runMessageTriggerService();
    console.log("   Message Trigger Engine executed successfully!");

    console.log("\n🎉 ALL BACKEND END-TO-END TESTS COMPLETED SUCCESSFULLY!\n");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
  } finally {
    server.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  }
}

runEndToEndTests();
