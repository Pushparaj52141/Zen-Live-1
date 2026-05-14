const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs").promises;
const pool = require("../config/db");
const {
  TRAINING_PLACEMENT_GST_RATE,
  discountedTotalWithGst,
} = require("../utils/feeGst");

/** In-repo base64 PNGs so invoices work on Linode without Frontend/public or assets/invoice on disk */
let embeddedInvoiceAssetsCache;
function getEmbeddedInvoiceAssets() {
  if (embeddedInvoiceAssetsCache !== undefined) {
    return embeddedInvoiceAssetsCache;
  }
  try {
    embeddedInvoiceAssetsCache = require("./invoiceEmbeddedAssets.json");
  } catch {
    embeddedInvoiceAssetsCache = null;
  }
  return embeddedInvoiceAssetsCache;
}

async function loadImageFromEmbedded(key, label) {
  const data = getEmbeddedInvoiceAssets();
  const b64 = data && data[key];
  if (!b64) return null;
  try {
    return await loadImage(Buffer.from(b64, "base64"));
  } catch (err) {
    console.warn(`[invoice] Embedded image "${label}" failed:`, err.message);
    return null;
  }
}

const COMPANY_DETAILS = {
  name: "URBANCODE EDUTECH SOLUTIONS PRIVATE LIMITED",
  address: "NO. 9/29, 5TH STREET, KAMAKOTI NAGAR, PALLIKARANAI, CHENNAI - 600100",
  gstin: "33AADCU7262Q1ZR",
  state: "TAMILNADU",
  bankName: "HDFC BANK",
  accountNumber: "50200106443203",
  ifsc: "HDFC0001880",
};

const formatInr = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function ellipsize(ctx, text, maxWidth) {
  const raw = String(text || "");
  if (!raw) return "";
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let trimmed = raw;
  while (trimmed.length > 0 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

function fitFontSizeForWidth(ctx, text, maxWidth, family, weight = "normal", start = 48, min = 16) {
  let size = start;
  while (size >= min) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(String(text || "")).width <= maxWidth) return size;
    size -= 1;
  }
  return min;
}

function drawRow(ctx, columns, y, height) {
  columns.forEach((col) => {
    ctx.strokeRect(col.x, y, col.width, height);
    if (col.text != null) {
      ctx.font = col.font || "20px Arial";
      ctx.fillStyle = col.color || "#111827";
      ctx.textAlign = col.align || "left";
      const textX =
        col.align === "center"
          ? col.x + col.width / 2
          : col.align === "right"
          ? col.x + col.width - 8
          : col.x + 8;
      ctx.fillText(String(col.text), textX, y + height / 2 + 8);
    }
  });
}

function invoiceAssetCandidates(filename) {
  const seen = new Set();
  const paths = [];
  const add = (p) => {
    if (!p) return;
    const n = path.normalize(p);
    if (seen.has(n)) return;
    seen.add(n);
    paths.push(n);
  };

  const envDir = process.env.INVOICE_ASSETS_DIR;
  if (envDir && String(envDir).trim()) {
    add(path.join(String(envDir).trim(), filename));
  }

  // __dirname = .../backend/src/services — stable on Linode regardless of PM2 cwd
  const backendRoot = path.join(__dirname, "..", "..");
  const repoRootGuess = path.join(backendRoot, "..");
  const cwd = process.cwd();
  const cwdNorm = path.resolve(cwd);
  const isBackendCwd =
    path.basename(cwdNorm) === "backend" ||
    cwdNorm.endsWith(`${path.sep}backend`);

  // Primary: assets shipped next to backend (…/backend/assets/invoice/<file>)
  add(path.join(backendRoot, "assets", "invoice", filename));

  // PM2 often sets cwd to …/backend — use assets/invoice, NOT backend/assets/invoice (avoids …/backend/backend/…)
  if (isBackendCwd) {
    add(path.join(cwdNorm, "assets", "invoice", filename));
  } else {
    add(path.join(cwdNorm, "backend", "assets", "invoice", filename));
    add(path.join(cwdNorm, "assets", "invoice", filename));
  }

  // Full repo on server (Frontend exists)
  add(path.join(repoRootGuess, "Frontend", "public", filename));
  add(path.join(cwdNorm, "Frontend", "public", filename));

  // Legacy / manual copies
  add(path.join(backendRoot, "uploads", filename));
  add(path.join(backendRoot, "public", filename));
  add(path.join(cwdNorm, "public", filename));

  return paths;
}

async function loadFirstExistingImage(candidatePaths, labelForLog) {
  const tried = [];
  for (const p of candidatePaths) {
    try {
      const buf = await fs.readFile(p);
      const img = await loadImage(buf);
      return img;
    } catch (err) {
      tried.push(`${p} (${err.code || err.message || "fail"})`);
    }
  }
  if (labelForLog) {
    const backendRoot = path.join(__dirname, "..", "..");
    const expected = path.join(backendRoot, "assets", "invoice", labelForLog);
    console.warn(
      `[invoice] Could not load "${labelForLog}" (${tried.length} path(s)). ` +
        `Deploy files to: ${expected} (copy from Frontend/public). First error: ${tried[0] || "none"}`
    );
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[invoice] All attempts:\n${tried.join("\n")}`);
    }
  }
  return null;
}

async function loadCompanyLogo(unitName) {
  const unitLower = String(unitName || "").toLowerCase();
  const useJz =
    unitLower.includes("job") || unitLower.includes("zenter");
  const embKey = useJz ? "jzLogo" : "ucLogo";
  const fromEmb = await loadImageFromEmbedded(embKey, embKey);
  if (fromEmb) return fromEmb;

  const logoFilename = useJz ? "jz_logo.png" : "uc_logo.png";
  return loadFirstExistingImage(
    invoiceAssetCandidates(logoFilename),
    logoFilename
  );
}

async function loadDigitalSignature() {
  const fromEmb = await loadImageFromEmbedded("sign", "sign");
  if (fromEmb) return fromEmb;

  const names = ["SivaSign.png", "sivasign.png", "Sivasign.png"];
  const paths = names.flatMap((n) => invoiceAssetCandidates(n));
  return loadFirstExistingImage([...new Set(paths)], "SivaSign.png");
}

/**
 * Generate a GST tax invoice image for a payment installment.
 * @param {Object} paymentData
 * @returns {Promise<Buffer>}
 */
async function generatePaymentReceipt(paymentData) {
  try {
    const {
      name,
      email,
      mobile,
      course_name,
      amount,
      payment_date,
      installment_count,
      unit_name,
      lead_id,
    } = paymentData;

    // The recorded installment amount is treated as the final GST-inclusive amount
    // already finalized in the lead payment context.
    const grossAmount = safeNumber(amount);
    const taxableValue = grossAmount / (1 + TRAINING_PLACEMENT_GST_RATE);
    const cgst = taxableValue * (TRAINING_PLACEMENT_GST_RATE / 2);
    const sgst = taxableValue * (TRAINING_PLACEMENT_GST_RATE / 2);
    const invoiceDate = new Date(payment_date);
    const fyStart =
      invoiceDate.getMonth() >= 3
        ? invoiceDate.getFullYear()
        : invoiceDate.getFullYear() - 1;
    const fyShort = `${String(fyStart).slice(-2)}-${String(fyStart + 1).slice(
      -2
    )}`;
    const invoiceNo = `UC/${String(lead_id || "0").padStart(4, "0")}/${
      installment_count || 1
    }/${fyShort}`;

    const width = 1240;
    const height = 1600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#111827";
    ctx.lineWidth = 1;

    const margin = 28;
    const left = margin;
    const right = width - margin;
    const contentWidth = right - left;
    ctx.strokeRect(left, margin, contentWidth, height - margin * 2);

    const drawCellText = (text, x, y, w, h, opts = {}) => {
      const padding = opts.padding ?? 10;
      const align = opts.align || "left";
      ctx.font = opts.font || "16px Arial";
      ctx.fillStyle = opts.color || "#111827";
      ctx.textAlign = align;
      const safeText = ellipsize(ctx, text || "", w - padding * 2);
      const tx =
        align === "center" ? x + w / 2 : align === "right" ? x + w - padding : x + padding;
      const ty = y + h / 2 + 6;
      ctx.fillText(safeText, tx, ty);
    };

    // Header block
    let y = margin + 12;
    const logo = await loadCompanyLogo(unit_name);
    let headerStartY = y;
    if (logo) {
      const logoHeight = 64;
      const logoWidth = (logo.width / logo.height) * logoHeight;
      const logoX = left + (contentWidth - logoWidth) / 2;
      ctx.drawImage(logo, logoX, y + 2, logoWidth, logoHeight);
      headerStartY += 74;
    } else {
      headerStartY += 8;
    }

    const headerTextW = contentWidth - 24;
    const companyFontSize = fitFontSizeForWidth(
      ctx,
      COMPANY_DETAILS.name,
      headerTextW,
      "Arial",
      "bold",
      48,
      30
    );
    ctx.textAlign = "center";
    ctx.font = `bold ${companyFontSize}px Arial`;
    ctx.fillText(
      COMPANY_DETAILS.name,
      width / 2,
      headerStartY + companyFontSize - 2
    );
    const addressFontSize = fitFontSizeForWidth(
      ctx,
      COMPANY_DETAILS.address,
      headerTextW,
      "Arial",
      "normal",
      28,
      20
    );
    ctx.font = `${addressFontSize}px Arial`;
    ctx.fillText(
      COMPANY_DETAILS.address,
      width / 2,
      headerStartY + companyFontSize + addressFontSize + 8
    );
    const gstLine = `GSTIN: ${COMPANY_DETAILS.gstin} | State: ${COMPANY_DETAILS.state}`;
    const gstFontSize = fitFontSizeForWidth(
      ctx,
      gstLine,
      headerTextW,
      "Arial",
      "bold",
      30,
      22
    );
    ctx.font = `bold ${gstFontSize}px Arial`;
    ctx.fillText(
      gstLine,
      width / 2,
      headerStartY + companyFontSize + addressFontSize + gstFontSize + 20
    );

    y = headerStartY + companyFontSize + addressFontSize + gstFontSize + 38;
    ctx.strokeRect(left, y, contentWidth, 52);
    drawCellText("TAX INVOICE", left, y, contentWidth, 52, {
      align: "center",
      font: "bold 42px Arial",
    });
    y += 52;

    // Invoice/Bill section
    const infoRows = 4;
    const infoRowH = 52;
    const halfW = contentWidth / 2;
    ctx.strokeRect(left, y, halfW, infoRows * infoRowH);
    ctx.strokeRect(left + halfW, y, halfW, infoRows * infoRowH);
    for (let i = 1; i < infoRows; i += 1) {
      const ry = y + i * infoRowH;
      ctx.beginPath();
      ctx.moveTo(left, ry);
      ctx.lineTo(right, ry);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(left + halfW, y);
    ctx.lineTo(left + halfW, y + infoRows * infoRowH);
    ctx.stroke();

    drawCellText(`Invoice No: ${invoiceNo}`, left, y, halfW, infoRowH, {
      font: "32px Arial",
    });
    drawCellText("Bill To:", left, y + infoRowH, halfW, infoRowH, {
      font: "32px Arial",
    });
    drawCellText(name || "Student", left, y + infoRowH * 2, halfW, infoRowH, {
      font: "bold 30px Arial",
    });
    const contact = `${email || ""}${email && mobile ? " | " : ""}${mobile || ""}`;
    drawCellText(contact, left, y + infoRowH * 3, halfW, infoRowH, {
      font: "23px Arial",
    });

    drawCellText(
      `Date: ${invoiceDate.toLocaleDateString("en-IN")}`,
      left + halfW,
      y,
      halfW,
      infoRowH,
      { font: "32px Arial" }
    );
    drawCellText("", left + halfW, y + infoRowH, halfW, infoRowH, { font: "30px Arial" });
    drawCellText(
      "Customer GSTIN: NA",
      left + halfW,
      y + infoRowH * 2,
      halfW,
      infoRowH,
      { font: "30px Arial" }
    );
    drawCellText(
      "Place of Supply: Tamil Nadu",
      left + halfW,
      y + infoRowH * 3,
      halfW,
      infoRowH,
      { font: "30px Arial" }
    );
    y += infoRows * infoRowH;

    // Service table
    const cols = [
      { x: left, width: 70, key: "sno", title: "S.No", align: "center" },
      { x: left + 70, width: 430, key: "desc", title: "Description of Service", align: "left" },
      { x: left + 500, width: 100, key: "sac", title: "SAC", align: "center" },
      { x: left + 600, width: 70, key: "qty", title: "Qty", align: "center" },
      { x: left + 670, width: 270, key: "rate", title: "Rate", align: "right" },
      { x: left + 940, width: right - (left + 940), key: "amount", title: "Amount", align: "right" },
    ];
    const headerH = 48;
    drawRow(
      ctx,
      cols.map((c) => ({
        x: c.x,
        width: c.width,
        text: c.title,
        align: c.align,
        font: "bold 28px Arial",
      })),
      y,
      headerH
    );
    y += headerH;

    const lineH = 46;
    drawRow(
      ctx,
      [
        { x: cols[0].x, width: cols[0].width, text: "1", align: "center", font: "26px Arial" },
        {
          x: cols[1].x,
          width: cols[1].width,
          text: ellipsize(
            ctx,
            `${course_name || "Course Fee"} Installment #${installment_count || 1}`,
            cols[1].width - 20
          ),
          align: "left",
          font: "24px Arial",
        },
        { x: cols[2].x, width: cols[2].width, text: "999293", align: "center", font: "24px Arial" },
        { x: cols[3].x, width: cols[3].width, text: "1", align: "center", font: "24px Arial" },
        { x: cols[4].x, width: cols[4].width, text: formatInr(grossAmount), align: "right", font: "24px Arial" },
        { x: cols[5].x, width: cols[5].width, text: formatInr(grossAmount), align: "right", font: "24px Arial" },
      ],
      y,
      lineH
    );
    y += lineH;

    for (let i = 0; i < 6; i += 1) {
      drawRow(
        ctx,
        cols.map((c) => ({ x: c.x, width: c.width, text: "" })),
        y,
        lineH
      );
      y += lineH;
    }

    // Totals box on right
    const totalsLeft = cols[4].x;
    const totalsLabelW = cols[4].width;
    const totalsValueW = cols[5].width;
    const totals = [
      { label: "Subtotal", value: taxableValue },
      { label: "CGST @ 3%", value: cgst },
      { label: "SGST @ 3%", value: sgst },
      { label: "Grand Total", value: grossAmount, bold: true },
    ];
    totals.forEach((row) => {
      const rowH = row.bold ? 56 : 50;
      drawRow(
        ctx,
        [
          {
            x: totalsLeft,
            width: totalsLabelW,
            text: row.label,
            align: "left",
            font: row.bold ? "bold 28px Arial" : "bold 30px Arial",
          },
          {
            x: totalsLeft + totalsLabelW,
            width: totalsValueW,
            text: formatInr(row.value),
            align: "right",
            font: row.bold ? "bold 32px Arial" : "30px Arial",
          },
        ],
        y,
        rowH
      );
      y += rowH;
    });

    // Bank details and signature
    const bankY = y + 28;
    drawCellText("Bank Details:", left, bankY, 520, 42, {
      font: "bold 34px Arial",
      padding: 2,
    });
    drawCellText(`Bank Name: ${COMPANY_DETAILS.bankName}`, left, bankY + 44, 620, 36, {
      font: "28px Arial",
      padding: 2,
    });
    drawCellText(
      `Account No: ${COMPANY_DETAILS.accountNumber}`,
      left,
      bankY + 82,
      620,
      36,
      { font: "28px Arial", padding: 2 }
    );
    drawCellText(`IFSC: ${COMPANY_DETAILS.ifsc}`, left, bankY + 120, 620, 36, {
      font: "28px Arial",
      padding: 2,
    });

    const signatureImage = await loadDigitalSignature();
    const signLabelX = right - 350;
    const signLabelY = height - 88;
    const signBoxW = 340;

    if (signatureImage) {
      const maxSignWidth = 240;
      const maxSignHeight = 82;
      const signRatio = signatureImage.width / signatureImage.height;
      let drawW = maxSignWidth;
      let drawH = drawW / signRatio;
      if (drawH > maxSignHeight) {
        drawH = maxSignHeight;
        drawW = drawH * signRatio;
      }

      const signX = signLabelX + signBoxW - drawW - 6;
      const signY = signLabelY - drawH - 16;
      ctx.drawImage(signatureImage, signX, signY, drawW, drawH);
    }

    drawCellText("Authorized Signatory", signLabelX, signLabelY, signBoxW, 36, {
      font: "30px Arial",
      align: "right",
      padding: 0,
    });

    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("Error generating tax invoice:", error);
    throw error;
  }
}

/**
 * Generate receipt and save for a lead's payment
 */
async function generateAndSaveReceipt(leadId, installmentId) {
  try {
    const query = `
            SELECT 
                l.lead_id,
                l.name,
                l.email,
                l.mobile_number,
                l.country_code,
                l.enrollment_id,
                l.discounted_fee,
                l.fee_paid as total_paid,
                l.fee_balance as remaining_balance,
                c.course_name,
                u.unit_name,
                u.unit_id,
                i.amount,
                i.payment_date,
                i.payment_mode,
                i.installment_count
            FROM leads l
            LEFT JOIN course c ON l.course_id = c.course_id
            LEFT JOIN unit u ON l.unit_id = u.unit_id
            LEFT JOIN installments i ON i.installment_id = $1
            WHERE l.lead_id = $2
            `;

    const result = await pool.query(query, [installmentId, leadId]);

    if (result.rowCount === 0) {
      throw new Error("Lead or installment not found");
    }

    const paymentData = result.rows[0];

    if (!paymentData.name || !paymentData.email || !paymentData.amount) {
      throw new Error("Missing required data for invoice generation");
    }

    const receiptBuffer = await generatePaymentReceipt({
      ...paymentData,
      mobile: `${paymentData.country_code || ""}${paymentData.mobile_number || ""}`,
    });

    const receiptsDir = path.join(__dirname, "../../uploads/receipts");
    await fs.mkdir(receiptsDir, { recursive: true });

    const fileName = `invoice_${leadId}_${installmentId}_${Date.now()}.png`;
    const filePath = path.join(receiptsDir, fileName);
    await fs.writeFile(filePath, receiptBuffer);

    return {
      leadId: paymentData.lead_id,
      name: paymentData.name,
      email: paymentData.email,
      mobile: `${paymentData.country_code || ""}${paymentData.mobile_number || ""}`,
      amount: paymentData.amount,
      paymentDate: paymentData.payment_date,
      courseName: paymentData.course_name,
      unitName: paymentData.unit_name,
      receiptPath: filePath,
      receiptBuffer,
      fileName,
      totalCourseFee: discountedTotalWithGst(paymentData.discounted_fee),
      enrollmentId: paymentData.enrollment_id,
      paymentMode: paymentData.payment_mode,
      installmentCount: paymentData.installment_count,
    };
  } catch (error) {
    console.error("Invoice generation failed:", error);
    throw error;
  }
}

/**
 * Generate and save invoice for a placement installment.
 */
async function generateAndSavePlacementReceipt(leadId, placementInstallmentId) {
  try {
    const query = `
      SELECT 
        l.lead_id,
        l.name,
        l.email,
        l.mobile_number,
        l.country_code,
        l.enrollment_id,
        l.placement_discounted_fee as discounted_fee,
        l.placement_paid as total_paid,
        l.placement_balance as remaining_balance,
        c.course_name,
        u.unit_name,
        u.unit_id,
        pi.amount,
        pi.payment_date,
        pi.payment_mode,
        pi.installment_count
      FROM leads l
      LEFT JOIN course c ON l.course_id = c.course_id
      LEFT JOIN unit u ON l.unit_id = u.unit_id
      LEFT JOIN placement_installments pi ON pi.placement_installment_id = $1
      WHERE l.lead_id = $2
    `;

    const result = await pool.query(query, [placementInstallmentId, leadId]);

    if (result.rowCount === 0) {
      throw new Error("Lead or placement installment not found");
    }

    const paymentData = result.rows[0];
    if (!paymentData.name || !paymentData.email || !paymentData.amount) {
      throw new Error("Missing required data for placement invoice generation");
    }

    const receiptBuffer = await generatePaymentReceipt({
      ...paymentData,
      mobile: `${paymentData.country_code || ""}${paymentData.mobile_number || ""}`,
    });

    const receiptsDir = path.join(__dirname, "../../uploads/receipts");
    await fs.mkdir(receiptsDir, { recursive: true });

    const fileName = `invoice_placement_${leadId}_${placementInstallmentId}_${Date.now()}.png`;
    const filePath = path.join(receiptsDir, fileName);
    await fs.writeFile(filePath, receiptBuffer);

    return {
      leadId: paymentData.lead_id,
      name: paymentData.name,
      email: paymentData.email,
      mobile: `${paymentData.country_code || ""}${paymentData.mobile_number || ""}`,
      amount: paymentData.amount,
      paymentDate: paymentData.payment_date,
      courseName: paymentData.course_name,
      unitName: paymentData.unit_name,
      receiptPath: filePath,
      receiptBuffer,
      fileName,
      totalCourseFee: discountedTotalWithGst(paymentData.discounted_fee),
      enrollmentId: paymentData.enrollment_id,
      paymentMode: paymentData.payment_mode,
      installmentCount: paymentData.installment_count,
    };
  } catch (error) {
    console.error("Placement invoice generation failed:", error);
    throw error;
  }
}

module.exports = {
  generatePaymentReceipt,
  generateAndSaveReceipt,
  generateAndSavePlacementReceipt,
};
