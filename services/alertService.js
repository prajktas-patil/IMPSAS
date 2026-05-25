// ============================================================
// services/alertService.js
// Channels: Email (nodemailer) · SMS (Twilio) · Telegram Bot
// Telegram: Auto-sends to family's chat_id when person found
// ============================================================

import nodemailer from "nodemailer";

// ── Email transporter ────────────────────────────────────────
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === "your@gmail.com") return null;
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
};

// ── SMS via Twilio ────────────────────────────────────────────
const sendSMS = async (to, message) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return { success: false, error: "SMS not configured" };
  }
  try {
    const twilio = await import("twilio");
    const client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg    = await client.messages.create({
      body: message, from: process.env.TWILIO_PHONE, to,
    });
    return { success: true, sid: msg.sid };
  } catch (err) {
    console.error("SMS failed:", err.message);
    return { success: false, error: err.message };
  }
};

// ── Telegram Bot ──────────────────────────────────────────────
// To set up:
//   1. Create a bot via @BotFather on Telegram → get TELEGRAM_BOT_TOKEN
//   2. Family member must start a chat with your bot first
//   3. Get their chat_id — store it in familyMember.telegramChatId when registering
//   4. Add TELEGRAM_BOT_TOKEN to backend/.env

export const sendTelegramMessage = async (chatId, message) => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return { success: false, error: "Telegram not configured" };
  }
  if (!chatId) {
    return { success: false, error: "No Telegram chat ID for this recipient" };
  }
  try {
    const url  = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" });

    const res  = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram failed:", data.description);
      return { success: false, error: data.description };
    }
    console.log("Telegram sent to chat_id:", chatId);
    return { success: true };
  } catch (err) {
    console.error("Telegram error:", err.message);
    return { success: false, error: err.message };
  }
};

// Builds the Telegram message for a sighting / "person found"
const buildTelegramText = ({ caseDoc, sighting, confidenceScore, isFound = false }) => {
  const emoji = isFound ? "🟢" : confidenceScore >= 75 ? "🔴" : "🟡";
  const title = isFound
    ? `✅ <b>YOUR MISSING PERSON HAS BEEN FOUND</b>`
    : `${emoji} <b>IMPSAS SIGHTING ALERT</b>`;

  return `${title}

👤 <b>Name:</b> ${caseDoc.name}
🆔 <b>Case ID:</b> ${caseDoc.caseId}
📅 <b>Age:</b> ${caseDoc.age} yrs · ${caseDoc.gender}

📍 <b>Spotted at:</b> ${sighting.location || "Unknown"}
🎯 <b>Confidence:</b> ${confidenceScore}%
🕐 <b>Time:</b> ${new Date(sighting.reportedAt || Date.now()).toLocaleString("en-IN")}

${isFound
  ? "Please contact the authorities immediately with this Case ID."
  : "Login to IMPSAS for full details. Contact authorities if confirmed."}

<i>— IMPSAS Automated Alert System</i>`;
};

// ── Email HTML builder ────────────────────────────────────────
export const sendEmailAlert = async ({ to, subject, body }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log("Email not configured — skipping");
    return { success: false, error: "Email not configured" };
  }
  try {
    await transporter.sendMail({
      from: `"IMPSAS Alert System" <${process.env.EMAIL_USER}>`,
      to, subject, html: body,
    });
    console.log("Email sent to", to);
    return { success: true };
  } catch (err) {
    console.error("Email failed:", err.message);
    return { success: false, error: err.message };
  }
};

const buildEmailHTML = ({ casePerson, sighting, confidenceScore }) => {
  const color = confidenceScore >= 75 ? "#00E5A0" : confidenceScore >= 55 ? "#FFD166" : "#FF4D6D";
  const label = confidenceScore >= 75 ? "HIGH CONFIDENCE" : confidenceScore >= 55 ? "POSSIBLE MATCH" : "LOW CONFIDENCE";
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0C14;color:#F0F2FF;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#FF4D6D,#FF8C42);padding:24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;">IMPSAS EMERGENCY ALERT</h1>
      <p style="margin:8px 0 0;opacity:.85;">Missing Person Sighting Detected</p>
    </div>
    <div style="padding:24px;">
      <div style="background:#1A1E2E;border-radius:10px;padding:18px;margin-bottom:16px;">
        <h2 style="color:#FFD166;margin:0 0 12px;">${casePerson.name}</h2>
        <p style="margin:4px 0;font-size:13px;">Case ID: <strong>${casePerson.caseId}</strong></p>
        <p style="margin:4px 0;font-size:13px;">Age: <strong>${casePerson.age} yrs · ${casePerson.gender}</strong></p>
        <p style="margin:4px 0;font-size:13px;">Last Known: <strong>${casePerson.location}</strong></p>
      </div>
      <div style="background:#1A1E2E;border-radius:10px;padding:18px;margin-bottom:16px;border-left:4px solid ${color};">
        <h3 style="margin:0 0 10px;color:${color};">${label}</h3>
        <p style="margin:4px 0;font-size:13px;">Spotted at: <strong>${sighting.location || "Unknown"}</strong></p>
        <p style="margin:4px 0;font-size:20px;font-weight:bold;color:${color};">Confidence: ${confidenceScore}%</p>
        <p style="margin:4px 0;font-size:13px;">Time: <strong>${new Date(sighting.reportedAt || Date.now()).toLocaleString("en-IN")}</strong></p>
      </div>
      <div style="background:#FF4D6D11;border:1px solid #FF4D6D44;border-radius:10px;padding:16px;">
        <p style="margin:0;font-weight:700;color:#FF4D6D;">IMMEDIATE ACTION REQUIRED</p>
        <p style="margin:8px 0 0;font-size:12px;color:#6B7299;">Contact local authorities with the case ID and location immediately.</p>
      </div>
    </div>
  </div>`;
};

// ── sendSightingAlerts (Email + SMS + Telegram) ───────────────
export const sendSightingAlerts = async (caseDoc, sighting, confidenceScore) => {
  const results = [];
  if (!caseDoc.familyMembers || caseDoc.familyMembers.length === 0) return results;

  const isFound   = caseDoc.status === "Matched" || confidenceScore >= 90;
  const subject   = isFound
    ? `✅ FOUND: ${caseDoc.name} has been located [${caseDoc.caseId}]`
    : `URGENT: Sighting Alert for ${caseDoc.name} [${caseDoc.caseId}]`;
  const emailBody = buildEmailHTML({ casePerson: caseDoc, sighting, confidenceScore });
  const smsMsg    = `IMPSAS: ${caseDoc.name} (${caseDoc.caseId}) spotted at ${sighting.location || "Unknown"} – ${confidenceScore}% confidence. Login to IMPSAS for details.`;
  const tgText    = buildTelegramText({ caseDoc, sighting, confidenceScore, isFound });

  for (const member of caseDoc.familyMembers) {
    // Email
    if (member.email) {
      const r = await sendEmailAlert({ to: member.email, subject, body: emailBody });
      results.push({ type: "email", recipient: member.email, status: r.success ? "sent" : "failed", message: subject });
    }
    // SMS
    if (member.phone) {
      const r = await sendSMS(member.phone, smsMsg);
      results.push({ type: "sms", recipient: member.phone, status: r.success ? "sent" : "failed", message: smsMsg });
    }
    // Telegram
    if (member.telegramChatId) {
      const r = await sendTelegramMessage(member.telegramChatId, tgText);
      results.push({ type: "telegram", recipient: member.telegramChatId, status: r.success ? "sent" : "failed", message: "Telegram alert" });
    }
  }
  return results;
};

// ── sendEmergencyAlert (triggered on ≥75% or manual) ─────────
export const sendEmergencyAlert = async (caseDoc, location, confidenceScore) => {
  const results = [];
  const sighting = { location, reportedAt: new Date() };
  const isFound  = confidenceScore >= 90;

  const subject   = isFound
    ? `✅ ${caseDoc.name} HAS BEEN FOUND [${caseDoc.caseId}]`
    : `EMERGENCY: ${caseDoc.name} LOCATED [${confidenceScore}% match]`;
  const emailBody = buildEmailHTML({ casePerson: caseDoc, sighting, confidenceScore });
  const smsMsg    = `EMERGENCY: ${caseDoc.name} ${isFound ? "FOUND" : "LOCATED"} at ${location} – ${confidenceScore}% confidence. Contact authorities NOW.`;
  const tgText    = buildTelegramText({ caseDoc, sighting, confidenceScore, isFound });

  for (const member of caseDoc.familyMembers || []) {
    if (member.email) {
      const r = await sendEmailAlert({ to: member.email, subject, body: emailBody });
      results.push({ type: "email", recipient: member.email, status: r.success ? "sent" : "failed" });
    }
    if (member.phone) {
      const r = await sendSMS(member.phone, smsMsg);
      results.push({ type: "sms", recipient: member.phone, status: r.success ? "sent" : "failed" });
    }
    if (member.telegramChatId) {
      const r = await sendTelegramMessage(member.telegramChatId, tgText);
      results.push({ type: "telegram", recipient: member.telegramChatId, status: r.success ? "sent" : "failed" });
    }
  }
  return results;
};
