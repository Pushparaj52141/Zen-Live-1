require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Set OAuth2 credentials
oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

// Gmail API instance
const gmail = google.gmail({ version: "v1", auth: oauth2Client });

function foldBase64(b64) {
  const chunks = b64.match(/.{1,76}/g);
  return chunks ? chunks.join("\r\n") : b64;
}

// Utility function to send email using Gmail API
async function sendEmail({ to, subject, message, attachments }) {
  // Encode subject line properly for UTF-8 characters (emojis, ₹, etc.)
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;

  // HTML must not use 7bit if body contains non-ASCII (₹, ©, emojis) — fixes garbled text on some clients
  const htmlPartB64 = foldBase64(
    Buffer.from(message, "utf8").toString("base64")
  );

  let rawMessage = [
    `From: "Urbancode" <${process.env.EMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="boundary"`,
    ``,
    `--boundary`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    htmlPartB64,
    ``,
  ];

  // Attach files
  if (attachments && attachments.length) {
    attachments.forEach((attachment) => {
      let contentBase64;

      if (attachment.content) {
        contentBase64 = Buffer.from(attachment.content).toString("base64");
      } else if (attachment.path) {
        contentBase64 = fs.readFileSync(attachment.path).toString("base64");
      } else {
        console.warn("Skipping attachment with no path or content.");
        return;
      }

      const mime =
        attachment.contentType ||
        (String(attachment.filename || "").toLowerCase().endsWith(".png")
          ? "image/png"
          : "application/octet-stream");
      rawMessage.push(
        `--boundary`,
        `Content-Type: ${mime}; name="${attachment.filename}"`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        ``,
        foldBase64(contentBase64)
      );
    });

    rawMessage.push(`--boundary--`);
  } else {
    // multipart/mixed must end with closing boundary (same as attachment path)
    rawMessage.push(`--boundary--`);
  }

  try {
    const result = await gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: Buffer.from(rawMessage.join("\r\n"))
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, ""),
      },
    });
    console.log("✅ Email sent successfully:", result.data.id);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}

module.exports = { sendEmail };
