import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sendMail, matchAlertEmail, claimStatusEmail, claimSubmittedEmail, emailConfigured, testEmail } from "./mailer.mjs";

const serverDir = dirname(fileURLToPath(import.meta.url));
const envCandidates = [resolve(process.cwd(), ".env"), resolve(serverDir, ".env")];
for (const envPath of envCandidates) {
  if (!existsSync(envPath)) continue;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

const PORT = Number(process.env.PORT || 3001);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 15_000_000) {
      const error = new Error("Request is too large. Use a smaller image.");
      error.status = 413;
      throw error;
    }
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Invalid JSON request.");
    error.status = 400;
    throw error;
  }
}

function extractOutputText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && content?.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function cleanJson(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function callOpenAI(input, instructions, maxOutputTokens = 1200) {
  if (!OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is missing. Add it to the .env file.");
    error.status = 503;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || "OpenAI request failed.");
    error.status = response.status;
    throw error;
  }

  const outputText = extractOutputText(data);
  if (!outputText) {
    const error = new Error("OpenAI returned an empty response.");
    error.status = 502;
    throw error;
  }
  return outputText;
}


function simpleVerificationQuestions() {
  return [
    "What is the main colour and one secondary colour of your item?",
    "What brand, logo, or visible text is on the item? If none, type none.",
    "Name one distinctive feature of the item (for example a scratch, pattern, strap, sticker, case, or special mark).",
  ];
}

const chatbotInstructions = `You are the assistant for a university Lost & Found Management System. Answer only questions about reporting, searching, AI matching, claiming, ownership verification, privacy, notifications, and using this application. Be concise and practical. Never request passwords, banking information, full identification numbers, authentication codes, or biometric data. Redirect unrelated questions to lost-and-found support.`;

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});

  try {
    if (req.method === "GET" && req.url === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        openaiConfigured: Boolean(OPENAI_API_KEY),
        model: OPENAI_MODEL,
        emailConfigured,
      });
    }

    if (req.method === "POST" && req.url === "/api/ai/chat") {
      const { message, history = [] } = await readJson(req);
      if (!message?.trim()) return sendJson(res, 400, { error: "Message is required." });

      const conversation = (Array.isArray(history) ? history.slice(-8) : []).map((entry) => {
        const role = entry?.role === "assistant" ? "assistant" : "user";
        return {
          role,
          content: [{
            type: role === "assistant" ? "output_text" : "input_text",
            text: String(entry?.content || ""),
          }],
        };
      });
      conversation.push({
        role: "user",
        content: [{ type: "input_text", text: String(message).trim() }],
      });

      const reply = await callOpenAI(conversation, chatbotInstructions, 700);
      return sendJson(res, 200, { reply });
    }

    if (req.method === "POST" && req.url === "/api/ai/analyse-item") {
      const { imageDataUrl, item = {}, reportType = "lost" } = await readJson(req);
      if (!imageDataUrl?.startsWith("data:image/")) {
        return sendJson(res, 400, { error: "A valid image is required." });
      }

      const prompt = `Analyse this ${reportType}-item photo and the user's details. Return ONLY valid JSON with exactly this shape:
{"category":"","object":"","primaryColour":"","secondaryColours":[],"brand":"","material":"","visibleText":"","distinctiveFeatures":[],"condition":"","searchDescription":"","suggestedTitle":"","privateVerificationQuestions":[]}
Rules:
- Be conservative: do not invent brands, text, damage, or features that are not visible.
- Use empty strings or arrays when uncertain.
- Produce a clear searchDescription suitable for database matching.
- Produce a concise suggestedTitle.
- For a lost-item report, private ownership verification uses exactly 3 moderately specific questions: (1) main colour plus one secondary colour, (2) brand/logo/visible text or "none", and (3) one distinctive feature such as a scratch, pattern, strap, sticker, case, or special mark. Keep them practical and answerable by the genuine owner; do not create trick questions or ask for sensitive information. For a found-item report, return an empty privateVerificationQuestions array.
- Example style: "What is the main colour and one secondary colour?", "What brand, logo, or visible text is on it?", "Name one distinctive feature."
- Never request passwords, banking data, full ID numbers, authentication codes, or biometric data.
User details: ${JSON.stringify(item)}`;

      const text = await callOpenAI([
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageDataUrl },
          ],
        },
      ], "You analyse lost-property photographs accurately and conservatively. Return only valid JSON.", 1200);

      let analysis;
      try {
        analysis = JSON.parse(cleanJson(text));
      } catch {
        analysis = {
          category: "",
          object: "",
          primaryColour: "",
          secondaryColours: [],
          brand: "",
          material: "",
          visibleText: "",
          distinctiveFeatures: [],
          condition: "",
          searchDescription: text,
          suggestedTitle: "",
          privateVerificationQuestions: [],
        };
      }
      if (reportType === "lost") {
        analysis.privateVerificationQuestions = simpleVerificationQuestions(analysis);
      } else {
        analysis.privateVerificationQuestions = [];
      }
      return sendJson(res, 200, { analysis });
    }

    if (req.method === "POST" && req.url === "/api/ai/match-items") {
      const { lostItem, foundItems = [] } = await readJson(req);
      if (!lostItem || !Array.isArray(foundItems)) {
        return sendJson(res, 400, { error: "lostItem and foundItems are required." });
      }
      if (!foundItems.length) return sendJson(res, 200, { matches: [] });

      const candidates = foundItems.slice(0, 50).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        dateFound: item.dateFound,
        aiAnalysis: item.aiAnalysis,
      }));

      const prompt = `Compare one lost item against found-item candidates. Consider object type, category, colours, brand, material, visible text, distinctive marks, condition, location, and date proximity. Return ONLY valid JSON as an array sorted best-first:
[{"candidateId":"","score":0,"confidence":"low|medium|high","matchingFeatures":[],"differences":[],"reason":""}]
Rules:
- Score from 0 to 100.
- Include every candidate with score 20 or higher.
- High confidence should require several specific agreements and no major contradiction.
- Clearly state important differences.
- This is only a potential match; ownership still requires private-question verification and admin approval.
Lost item: ${JSON.stringify(lostItem)}
Found candidates: ${JSON.stringify(candidates)}`;

      const text = await callOpenAI(prompt, "You are a careful lost-property matching assistant. Reduce false positives, avoid unsupported certainty, and return only valid JSON.", 1800);
      let matches;
      try {
        const parsed = JSON.parse(cleanJson(text));
        matches = Array.isArray(parsed) ? parsed : [];
      } catch {
        matches = [];
      }
      return sendJson(res, 200, { matches });
    }

    if (req.method === "POST" && req.url === "/api/notify/match-alert") {
      const { to, lostItem, foundItem, score, reason } = await readJson(req);
      if (!to) return sendJson(res, 400, { error: "A recipient email (to) is required." });
      if (!lostItem || !foundItem) return sendJson(res, 400, { error: "lostItem and foundItem are required." });

      const { subject, html } = matchAlertEmail({ lostItem, foundItem, score, reason });
      await sendMail({ to, subject, html });
      return sendJson(res, 200, { sent: true });
    }

    if (req.method === "POST" && req.url === "/api/notify/claim-submitted") {
      const { to, claim = {}, lostItem, foundItem } = await readJson(req);
      if (!to) return sendJson(res, 400, { error: "A recipient email (to) is required." });
      if (!claim?.id) return sendJson(res, 400, { error: "A claim is required." });

      const { subject, html } = claimSubmittedEmail({ claim, lostItem, foundItem });
      await sendMail({ to, subject, html });
      return sendJson(res, 200, { sent: true });
    }

    if (req.method === "POST" && req.url === "/api/notify/claim-status") {
      const { to, status, claim = {}, lostItem, foundItem } = await readJson(req);
      if (!to) return sendJson(res, 400, { error: "A recipient email (to) is required." });
      if (!status) return sendJson(res, 400, { error: "A claim status is required." });

      const { subject, html } = claimStatusEmail({ status, claim, lostItem, foundItem });
      await sendMail({ to, subject, html });
      return sendJson(res, 200, { sent: true });
    }
    if (req.method === "POST" && req.url === "/api/notify/test-email") {
      const { to } = await readJson(req);

      if (!to) {
        return sendJson(res, 400, {
          error: "Recipient email is required."
        });
      }

      const result = await testEmail({ to });

      return sendJson(res, 200, {
        sent: true,
        messageId: result?.messageId || null
      });
    }
    return sendJson(res, 404, { error: "Route not found." });
  } catch (error) {
    console.error("Server error:", error);
    return sendJson(res, error.status || 500, { error: error.message || "Unexpected server error." });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing server or change PORT in .env.`);
    process.exit(1);
  }
  console.error("Server failed to start:", error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`AI backend running at http://localhost:${PORT}`);
  console.log(`OpenAI configured: ${OPENAI_API_KEY ? "Yes" : "No"}`);
  console.log(`OpenAI model: ${OPENAI_MODEL}`);
  console.log(`Email notifications configured: ${emailConfigured ? "Yes (Gmail)" : "No - set EMAIL_USER / EMAIL_APP_PASSWORD in .env"}`);
});
