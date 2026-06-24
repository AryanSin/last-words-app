export const buildMessageEmail = (
  subject: string = "You have a new message",
  content: string,
) => {
  return {
    subject: subject,
    html: `
      <h1>Last Words</h1>

      <p>A message has been released for you.</p>

      <blockquote>
        ${content}
      </blockquote>
    `,
  };
};
