"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailQueue = void 0;
const emailService_1 = require("../integrations/emailService");
const loggers_1 = require("../utils/loggers");
class EmailQueue {
    concurrency;
    running = 0;
    queue = [];
    jobStatusMap = new Map();
    maxHistory = 100;
    constructor(concurrency = 5) {
        this.concurrency = concurrency;
    }
    /**
     * Enqueue a mail sending job to run asynchronously in the background.
     * Resolves immediately with the unique job ID.
     */
    enqueueMail(options) {
        const jobId = `mail-job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const statusObj = {
            id: jobId,
            status: "queued",
            recipient: options.to,
            subject: options.subject,
            enqueuedAt: new Date().toISOString(),
        };
        if (this.jobStatusMap.size >= this.maxHistory) {
            const oldestKey = this.jobStatusMap.keys().next().value;
            if (oldestKey)
                this.jobStatusMap.delete(oldestKey);
        }
        this.jobStatusMap.set(jobId, statusObj);
        loggers_1.logger.info(`[EmailQueue] Queued test email job ${jobId} for ${options.to}`);
        this.queue.push({
            job: async () => {
                statusObj.status = "processing";
                statusObj.startedAt = new Date().toISOString();
                loggers_1.logger.info(`[EmailQueue] Starting background delivery for job ${jobId} to ${options.to}`);
                try {
                    let res;
                    if (options.customOptions) {
                        res = await (0, emailService_1.sendCustomEmail)(options.customOptions);
                    }
                    else {
                        res = await (0, emailService_1.sendEmail)(options.to, options.subject, options.content, options.senderName, options.recipientName);
                    }
                    statusObj.status = "completed";
                    statusObj.messageId = res.messageId;
                    statusObj.previewUrl = res.previewUrl;
                    statusObj.completedAt = new Date().toISOString();
                    loggers_1.logger.info(`[EmailQueue] Job ${jobId} successfully delivered! Message ID: ${res.messageId}`);
                    return res;
                }
                catch (err) {
                    statusObj.status = "failed";
                    statusObj.error = err?.message || String(err);
                    statusObj.completedAt = new Date().toISOString();
                    loggers_1.logger.error(`[EmailQueue] Job ${jobId} failed to deliver:`, err);
                    throw err;
                }
            },
            resolve: () => { },
            reject: () => { },
        });
        this.processNext();
        return jobId;
    }
    getJobStatus(jobId) {
        return this.jobStatusMap.get(jobId);
    }
    getRecentJobs() {
        return Array.from(this.jobStatusMap.values()).reverse();
    }
    /**
     * Synchronous job dispatch (waits for job completion before returning).
     */
    async add(job) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                job,
                resolve,
                reject,
            });
            this.processNext();
        });
    }
    async processNext() {
        if (this.running >= this.concurrency)
            return;
        const item = this.queue.shift();
        if (!item)
            return;
        this.running++;
        try {
            const result = await item.job();
            item.resolve(result);
        }
        catch (err) {
            item.reject(err);
        }
        finally {
            this.running--;
            this.processNext();
        }
    }
}
exports.emailQueue = new EmailQueue(5);
