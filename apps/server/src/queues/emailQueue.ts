type QueueJob<T> = () => Promise<T>;

class EmailQueue {
  private concurrency: number;
  private running = 0;
  private queue: {
    job: QueueJob<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }[] = [];

  constructor(concurrency = 5) {
    this.concurrency = concurrency;
  }

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
