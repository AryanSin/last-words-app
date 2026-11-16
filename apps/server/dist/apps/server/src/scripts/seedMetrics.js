"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../config/prisma"));
const seedMetrics = async () => {
    const existing = await prisma_1.default.systemMetric.findFirst();
    if (!existing) {
        await prisma_1.default.systemMetric.create({
            data: {},
        });
        console.log("System metrics initialized");
    }
};
seedMetrics()
    .catch(console.error)
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
