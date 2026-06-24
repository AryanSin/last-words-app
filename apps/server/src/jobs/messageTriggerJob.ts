import cron from "node-cron";
import { runMessageTriggerService } from "../services/messageTriggerService";

let isRunning = false;

const messageTriggerJob = cron.schedule("0 0 * * *", async () => {
  if (isRunning) return;

  isRunning = true;
  try {
    await runMessageTriggerService();
  } finally {
    isRunning = false;
  }
});

export default messageTriggerJob;
