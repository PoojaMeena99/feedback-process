function getMattermostUsername(name) {
  const username = name?.trim().split(/\s+/)[0]?.toLowerCase();
  return username ? username.replace(/[^a-zA-Z0-9._-]/g, "") : null;
}

async function sendMattermostMessage(text) {
  const webhookUrl = process.env.MATTERMOST_WEBHOOK_URL;

  if (!webhookUrl) {
    return { sent: false, reason: "MATTERMOST_WEBHOOK_URL is not configured" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Mattermost webhook failed (${response.status}): ${responseText}`,
    );
  }

  return { sent: true };
}

export async function sendFeedbackRequestNotification(feedbackRequest) {
  const giverUsername = getMattermostUsername(feedbackRequest.giverName);

  if (!giverUsername) {
    return { sent: false, reason: "Feedback giver has no Mattermost username" };
  }

  return sendMattermostMessage(
    `@${giverUsername}, **${feedbackRequest.requesterName}** requested ` +
      `**${feedbackRequest.templateName}** from you.`,
  );
}

export async function sendFeedbackSubmittedNotification(feedbackRequest) {
  const requesterUsername = getMattermostUsername(
    feedbackRequest.requesterName,
  );

  if (!requesterUsername) {
    return { sent: false, reason: "Requester has no Mattermost username" };
  }

  return sendMattermostMessage(
    `@${requesterUsername}, **${feedbackRequest.giverName}** submitted your ` +
      `**${feedbackRequest.templateName}**. Open Feedback Hub and select ` +
      `**View** to read the feedback.`,
  );
}
