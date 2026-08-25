import { MessageStatus } from "@prisma/client";
import app from "../app";
import prisma from "../config/prisma";
import redis from "../config/redis";

async function testSwitchStatusEndpoint() {
  console.log("\n🧪 TESTING GET /users/switch-status ENDPOINT...\n");

  const server = app.listen(3006, () => {});
  const BASE_URL = "http://localhost:3006";

  try {
    // 1. Create a test user with default 365 days
    const testEmail = `switch_status_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Switch Status User",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const regData = await regRes.json();
    const token = regData?.data?.accessToken;
    const userId = regData?.data?.user?.id;

    // 2. Test initial status with NO pending messages
    console.log("1️⃣ Testing switch status with NO messages (should return default 365d)...");
    const statusRes1 = await fetch(`${BASE_URL}/users/switch-status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData1 = await statusRes1.json();
    console.log("   Status 1 Response:", statusData1.data);

    if (
      statusRes1.status === 200 &&
      statusData1.data.daysRemaining === 365 &&
      statusData1.data.hasPendingMessages === false &&
      statusData1.data.soonestMessage === null
    ) {
      console.log("   ✅ Default account threshold properly returned when no pending messages exist.");
    } else {
      throw new Error(`Unexpected status 1: ${JSON.stringify(statusData1)}`);
    }

    // 3. Set last login to 4 days ago
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: fourDaysAgo },
    });

    // Create Message A (60 days)
    const msgA = await prisma.message.create({
      data: {
        userId,
        title: "Message A (60 Days)",
        content: "Content A",
        recipientEmail: "a@example.com",
        deliveryChannel: "EMAIL",
        status: MessageStatus.PENDING,
        triggerAfterDays: 60,
      },
    });

    // Create Message B (10 days) -> 10 - 4 = 6 days remaining!
    const msgB = await prisma.message.create({
      data: {
        userId,
        title: "Message B (10 Days)",
        content: "Content B",
        recipientEmail: "b@example.com",
        deliveryChannel: "EMAIL",
        status: MessageStatus.PENDING,
        triggerAfterDays: 10,
      },
    });

    console.log("\n2️⃣ Testing switch status with Message A (60d) and Message B (10d) after 4 days inactivity...");
    const statusRes2 = await fetch(`${BASE_URL}/users/switch-status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData2 = await statusRes2.json();
    console.log("   Status 2 Response:", statusData2.data);

    if (
      statusRes2.status === 200 &&
      statusData2.data.daysRemaining === 6 && // 10 - 4 = 6
      statusData2.data.soonestMessage?.id === msgB.id &&
      statusData2.data.isUrgent === true
    ) {
      console.log("   ✅ Soonest message countdown properly prioritized (6 days left for Message B)!");
    } else {
      throw new Error(`Unexpected status 2: ${JSON.stringify(statusData2)}`);
    }

    // 4. Update Message B to 90 days -> Message A (60d) should now become the soonest (60 - 4 = 56 days)
    console.log("\n3️⃣ Updating Message B to 90 days. Message A (60d) should now be soonest (56 days left)...");
    await prisma.message.update({
      where: { id: msgB.id },
      data: { triggerAfterDays: 90 },
    });

    const statusRes3 = await fetch(`${BASE_URL}/users/switch-status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData3 = await statusRes3.json();
    console.log("   Status 3 Response:", statusData3.data);

    if (
      statusRes3.status === 200 &&
      statusData3.data.daysRemaining === 56 && // 60 - 4 = 56
      statusData3.data.soonestMessage?.id === msgA.id &&
      statusData3.data.isUrgent === false
    ) {
      console.log("   ✅ Switch status dynamically updated to Message A (56 days remaining)!");
    } else {
      throw new Error(`Unexpected status 3: ${JSON.stringify(statusData3)}`);
    }

    console.log("\n🎉 ALL SWITCH STATUS API TESTS COMPLETED SUCCESSFULLY!\n");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    server.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  }
}

testSwitchStatusEndpoint();
