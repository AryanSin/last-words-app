import {
  CustomEmailOptions,
  sendCustomEmail,
  sendEmail,
} from "../integrations/emailService";
import { logger } from "../utils/loggers";

type QueueJob<T> = () => Promise<T>;

export interface QueuedMailOptions {
  to: string;
  subject: string;
  content: string;
  senderName?: string | null;
  recipientName?: string | null;
  customOptions?: CustomEmailOptions;
}

export interface QueuedMailJobStatus {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  recipient: string;
  subject?: string;
  enqueuedAt: string;
  startedAt?: string;
  completedAt?: string;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

class EmailQueue {
  private concurrency: number;
  private running = 0;
  private queue: {
    job: QueueJob<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }[] = [];

  private jobStatusMap = new Map<string, QueuedMailJobStatus>();
  private readonly maxHistory = 100;

  constructor(concurrency = 5) {
    this.concurrency = concurrency;
  }

  /**
   * Enqueue a mail sending job to run asynchronously in the background.
   * Resolves immediately with the unique job ID.
   */
  enqueueMail(options: QueuedMailOptions): string {
    const jobId = `mail-job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const statusObj: QueuedMailJobStatus = {
      id: jobId,
      status: "queued",
      recipient: options.to,
      subject: options.subject,
      enqueuedAt: new Date().toISOString(),
    };

    if (this.jobStatusMap.size >= this.maxHistory) {
      const oldestKey = this.jobStatusMap.keys().next().value;
      if (oldestKey) this.jobStatusMap.delete(oldestKey);
    }
    this.jobStatusMap.set(jobId, statusObj);

    logger.info(`[EmailQueue] Queued test email job ${jobId} for ${options.to}`);

    this.queue.push({
      job: async () => {
        statusObj.status = "processing";
        statusObj.startedAt = new Date().toISOString();
        logger.info(`[EmailQueue] Starting background delivery for job ${jobId} to ${options.to}`);

        try {
          let res: { messageId: string; previewUrl?: string | false };
          if (options.customOptions) {
            res = await sendCustomEmail(options.customOptions);
          } else {
            res = await sendEmail(
              options.to,
              options.subject,
              options.content,
              options.senderName,
              options.recipientName,
            );
          }

          statusObj.status = "completed";
          statusObj.messageId = res.messageId;
          statusObj.previewUrl = res.previewUrl;
          statusObj.completedAt = new Date().toISOString();

          logger.info(`[EmailQueue] Job ${jobId} successfully delivered! Message ID: ${res.messageId}`);
          return res;
        } catch (err: any) {
          statusObj.status = "failed";
          statusObj.error = err?.message || String(err);
          statusObj.completedAt = new Date().toISOString();
          logger.error(`[EmailQueue] Job ${jobId} failed to deliver:`, err);
          throw err;
        }
      },
      resolve: () => {},
      reject: () => {},
    });

    this.processNext();
    return jobId;
  }

  getJobStatus(jobId: string): QueuedMailJobStatus | undefined {
    return this.jobStatusMap.get(jobId);
  }

  getRecentJobs(): QueuedMailJobStatus[] {
    return Array.from(this.jobStatusMap.values()).reverse();
  }

  /**
   * Synchronous job dispatch (waits for job completion before returning).
   */
  async add<T>(job: QueueJob<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        job,
        resolve,
        reject,
      });

      this.processNext();
    });
  }

  private async processNext() {
    if (this.running >= this.concurrency) return;

    const item = this.queue.shift();

    if (!item) return;

    this.running++;

    try {
      const result = await item.job();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      this.running--;

      this.processNext();
    }
  }
}

export const emailQueue = new EmailQueue(5);
