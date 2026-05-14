import anyAscii from "any-ascii";

/**
 * Strips accidental HTML from rich-text paste and normalizes "fancy" Latin letters
 * (Unicode math/script/fullwidth homoglyphs) to plain ASCII so the UI uses one font.
 * Does not transliterate real Tamil/Devanagari/etc. — only known confusable blocks.
 */
export function sanitizeLeadDisplayText(raw) {
  if (raw == null) return "";
  let s = String(raw).replace(/<[^>]*>/g, "").trim();
  if (!s) return "";

  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0);

    // Mathematical Alphanumeric Symbols (italic/script/bold “fancy” Latin from Office/Web paste)
    if (cp >= 0x1d400 && cp <= 0x1d7ff) {
      out += anyAscii(ch);
      continue;
    }

    // Fullwidth ASCII (punctuation + alphanumerics, e.g. Ｒａｊａ)
    if (cp >= 0xff01 && cp <= 0xff5e) {
      out += String.fromCharCode(cp - 0xfee0);
      continue;
    }

    // Zero-width / BOM noise from paste
    if (cp === 0xfeff || cp === 0x200b || cp === 0x200c || cp === 0x200d) {
      continue;
    }
    if (cp === 0xa0) {
      out += " ";
      continue;
    }

    out += ch;
  }

  return out.replace(/\s+/g, " ").trim();
}
