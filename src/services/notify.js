// Email notification helper.
// Talks to the backend's Gmail-based /api/notify/* routes (see server/mailer.mjs).
// All calls fail "silently" from the caller's point of view (errors are caught and
// logged) so a missing SMTP configuration never blocks the core lost & found workflow.

import { readList, readValue, writeList } from "./store";
import { addNotification } from "./notifications";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Below this AI match score, we don't consider it worth emailing someone about.
export const MATCH_ALERT_THRESHOLD = 60;

const NOTIFIED_MATCHES_KEY = "notifiedMatches";

async function post(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Email request failed.");
  return data;
}

export function getCurrentUserEmail() {
  const currentUser = readValue("currentUser", null);
  return currentUser?.email || "";
}

function alreadyNotified(lostItemId, foundItemId) {
  const sent = readList(NOTIFIED_MATCHES_KEY);
  return sent.includes(`${lostItemId}:${foundItemId}`);
}

function markNotified(lostItemId, foundItemId) {
  const sent = readList(NOTIFIED_MATCHES_KEY);
  writeList(NOTIFIED_MATCHES_KEY, [...sent, `${lostItemId}:${foundItemId}`]);
}

/**
 * Send a "possible match" email to the owner of a lost item, once per
 * lost/found item pair, and only if the AI match score clears the threshold.
 */
export async function sendMatchAlert({ lostItem, foundItem, score, reason }) {
  if (!lostItem?.reporterEmail) return { skipped: "no-reporter-email" };
  if ((score ?? 0) < MATCH_ALERT_THRESHOLD) return { skipped: "below-threshold" };
  if (alreadyNotified(lostItem.id, foundItem.id)) return { skipped: "already-notified" };

  try {
    await post("/api/notify/match-alert", {
      to: lostItem.reporterEmail,
      lostItem,
      foundItem,
      score,
      reason,
    });
    markNotified(lostItem.id, foundItem.id);
    addNotification({
      userEmail: lostItem.reporterEmail,
      type: "MATCH_FOUND",
      title: "Potential match found",
      message: `${foundItem.title || "A found item"} may match your lost report (${score}%).`,
      relatedId: foundItem.id,
    });
    return { sent: true };
  } catch (error) {
    console.warn("Match alert email not sent:", error.message);
    addNotification({
      userEmail: lostItem.reporterEmail,
      type: "MATCH_FOUND",
      title: "Potential match found",
      message: `${foundItem.title || "A found item"} may match your lost report (${score}%). Email delivery failed: ${error.message}`,
      relatedId: foundItem.id,
    });
    return { error: error.message };
  }
}

/**
 * Compare one found item against every active lost item (via the existing
 * AI matching endpoint) and email the owner of every lost item that scores
 * above the threshold. Used when a found item becomes available for matching.
 */
export async function checkAndNotifyForNewFoundItem(foundItem, matchItemsFn) {
  const activeLostItems = readList("lostItems").filter(
    (item) => !["Resolved", "Claim Approved"].includes(item.status) && item.reporterEmail
  );

  const results = [];
  for (const lostItem of activeLostItems) {
    try {
      const { matches = [] } = await matchItemsFn(lostItem, [foundItem]);
      const bestMatch = matches.find((match) => String(match.candidateId) === String(foundItem.id));
      if (bestMatch) {
        results.push(await sendMatchAlert({ lostItem, foundItem, score: bestMatch.score, reason: bestMatch.reason }));
      }
    } catch (error) {
      console.warn(`AI matching failed for lost item ${lostItem.id}:`, error.message);
    }
  }
  return results;
}

/**
 * Compare a newly submitted lost item against found items already available
 * for matching, and email the reporter immediately if a good match exists.
 */
export async function checkAndNotifyForNewLostItem(lostItem, matchItemsFn) {
  if (!lostItem?.reporterEmail) return [];
  const availableFoundItems = readList("foundItems").filter((item) => item.status === "Available for Matching");
  if (!availableFoundItems.length) return [];

  try {
    const { matches = [] } = await matchItemsFn(lostItem, availableFoundItems);
    const results = [];
    for (const match of matches) {
      const foundItem = availableFoundItems.find((item) => String(item.id) === String(match.candidateId));
      if (foundItem) {
        results.push(await sendMatchAlert({ lostItem, foundItem, score: match.score, reason: match.reason }));
      }
    }
    return results;
  } catch (error) {
    console.warn("AI matching failed for new lost item:", error.message);
    return [];
  }
}

/**
 * Email the claimant about a claim status change (approved / rejected / collected).
 */
export async function sendClaimSubmittedEmail({ claim, lostItem, foundItem }) {
  const to = claim?.claimantEmail || lostItem?.reporterEmail;
  if (!to) return { skipped: "no-recipient-email" };
  addNotification({
    userEmail: to,
    type: "CLAIM_SUBMITTED",
    title: "Claim submitted",
    message: `Your ownership claim ${claim.id} is waiting for admin review.`,
    relatedId: claim.id,
  });
  try {
    await post("/api/notify/claim-submitted", { to, claim, lostItem, foundItem });
    return { sent: true };
  } catch (error) {
    console.warn("Claim submitted email not sent:", error.message);
    return { error: error.message };
  }
}

export async function sendClaimStatusEmail({ status, claim, lostItem, foundItem }) {
  const to = claim?.claimantEmail || lostItem?.reporterEmail;
  if (!to) return { skipped: "no-recipient-email" };

  const titles = {
    "Ready for Collection": "Claim approved — ready for collection",
    Rejected: "Claim update",
    Collected: "Item collected — case closed",
  };
  const messages = {
    "Ready for Collection": `Your claim ${claim?.id || ""} was approved. Your collection code is ${claim?.collectionCode || "available in My Claims"}.`,
    Rejected: `Your claim ${claim?.id || ""} was rejected. ${claim?.adminNote || "Please review the claim details."}`,
    Collected: `Your item has been marked as collected. Claim ${claim?.id || ""} is now closed.`,
  };
  addNotification({
    userEmail: to,
    type: `CLAIM_${String(status || "UPDATE").toUpperCase().replace(/\s+/g, "_")}`,
    title: titles[status] || "Claim status updated",
    message: messages[status] || `Your claim status changed to ${status}.`,
    relatedId: claim?.id,
  });
  try {
    await post("/api/notify/claim-status", { to, status, claim, lostItem, foundItem });
    return { sent: true };
  } catch (error) {
    console.warn("Claim status email not sent:", error.message);
    return { error: error.message };
  }
}
