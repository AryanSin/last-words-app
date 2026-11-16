"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const app_1 = __importDefault(require("../app"));
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = __importDefault(require("../config/redis"));
const pushReminderService_1 = require("../services/pushReminderService");
async function testPushReminders() {
    console.log("\n🧪 TESTING PUSH NOTIFICATIONS & INACTIVITY REMINDERS...\n");
    const server = app_1.default.listen(3005, () => { });
    const BASE_URL = "http://localhost:3005";
    try {
        // 1. Create a test user who has mobile app & registered push token
        const testEmail1 = `push_urgent_${Date.now()}@example.com`;
        const regRes1 = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Urgent Push User",
                email: testEmail1,
                password: "Password123!",
            }),
        });
        const regData1 = await regRes1.json();
        const token1 = regData1?.data?.accessToken;
        const user1Id = regData1?.data?.user?.id;
        // Register device token for User 1
        const deviceToken1 = `device_expo_token_user1_${Date.now()}`;
        console.log("1️⃣ Registering device push token for User 1...");
        const regTokenRes = await fetch(`${BASE_URL}/users/push-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token1}`,
            },
            body: JSON.stringify({
                token: deviceToken1,
                platform: "ios",
            }),
        });
        const regTokenData = await regTokenRes.json();
        console.log("   Device token registration status:", regTokenRes.status, regTokenData.data?.message);
        if (regTokenRes.status !== 200)
            throw new Error("Failed to register push token");
        // Set User 1 last login to 10 days ago with a 14-day trigger (4 days remaining -> within the week!)
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        await prisma_1.default.user.update({
            where: { id: user1Id },
            data: { lastLoginAt: tenDaysAgo },
        });
        await prisma_1.default.message.create({
            data: {
                userId: user1Id,
                title: "Secret Family Vault",
                content: "Important access credentials",
                recipientEmail: "family@example.com",
                deliveryChannel: "EMAIL",
                status: client_1.MessageStatus.PENDING,
                triggerAfterDays: 14, // 14 - 10 = 4 days remaining!
            },
        });
        // 2. Create User 2: Inactive for 6 days, no imminent message, needs weekly check-in
        const testEmail2 = `push_inactive_${Date.now()}@example.com`;
        const regRes2 = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Inactive Push User",
                email: testEmail2,
                password: "Password123!",
            }),
        });
        const regData2 = await regRes2.json();
        const token2 = regData2?.data?.accessToken;
        const user2Id = regData2?.data?.user?.id;
        const deviceToken2 = `device_expo_token_user2_${Date.now()}`;
        await fetch(`${BASE_URL}/users/push-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token2}`,
            },
            body: JSON.stringify({
                token: deviceToken2,
                platform: "android",
            }),
        });
        const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
        await prisma_1.default.user.update({
            where: { id: user2Id },
            data: { lastLoginAt: sixDaysAgo },
        });
        // 3. Trigger push reminder service
        console.log("\n2️⃣ Running push reminder service...");
        const summary = await (0, pushReminderService_1.runPushReminderService)();
        console.log("   Push Reminder Summary:", summary);
        if (summary.inactivityWarningsCount >= 1 && summary.notificationsSent >= 2) {
            console.log("   ✅ Push notifications successfully dispatched for imminent weekly messages & heartbeat reminders!");
        }
        else {
            throw new Error(`Unexpected push reminder summary: ${JSON.stringify(summary)}`);
        }
        // 4. Test manual trigger endpoint POST /jobs/trigger-reminders
        console.log("\n3️⃣ Testing POST /jobs/trigger-reminders endpoint...");
        const triggerJobRes = await fetch(`${BASE_URL}/jobs/trigger-reminders`, {
            method: "POST",
        });
        const triggerJobData = await triggerJobRes.json();
        console.log("   Trigger Reminders Endpoint Status:", triggerJobRes.status, "Status:", triggerJobData.status);
        if (triggerJobRes.status !== 200)
            throw new Error("Failed to call /jobs/trigger-reminders");
        // 5. Test removing device push token
        console.log("\n4️⃣ Testing DELETE /users/push-token (Logout cleanup)...");
        const removeTokenRes = await fetch(`${BASE_URL}/users/push-token`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token1}`,
            },
            body: JSON.stringify({
                token: deviceToken1,
            }),
        });
        const removeTokenData = await removeTokenRes.json();
        console.log("   Remove Token Status:", removeTokenRes.status, removeTokenData.data?.message);
        if (removeTokenRes.status !== 200)
            throw new Error("Failed to remove push token");
        console.log("\n🎉 ALL PUSH NOTIFICATION & REMINDER TESTS COMPLETED SUCCESSFULLY!\n");
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
testPushReminders();
