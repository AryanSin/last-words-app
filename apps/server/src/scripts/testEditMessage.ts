import { MessageStatus } from "@prisma/client";
import app from "../app";
import prisma from "../config/prisma";
import redis from "../config/redis";

async function testEditMessageRules() {
  console.log("\n🧪 TESTING EDIT MESSAGE RULES...\n");

  const server = app.listen(3004, () => {});
  const BASE_URL = "http://localhost:3004";

  try {
    // 1. Create a test user
    const testEmail = `edit_test_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Edit Tester",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const regData = await regRes.json();
    const token = regData?.data?.accessToken;
    const userId = regData?.data?.user?.id;

    // 2. Create a PENDING message
    const pendingMsg = await prisma.message.create({
      data: {
        userId,
        title: "Initial Pending Title",
        content: "Initial Content",
        recipientEmail: "pending@example.com",
        deliveryChannel: "EMAIL",
        status: MessageStatus.PENDING,
        triggerAfterDays: 30,
      },
    });

    // Edit PENDING message -> Should SUCCEED
    console.log("1️⃣ Testing editing a PENDING message...");
    const editPendingRes = await fetch(`${BASE_URL}/messages/${pendingMsg.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Updated Pending Title",
        content: "Updated Content",
        triggerAfterDays: 14,
      }),
    });
    const editPendingData = await editPendingRes.json();
    console.log("   Edit Pending status:", editPendingRes.status);
    if (editPendingRes.status === 200 && editPendingData.data.title === "Updated Pending Title") {
      console.log("   ✅ PENDING message successfully updated!");
    } else {
      throw new Error(`Failed to update pending message: ${JSON.stringify(editPendingData)}`);
    }

    // 3. Create a FAILED message
    const failedMsg = await prisma.message.create({
      data: {
        userId,
        title: "Failed Delivery Message",
        content: "Content with bad address",
        recipientEmail: "bad@example.com",
        deliveryChannel: "EMAIL",
        status: MessageStatus.FAILED,
        failedAttempts: 3,
        lastError: "SMTP 550 User not found",
        triggerAfterDays: 10,
      },
    });

    // Edit FAILED message -> Should SUCCEED and RESET to PENDING
    console.log("\n2️⃣ Testing editing a FAILED message (should reset to PENDING)...");
    const editFailedRes = await fetch(`${BASE_URL}/messages/${failedMsg.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientEmail: "corrected@example.com",
      }),
    });
    const editFailedData = await editFailedRes.json();
    console.log("   Edit Failed status:", editFailedRes.status, "New Status:", editFailedData?.data?.status);

    const reloadedFailed = await prisma.message.findUnique({ where: { id: failedMsg.id } });
    if (
      editFailedRes.status === 200 &&
      reloadedFailed?.status === MessageStatus.PENDING &&
      reloadedFailed.failedAttempts === 0 &&
      reloadedFailed.lastError === null &&
      reloadedFailed.recipientEmail === "corrected@example.com"
    ) {
      console.log("   ✅ FAILED message successfully updated and reset to PENDING!");
    } else {
      throw new Error(`Failed message reset failed: ${JSON.stringify(reloadedFailed)}`);
    }

    // 4. Create a SENT (Delivered) message
    const deliveredMsg = await prisma.message.create({
      data: {
        userId,
        title: "Delivered Message",
        content: "Already delivered content",
        recipientEmail: "delivered@example.com",
        deliveryChannel: "EMAIL",
        status: MessageStatus.SENT,
        sentAt: new Date(),
      },
    });

    // Edit SENT message -> Should FAIL with 400
    console.log("\n3️⃣ Testing editing a DELIVERED message (should be rejected)...");
    const editDeliveredRes = await fetch(`${BASE_URL}/messages/${deliveredMsg.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Attempted Edit on Delivered Message",
      }),
    });
    const editDeliveredData = await editDeliveredRes.json();
    console.log("   Edit Delivered status:", editDeliveredRes.status, "Message:", editDeliveredData?.message);
    if (editDeliveredRes.status === 400) {
      console.log("   ✅ DELIVERED message editing properly rejected with 400 Bad Request!");
    } else {
      throw new Error("Delivered message should not be editable");
    }

    console.log("\n🎉 ALL EDIT MESSAGE RULE TESTS PASSED SUCCESSFULLY!\n");
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

testEditMessageRules();
