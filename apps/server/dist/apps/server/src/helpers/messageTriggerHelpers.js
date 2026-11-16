"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldTriggerMessage = void 0;
const shouldTriggerMessage = (message, user) => {
    const triggerAfterDays = message.triggerAfterDays ?? user.defaultTriggerAfterDays;
    if (!triggerAfterDays)
        return false;
    const daysPassedSinceLastLogin = Math.floor((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysPassedSinceLastLogin > triggerAfterDays;
};
exports.shouldTriggerMessage = shouldTriggerMessage;
