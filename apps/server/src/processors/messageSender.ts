import { sendEmail } from "../integrations/emailService";
import { minimalMessageWithUser } from "../interfaces/messageInterfaces";
import { emailQueue } from "../queues/emailQueue";
import { logger, messageJobLogger } from "../utils/loggers";

const logMessageJobInfo = (argString = "", ...args: unknown[]) => {
  logger.info(argString, ...args);
  messageJobLogger(argString, ...args);
};

const logMessageJobError = (argString = "", ...args: unknown[]) => {
  logger.error(argString, ...args);
  messageJobLogger(argString, ...args);
};

export const sendMessages = async (messages: minimalMessageWithUser[]) => {
  const results = await Promise.allSettled(
    messages.map((message) =>
      emailQueue.add(async () => {
        logMessageJobInfo("Processing message: ", message.id);

        await sendEmail(
          message.user.email,
          "You have a new message",
          message.content,
        );

        return message.id;
      }),
    ),
  );

  const successfullySentMessages: number[] = [];
  const failedMessages: { id: number; error: string }[] = [];

  results.forEach((res, index) => {
    if (res.status === "fulfilled") {
      successfullySentMessages.push(res.value);
      logMessageJobInfo("Successfully sent mail for ", res.value);
    } else {
      failedMessages.push({
        id: messages[index].id,
        error: String(res.reason),
      });
      logMessageJobError(
        "Failed to send mail for ",
        messages[index].id,
        "\n due to error: ",
        res.reason,
      );
    }
  });

  return {
    successfullySentMessages,
    failedMessages,
  };
};
