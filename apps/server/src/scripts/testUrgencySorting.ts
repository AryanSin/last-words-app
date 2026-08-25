import app from "../app";
import prisma from "../config/prisma";
import redis from "../config/redis";

async function testUrgencySorting() {
  console.log("\n🧪 TESTING URGENCY SORTING AND PAGINATION...\n");

  const server = app.listen(3003, () => {});
  const BASE_URL = "http://localhost:3003";

  try {
    // 1. Create a user
    const testEmail = `urgency_test_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Urgency Tester",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const regData = await regRes.json();
    const token = regData?.data?.accessToken || regData?.data?.token;
    const userId = regData?.data?.user?.id;

    console.log(`User created: ID ${userId}`);

    // Update user defaultTriggerAfterDays = 100
    await prisma.user.update({
      where: { id: userId },
      data: { defaultTriggerAfterDays: 100 },
    });

    // 2. Create messages with various triggerAfterDays:
    // Msg A: PENDING, triggerAfterDays = 30
    const msgA = await prisma.message.create({
      data: {
        userId,
        title: "Message A (30 days)",
        content: "Content A",
        recipientEmail: "a@example.com",
        deliveryChannel: "EMAIL",
        status: "PENDING",
        triggerAfterDays: 30,
      },
    });

    // Msg B: PENDING, triggerAfterDays = 5 (Most urgent!)
    const msgB = await prisma.message.create({
      data: {
        userId,
        title: "Message B (5 days)",
        content: "Content B",
        recipientEmail: "b@example.com",
        deliveryChannel: "EMAIL",
        status: "PENDING",
        triggerAfterDays: 5,
      },
    });

    // Msg C: PENDING, triggerAfterDays = null (Fallback to user default = 100 days)
    const msgC = await prisma.message.create({
      data: {
        userId,
        title: "Message C (Default 100 days)",
        content: "Content C",
        recipientEmail: "c@example.com",
        deliveryChannel: "EMAIL",
        status: "PENDING",
        triggerAfterDays: null,
      },
    });

    // Msg D: SENT (Delivered, should be at bottom)
    const msgD = await prisma.message.create({
      data: {
        userId,
        title: "Message D (Delivered)",
        content: "Content D",
        recipientEmail: "d@example.com",
        deliveryChannel: "EMAIL",
        status: "SENT",
        triggerAfterDays: 2,
        sentAt: new Date(),
      },
    });

    // Msg E: FAILED (Failed, should be after pending)
    const msgE = await prisma.message.create({
      data: {
        userId,
        title: "Message E (Failed)",
        content: "Content E",
        recipientEmail: "e@example.com",
        deliveryChannel: "EMAIL",
        status: "FAILED",
        triggerAfterDays: 1,
      },
    });

    // 3. Fetch Page 1 (limit = 10)
    console.log("\n📥 Fetching all messages...");
    const res = await fetch(`${BASE_URL}/messages?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    const list = json.data;

    console.log("Returned order:");
    list.forEach((m: any, idx: number) => {
      console.log(
        `  ${idx + 1}. [${m.status}] "${m.title}" -> daysRemaining: ${m.daysRemaining}, triggerAfterDays: ${m.triggerAfterDays}`,
      );
    });

    // Expected order:
    // 1. Message B (5 days)
    // 2. Message A (30 days)
    // 3. Message C (100 days)
    // 4. Message E or D (Non-pending)
    // 5. Message D or E (Non-pending)
    const titles = list.map((m: any) => m.title);
    if (
      titles[0] === "Message B (5 days)" &&
      titles[1] === "Message A (30 days)" &&
      titles[2] === "Message C (Default 100 days)"
    ) {
      console.log("\n✅ Urgency sorting order PASSED!");
    } else {
      console.error("\n❌ Urgency sorting order FAILED!");
      throw new Error("Sorting order mismatch");
    }

    // 4. Test Pagination (limit = 2)
    console.log("\n📄 Testing Pagination (limit = 2)...");
    const page1Res = await fetch(`${BASE_URL}/messages?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const page1Data = await page1Res.json();
    console.log("Page 1 items:", page1Data.data.map((m: any) => m.title));

    const page2Res = await fetch(`${BASE_URL}/messages?page=2&limit=2`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const page2Data = await page2Res.json();
    console.log("Page 2 items:", page2Data.data.map((m: any) => m.title));

    if (
      page1Data.data.length === 2 &&
      page1Data.data[0].title === "Message B (5 days)" &&
      page1Data.data[1].title === "Message A (30 days)" &&
      page2Data.data.length === 2 &&
      page2Data.data[0].title === "Message C (Default 100 days)"
    ) {
      console.log("✅ Pagination with backend urgency sorting PASSED!");
    } else {
      throw new Error("Pagination test failed");
    }
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

testUrgencySorting();
