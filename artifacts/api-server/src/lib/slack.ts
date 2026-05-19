import { logger } from "./logger";

export async function sendSlackDigest(webhookUrl: string, content: string): Promise<string> {
  const payload = {
    text: content,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: content,
        },
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} ${text}`);
  }

  logger.info("Slack digest sent successfully");
  return `slack-${Date.now()}`;
}
