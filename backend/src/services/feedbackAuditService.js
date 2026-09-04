import { getDatabasePool } from "../db/connection.js";

// Keep operational history separate from feedback text. This is a factual
// record of who changed a request and when; it never changes the feedback.
export async function writeFeedbackAuditEvent({ requestId, actorId = null, eventType, details = null, connection = null }) {
  const executor = connection || getDatabasePool();
  await executor.execute(
    `INSERT INTO feedback_audit_log (request_id, actor_id, event_type, details)
     VALUES (?, ?, ?, ?)`,
    [requestId, actorId, eventType, details],
  );
}
