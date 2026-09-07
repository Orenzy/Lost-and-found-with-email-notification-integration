import nodemailer from "nodemailer";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env here as well as in server.mjs. ES module imports are evaluated
// before server.mjs can populate process.env, so mail configuration must be
// available when this module is initialised.
for (const envPath of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "server", ".env")]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

export const emailConfigured = Boolean(EMAIL_USER && EMAIL_APP_PASSWORD);

let transporter = null;

function getTransporter() {
  if (!emailConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT || 587),
      secure: Number(process.env.EMAIL_PORT || 587) === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapHtml({ heading, intro, rows = [], note, ctaText, ctaColor = "#2563eb" }) {
  const rowsHtml = rows
    .filter((row) => row && row.value)
    .map(
      (row) => `
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;width:170px;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px;">
    <div style="background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;">
      <p style="color:#2563eb;font-size:12px;font-weight:700;letter-spacing:1px;margin:0 0 8px;">LOST &amp; FOUND MANAGEMENT SYSTEM</p>
      <h2 style="margin:0 0 12px;color:#111827;">${escapeHtml(heading)}</h2>
      <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 16px;">${intro}</p>
      ${rowsHtml ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;border-top:1px solid #f1f5f9;padding-top:8px;">${rowsHtml}</table>` : ""}
      ${
        ctaText
          ? `<div style="margin-top:20px;padding:14px 16px;background:${ctaColor}1a;border-left:4px solid ${ctaColor};border-radius:8px;color:#111827;font-size:14px;">${ctaText}</div>`
          : ""
      }
      ${note ? `<p style="color:#6b7280;font-size:13px;margin-top:20px;">${note}</p>` : ""}
      <p style="color:#9ca3af;font-size:12px;margin-top:28px;">This is an automated notification. Please do not reply directly to this email.</p>
    </div>
  </div>`;
}

export async function sendMail({ to, subject, html, text }) {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    const error = new Error(
      "Email notifications are not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD in the .env file."
    );
    error.status = 503;
    throw error;
  }
  if (!to) {
    const error = new Error("A recipient email address is required.");
    error.status = 400;
    throw error;
  }

  await activeTransporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  });
}

export function matchAlertEmail({ lostItem, foundItem, score, reason }) {
  const subject = `Possible match found for your lost item: ${lostItem?.title || "your report"}`;
  const html = wrapHtml({
    heading: "We may have found your item 🎉",
    intro: `Our AI matching system compared a found-item report against your lost-item report and detected a <strong>${escapeHtml(
      score ?? "—"
    )}% likely match</strong>. Please log in to review the details and start ownership verification.`,
    rows: [
      { label: "Your lost item", value: lostItem?.title },
      { label: "Category", value: lostItem?.category },
      { label: "Location lost", value: lostItem?.location },
      { label: "Possible found item", value: foundItem?.title },
      { label: "Found at", value: foundItem?.location },
      { label: "Found on", value: foundItem?.dateFound },
      { label: "Match reason", value: reason },
    ],
    ctaText:
      "Next step: sign in to your account, open <strong>AI Matches</strong>, and complete the private ownership verification questions to submit a claim. Nothing is released until an administrator approves the claim.",
  });
  return { subject, html };
}

export function claimSubmittedEmail({ claim, lostItem, foundItem }) {
  const subject = `Claim submitted for review: ${lostItem?.title || foundItem?.title || "your item"}`;
  const html = wrapHtml({
    heading: "Your claim was submitted",
    intro: "Your ownership verification passed and your claim is now waiting for administrator review. The item will not be released until the Lost & Found Office approves it.",
    rows: [
      { label: "Claim reference", value: claim?.id },
      { label: "Lost item", value: lostItem?.title },
      { label: "Potential match", value: foundItem?.title },
      { label: "AI match score", value: claim?.score != null ? `${claim.score}%` : "" },
    ],
    ctaText: "Next step: wait for the administrator to review your claim. If approved, you will receive another email containing your collection location and collection code.",
  });
  return { subject, html };
}

export function claimStatusEmail({ status, claim, lostItem, foundItem }) {
  const templates = {
    "Ready for Collection": {
      heading: "Your claim has been approved ✅",
      intro: "Great news — an administrator has verified your claim. Your item is ready for collection.",
      ctaColor: "#16a34a",
      rows: [
        { label: "Item", value: lostItem?.title || foundItem?.title },
        { label: "Collection location", value: claim?.collectionLocation },
        { label: "Collection code", value: claim?.collectionCode },
        { label: "Instructions", value: claim?.collectionInstructions },
      ],
      ctaText: "Bring your claim reference and collection code to the office. The administrator will confirm the code before releasing the item.",
    },
    Rejected: {
      heading: "Update on your claim",
      intro: "An administrator has reviewed your claim and it was not approved at this time.",
      ctaColor: "#dc2626",
      rows: [
        { label: "Item", value: lostItem?.title || foundItem?.title },
        { label: "Reason", value: claim?.adminNote },
      ],
      ctaText: "If you believe this is a mistake, please visit the Lost &amp; Found Office with additional proof of ownership, or submit a new claim if another match appears.",
    },
    Collected: {
      heading: "Item collected — case closed",
      intro: "This confirms that your item has been successfully collected from the Lost &amp; Found Office.",
      ctaColor: "#2563eb",
      rows: [
        { label: "Item", value: lostItem?.title || foundItem?.title },
        { label: "Collected on", value: claim?.collectedAt ? new Date(claim.collectedAt).toLocaleString() : "" },
      ],
    },
  };

  const template = templates[status] || {
    heading: "Update on your claim",
    intro: `Your claim status has changed to "${escapeHtml(status)}".`,
    rows: [{ label: "Item", value: lostItem?.title || foundItem?.title }],
  };

  const subject = `Claim update: ${status} — ${lostItem?.title || foundItem?.title || "your report"}`;
  const html = wrapHtml(template);
  return { subject, html };
}

export async function testEmail({ to }) {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  return sendMail({
    to,
    subject: "Lost & Found System — Test Email",
    text: "This is a test email from the Lost & Found Management System. If you received this message, Gmail email notifications are working correctly.",
    html: `
      <h2>Lost & Found Management System</h2>
      <p>This is a test email from your Lost & Found system.</p>
      <p>If you received this message, your Gmail email notification system is working correctly.</p>
    `,
  });
}

export function adminLostReportEmail({ lostItem }) {
  const subject = `New lost item report: ${lostItem?.title || "Lost item"}`;

  const html = wrapHtml({
    heading: "New Lost Item Report Submitted",
    intro: "A user has submitted a new lost-item report and it requires administrator attention.",
    rows: [
      { label: "Item", value: lostItem?.title },
      { label: "Category", value: lostItem?.category },
      { label: "Location lost", value: lostItem?.location },
      { label: "Date lost", value: lostItem?.dateLost },
      { label: "Reporter", value: lostItem?.reporterEmail },
    ],
    ctaText:
      "Next step: log in to the administrator dashboard and review the lost-item report.",
    ctaColor: "#2563eb",
  });

  return { subject, html };
}

export function adminClaimSubmittedEmail({ claim, lostItem, foundItem }) {
  const subject = `New claim requires review: ${lostItem?.title || "Lost item"}`;

  const html = wrapHtml({
    heading: "New Claim Requires Administrator Review",
    intro:
      "A user has successfully completed ownership verification and submitted a claim. Please review the claim before releasing the item.",
    rows: [
      { label: "Claim reference", value: claim?.id },
      { label: "Lost item", value: lostItem?.title },
      { label: "Potential found item", value: foundItem?.title },
      { label: "Claimant", value: claim?.claimantEmail },
      {
        label: "AI match score",
        value: claim?.score != null ? `${claim.score}%` : "",
      },
      {
        label: "Verification",
        value: claim?.verificationPassed ? "Passed" : "Not passed",
      },
    ],
    ctaText:
      "Next step: open Admin Claim Reviews and approve or reject this claim.",
    ctaColor: "#16a34a",
  });

  return { subject, html };
}