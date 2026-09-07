import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.ethereal.email";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_APP_PASSWORD;
const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  `"Lost & Found Office" <${EMAIL_USER || "no-reply@example.com"}>`;

export const emailConfigured = Boolean(
  EMAIL_HOST &&
    EMAIL_PORT &&
    EMAIL_USER &&
    EMAIL_PASSWORD
);

let transporter = null;

if (emailConfigured) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
}

/**
 * Send an email.
 */
export async function sendMail({
  to,
  subject,
  html,
  text,
}) {
  if (!transporter) {
    throw new Error(
      "Email is not configured. Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_APP_PASSWORD in .env."
    );
  }

  if (!to) {
    throw new Error("Recipient email is required.");
  }

  const result = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text:
      text ||
      html
        ?.replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim() ||
      "",
    html,
  });

  console.log(
    `Email sent: "${subject}" -> ${to}`
  );

  console.log(
    `Message ID: ${result.messageId}`
  );

  if (result.messageId) {
    console.log(
      `Ethereal preview: https://ethereal.email/message/${result.messageId}`
    );
  }

  return result;
}

/**
 * Common HTML email wrapper.
 */
function wrapHtml({
  heading,
  intro,
  rows = [],
  ctaText = "",
}) {
  const rowHtml = rows
    .filter(
      (row) =>
        row &&
        row.value !== undefined &&
        row.value !== null &&
        String(row.value).trim() !== ""
    )
    .map(
      (row) => `
        <tr>
          <td style="
            padding:10px 12px;
            font-weight:600;
            color:#374151;
            border-bottom:1px solid #e5e7eb;
            width:35%;
          ">
            ${escapeHtml(row.label)}
          </td>
          <td style="
            padding:10px 12px;
            color:#111827;
            border-bottom:1px solid #e5e7eb;
          ">
            ${escapeHtml(String(row.value))}
          </td>
        </tr>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="
  margin:0;
  padding:0;
  background:#f3f4f6;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:680px;
    margin:30px auto;
    background:#ffffff;
    border-radius:14px;
    overflow:hidden;
    box-shadow:0 4px 18px rgba(0,0,0,0.08);
  ">

    <div style="
      background:#2563eb;
      color:white;
      padding:24px 28px;
    ">
      <h1 style="
        margin:0;
        font-size:24px;
      ">
        Lost &amp; Found Management System
      </h1>
    </div>

    <div style="padding:28px;">

      <h2 style="
        margin-top:0;
        color:#111827;
      ">
        ${escapeHtml(heading)}
      </h2>

      <p style="
        color:#4b5563;
        line-height:1.6;
      ">
        ${escapeHtml(intro)}
      </p>

      ${
        rowHtml
          ? `
          <table style="
            width:100%;
            border-collapse:collapse;
            margin:22px 0;
          ">
            ${rowHtml}
          </table>
          `
          : ""
      }

      ${
        ctaText
          ? `
          <div style="
            margin-top:22px;
            padding:16px;
            background:#eff6ff;
            border-left:4px solid #2563eb;
            border-radius:6px;
            color:#1e3a8a;
            line-height:1.5;
          ">
            <strong>Next step:</strong>
            ${escapeHtml(ctaText)}
          </div>
          `
          : ""
      }

      <p style="
        margin-top:28px;
        color:#6b7280;
        font-size:13px;
      ">
        This is an automated notification from the University Lost &amp; Found Management System.
      </p>

    </div>
  </div>

</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * ---------------------------------------------------------
 * POSSIBLE MATCH EMAIL
 * ---------------------------------------------------------
 */
export function matchAlertEmail({
  lostItem,
  foundItem,
  score,
  reason,
}) {
  const subject =
    `Potential Lost & Found Match: ${
      lostItem?.title || "Lost item"
    }`;

  const html = wrapHtml({
    heading: "Potential Match Found",
    intro:
      "Our AI matching system found a potential match for your lost item.",

    rows: [
      {
        label: "Lost item",
        value: lostItem?.title,
      },
      {
        label: "Potential found item",
        value: foundItem?.title,
      },
      {
        label: "AI match score",
        value:
          score !== undefined
            ? `${score}%`
            : "",
      },
      {
        label: "Reason",
        value: reason,
      },
    ],

    ctaText:
      "Log in to the Lost & Found system to review the potential match and complete ownership verification.",
  });

  return {
    subject,
    html,
  };
}

/**
 * ---------------------------------------------------------
 * CLAIM SUBMITTED EMAIL - USER
 * ---------------------------------------------------------
 */
export function claimSubmittedEmail({
  claim,
  lostItem,
  foundItem,
}) {
  const subject =
    `Claim submitted: ${
      lostItem?.title || "Lost item"
    }`;

  const html = wrapHtml({
    heading: "Claim Submitted",
    intro:
      "Your ownership claim has been submitted successfully and is waiting for administrator review.",

    rows: [
      {
        label: "Claim reference",
        value: claim?.id,
      },
      {
        label: "Lost item",
        value: lostItem?.title,
      },
      {
        label: "Potential found item",
        value: foundItem?.title,
      },
      {
        label: "Claimant",
        value: claim?.claimantEmail,
      },
    ],

    ctaText:
      "Please wait for the Lost & Found administrator to review your claim.",
  });

  return {
    subject,
    html,
  };
}

/**
 * ---------------------------------------------------------
 * CLAIM STATUS EMAIL - USER
 * ---------------------------------------------------------
 */
export function claimStatusEmail({
  status,
  claim,
  lostItem,
  foundItem,
}) {
  let heading = "Claim Status Updated";
  let intro = "Your Lost & Found claim has been updated.";

  if (status === "Ready for Collection") {
    heading =
      "Claim Approved — Ready for Collection";

    intro =
      "Your ownership claim has been approved. Your item is ready to be collected.";
  }

  if (status === "Rejected") {
    heading = "Claim Update";

    intro =
      "Your ownership claim was not approved by the administrator.";
  }

  if (status === "Collected") {
    heading =
      "Item Collected — Case Closed";

    intro =
      "Your item has been marked as collected and the claim is now closed.";
  }

  const rows = [
    {
      label: "Claim reference",
      value: claim?.id,
    },
    {
      label: "Lost item",
      value: lostItem?.title,
    },
    {
      label: "Found item",
      value: foundItem?.title,
    },
    {
      label: "Status",
      value: status,
    },
  ];

  if (status === "Ready for Collection") {
    rows.push({
      label: "Collection code",
      value:
        claim?.collectionCode ||
        "Available in My Claims",
    });
  }

  if (status === "Rejected") {
    rows.push({
      label: "Admin note",
      value:
        claim?.adminNote ||
        "Please review your claim details.",
    });
  }

  const subject =
    status === "Ready for Collection"
      ? "Claim approved — ready for collection"
      : `Claim status: ${status}`;

  const html = wrapHtml({
    heading,
    intro,
    rows,

    ctaText:
      status === "Ready for Collection"
        ? "Log in to My Claims and follow the collection instructions."
        : status === "Rejected"
        ? "You can review the claim information in My Claims."
        : status === "Collected"
        ? "No further action is required."
        : "Log in to the Lost & Found system for more information.",
  });

  return {
    subject,
    html,
  };
}

/**
 * ---------------------------------------------------------
 * ADMIN: NEW LOST ITEM REPORT
 * ---------------------------------------------------------
 */
export function adminLostReportEmail({
  lostItem,
}) {
  const subject =
    `Admin Alert: New Lost Item Report — ${
      lostItem?.title || "Lost item"
    }`;

  const html = wrapHtml({
    heading: "New Lost Item Report Submitted",

    intro:
      "A user has submitted a new lost-item report. Administrator attention is required.",

    rows: [
      {
        label: "Item",
        value: lostItem?.title,
      },
      {
        label: "Category",
        value: lostItem?.category,
      },
      {
        label: "Description",
        value: lostItem?.description,
      },
      {
        label: "Location lost",
        value: lostItem?.location,
      },
      {
        label: "Date lost",
        value: lostItem?.dateLost,
      },
      {
        label: "Reporter",
        value: lostItem?.reporterEmail,
      },
      {
        label: "Report ID",
        value: lostItem?.id,
      },
    ],

    ctaText:
      "Log in to the administrator dashboard to review this lost-item report.",
  });

  return {
    subject,
    html,
  };
}

/**
 * ---------------------------------------------------------
 * ADMIN: NEW CLAIM
 * ---------------------------------------------------------
 */
export function adminClaimSubmittedEmail({
  claim,
  lostItem,
  foundItem,
}) {
  const subject =
    `Admin Alert: New Claim Requires Review — ${
      lostItem?.title || "Lost item"
    }`;

  const html = wrapHtml({
    heading: "New Claim Requires Administrator Review",

    intro:
      "A user has completed the ownership verification process and submitted a claim. Please review the claim before approving the release of the item.",

    rows: [
      {
        label: "Claim reference",
        value: claim?.id,
      },
      {
        label: "Lost item",
        value: lostItem?.title,
      },
      {
        label: "Potential found item",
        value: foundItem?.title,
      },
      {
        label: "Claimant",
        value: claim?.claimantEmail,
      },
      {
        label: "AI match score",
        value:
          claim?.score !== undefined &&
          claim?.score !== null
            ? `${claim.score}%`
            : "",
      },
      {
        label: "Verification",
        value:
          claim?.verificationPassed
            ? "Passed"
            : "Completed",
      },
    ],

    ctaText:
      "Open Admin Claim Reviews and approve or reject this claim.",
  });

  return {
    subject,
    html,
  };
}

/**
 * ---------------------------------------------------------
 * TEST EMAIL
 * ---------------------------------------------------------
 */
export async function testEmail({
  to,
}) {
  const subject =
    "Lost & Found — Ethereal Email Test";

  const html = wrapHtml({
    heading: "Email Configuration Test",

    intro:
      "This is a test email from the University Lost & Found Management System.",

    rows: [
      {
        label: "Recipient",
        value: to,
      },
      {
        label: "SMTP host",
        value: EMAIL_HOST,
      },
      {
        label: "SMTP port",
        value: EMAIL_PORT,
      },
    ],

    ctaText:
      "If you can see this message in Ethereal, SMTP email delivery is working correctly.",
  });

  return sendMail({
    to,
    subject,
    html,
  });
}