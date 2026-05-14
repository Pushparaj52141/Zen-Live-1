let anyAscii;
let warnedMissingAnyAscii = false;

async function getAnyAscii() {
  if (!anyAscii) {
    try {
      anyAscii = (await import("any-ascii")).default;
    } catch (error) {
      // Keep production running even if dependency is missing on server.
      if (!warnedMissingAnyAscii) {
        warnedMissingAnyAscii = true;
        console.warn(
          "any-ascii package missing; falling back to no-op transliteration.",
          error?.code || error?.message || error
        );
      }
      anyAscii = (value) => value;
    }
  }
  return anyAscii;
}

/**
 * Same rules as Frontend: strip HTML paste, normalize math/fullwidth Latin only
 * (does not transliterate real Tamil/Devanagari names).
 */
async function sanitizeLeadDisplayText(raw) {
  if (raw == null) return "";
  let s = String(raw).replace(/<[^>]*>/g, "").trim();
  if (!s) return "";

  const anyA = await getAnyAscii();
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x1d400 && cp <= 0x1d7ff) {
      out += anyA(ch);
      continue;
    }
    if (cp >= 0xff01 && cp <= 0xff5e) {
      out += String.fromCharCode(cp - 0xfee0);
      continue;
    }
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

module.exports = { sanitizeLeadDisplayText };
