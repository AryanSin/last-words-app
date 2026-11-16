"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPushReminderService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const loggers_1 = require("../utils/loggers");
const pushNotificationService_1 = __importDefault(require("./pushNotificationService"));
/**
 * Executes the push notification reminder engine.
 * Sends warnings to users whose messages will be triggered within the week if they do not open the app.
 */
const runPushReminderService = async () => {
    const startDate = new Date();
    let cronJobExecution = {
        startedAt: startDate,
        jobName: "pushReminderService",
        status: "RUNNING",
    };
    const summary = {
        totalUsersChecked: 0,
        notificationsSent: 0,
        inactivityWarningsCount: 0,
        heartbeatRemindersCount: 0,
    };
    try {
        const usersWithDevices = await prisma_1.default.user.findMany({
            where: {
                archived: false,
                deviceTokens: {
                    some: {},
                },
            },
            select: {
                id: true,
                name: true,
                lastLoginAt: true,
                lastReminderSentAt: true,
                defaultTriggerAfterDays: true,
                deviceTokens: {
                    select: { token: true },
                },
                messages: {
                    where: {
                        status: client_1.MessageStatus.PENDING,
                    },
                    select: {
                        id: true,
                        title: true,
                        triggerAfterDays: true,
                    },
                },
            },
        });
        summary.totalUsersChecked = usersWithDevices.length;
        const now = Date.now();
        for (const user of usersWithDevices) {
            const tokens = user.deviceTokens.map((d) => d.token).filter(Boolean);
            if (tokens.length === 0)
                continue;
            const lastLogin = new Date(user.lastLoginAt).getTime();
            const daysPassed = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
            const pendingMessages = user.messages;
            let minDaysRemaining = Infinity;
            for (const msg of pendingMessages) {
                const threshold = msg.triggerAfterDays ?? user.defaultTriggerAfterDays ?? 365;
                const remaining = threshold - daysPassed;
                if (remaining < minDaysRemaining) {
                    minDaysRemaining = remaining;
                }
            }
            let shouldSendNotification = false;
            let notificationPayload = null;
            if (pendingMessages.length > 0 && minDaysRemaining <= 7 && minDaysRemaining >= 0) {
                shouldSendNotification = true;
                summary.inactivityWarningsCount++;
                const daysText = minDaysRemaining === 0 ? "today" : `in ${minDaysRemaining} day(s)`;
                notificationPayload = {
                    title: "Inactivity Alert: Vault Message Pending",
                    body: `You have ${pendingMessages.length} message(s) scheduled to be sent ${daysText} if you do not open the app. Tap to confirm you are safe.`,
                    data: {
                        type: "INACTIVITY_WARNING",
                        daysRemaining: minDaysRemaining,
                        messageCount: pendingMessages.length,
                    },
                };
            }
            else if (daysPassed >= 5) {
                const lastReminderTime = user.lastReminderSentAt ? new Date(user.lastReminderSentAt).getTime() : 0;
                const daysSinceLastReminder = Math.floor((now - lastReminderTime) / (1000 * 60 * 60 * 24));
                if (daysSinceLastReminder >= 2) {
                    shouldSendNotification = true;
                    summary.heartbeatRemindersCount++;
                    notificationPayload = {
                        title: "Last Words Check-In",
                        body: "You haven't checked in recently. Open Last Words to keep your inactivity timer reset.",
                        data: {
                            type: "HEARTBEAT_REMINDER",
                            daysInactive: daysPassed,
                        },
                    };
                }
            }
            if (shouldSendNotification && notificationPayload) {
                await pushNotificationService_1.default.sendPushNotification(tokens, notificationPayload);
                summary.notificationsSent += tokens.length;
                await prisma_1.default.user.update({
                    where: { id: user.id },
                    data: { lastReminderSentAt: new Date() },
                });
            }
        }
        (0, loggers_1.messageJobLogger)(`[PushReminderService] Checked ${summary.totalUsersChecked} mobile users. Dispatched ${summary.notificationsSent} push notifications (${summary.inactivityWarningsCount} imminent dispatch warnings, ${summary.heartbeatRemindersCount} heartbeat reminders).`);
        cronJobExecution = {
            ...cronJobExecution,
            successCount: summary.notificationsSent,
            failureCount: 0,
            completedAt: new Date(),
            status: "COMPLETED",
        };
    }
    catch (err) {
        loggers_1.logger.error("Push reminder service failed:", err);
        cronJobExecution = {
            ...cronJobExecution,
            completedAt: new Date(),
            status: `FAILED: ${String(err?.message || err).slice(0, 200)}`,
        };
    }
    await prisma_1.default.jobExecution.create({
        data: cronJobExecution,
    });
    return summary;
};
exports.runPushReminderService = runPushReminderService;
exports.default = exports.runPushReminderService;
