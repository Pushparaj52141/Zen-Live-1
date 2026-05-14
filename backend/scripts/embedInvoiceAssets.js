/**
 * Regenerates backend/src/services/invoiceEmbeddedAssets.json from Frontend/public.
 * Run from repo root: node backend/scripts/embedInvoiceAssets.js
 * Or from backend: node scripts/embedInvoiceAssets.js
 */
const fs = require("fs");
const path = require("path");

const backendDir = path.join(__dirname, "..");
const repoRoot = path.join(backendDir, "..");
const pub = path.join(repoRoot, "Frontend", "public");
const outFile = path.join(backendDir, "src", "services", "invoiceEmbeddedAssets.json");

const keys = {
  ucLogo: "uc_logo.png",
  jzLogo: "jz_logo.png",
  sign: "SivaSign.png",
};

const o = {};
for (const [k, filename] of Object.entries(keys)) {
  const fp = path.join(pub, filename);
  if (!fs.existsSync(fp)) {
    console.error("Missing:", fp);
    process.exit(1);
  }
  o[k] = fs.readFileSync(fp).toString("base64");
}
fs.writeFileSync(outFile, JSON.stringify(o));
console.log("Wrote", outFile, Object.keys(o).map((k) => `${k}:${Buffer.from(o[k], "base64").length}b`).join(", "));
