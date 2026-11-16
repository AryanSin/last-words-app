"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../app"));
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = __importDefault(require("../config/redis"));
async function testBiometricCheckIn() {
    const server = app_1.default.listen(3009);
    const BASE_URL = "http://localhost:3009";
    try {
        const testEmail = `biotest_${Date.now()}@example.com`;
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Bio User",
                email: testEmail,
                password: "Password123!",
            }),
        });
        const regData = await regRes.json();
        const token = regData.data.accessToken;
        console.log("Testing POST /users/check-in with Biometric payload...");
        const checkInRes = await fetch(`${BASE_URL}/users/check-in`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                biometricVerified: true,
                authMethod: "BIOMETRIC",
            }),
        });
        const checkInData = await checkInRes.json();
        console.log("Check-in Response Status:", checkInRes.status);
        console.log("Check-in Response Data:", checkInData);
        if (checkInRes.status === 200 && checkInData.data?.lastLoginAt) {
            console.log("✅ Biometric check-in verified successfully!");
        }
        else {
            throw new Error(`Biometric check-in failed: ${JSON.stringify(checkInData)}`);
        }
    }
    catch (err) {
        console.error("Biometric test failed:", err);
        process.exit(1);
    }
    finally {
        server.close();
        await prisma_1.default.$disconnect();
        redis_1.default.disconnect();
        process.exit(0);
    }
}
testBiometricCheckIn();
