function getMattermostUsername(email) {
  const username = email?.split("@")[0]?.trim();
  return username ? username.replace(/[^a-zA-Z0-9._-]/g, "") : null;
}

export async function sendFeedbackRequestNotification(feedbackRequest) {
  const webhookUrl = process.env.MATTERMOST_WEBHOOK_URL;

  if (!webhookUrl) {
    return { sent: false, reason: "MATTERMOST_WEBHOOK_URL is not configured" };
  }

  const giverUsername = getMattermostUsername(feedbackRequest.giverEmail);

  if (!giverUsername) {
    return { sent: false, reason: "Feedback giver has no Mattermost username" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text:
        `@${giverUsername}, **${feedbackRequest.requesterName}** requested ` +
        `**${feedbackRequest.templateName}** from you.`,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Mattermost webhook failed (${response.status}): ${responseText}`,
    );
  }

  return { sent: true };
}
