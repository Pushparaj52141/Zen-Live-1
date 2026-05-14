/**
 * Country config for mobile number validation.
 * Uses flag emoji as icon; min/max are digit length for national number (without country code).
 */
export const COUNTRY_MOBILE_CONFIG = [
  { code: "+91", name: "India", flag: "🇮🇳", minLength: 10, maxLength: 10 },
  { code: "+1", name: "USA / Canada", flag: "🇺🇸", minLength: 10, maxLength: 10 },
  { code: "+44", name: "UK", flag: "🇬🇧", minLength: 10, maxLength: 11 },
  { code: "+61", name: "Australia", flag: "🇦🇺", minLength: 9, maxLength: 9 },
  { code: "+81", name: "Japan", flag: "🇯🇵", minLength: 10, maxLength: 11 },
  { code: "+86", name: "China", flag: "🇨🇳", minLength: 11, maxLength: 11 },
  { code: "+49", name: "Germany", flag: "🇩🇪", minLength: 10, maxLength: 11 },
  { code: "+33", name: "France", flag: "🇫🇷", minLength: 9, maxLength: 9 },
  { code: "+971", name: "UAE", flag: "🇦🇪", minLength: 9, maxLength: 9 },
  { code: "+65", name: "Singapore", flag: "🇸🇬", minLength: 8, maxLength: 8 },
  { code: "+60", name: "Malaysia", flag: "🇲🇾", minLength: 9, maxLength: 10 },
  { code: "+94", name: "Sri Lanka", flag: "🇱🇰", minLength: 9, maxLength: 9 },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩", minLength: 10, maxLength: 10 },
  { code: "+92", name: "Pakistan", flag: "🇵🇰", minLength: 10, maxLength: 10 },
  { code: "+90", name: "Turkey", flag: "🇹🇷", minLength: 10, maxLength: 10 },
  { code: "+27", name: "South Africa", flag: "🇿🇦", minLength: 9, maxLength: 9 },
  { code: "+234", name: "Nigeria", flag: "🇳🇬", minLength: 10, maxLength: 11 },
  { code: "+254", name: "Kenya", flag: "🇰🇪", minLength: 9, maxLength: 9 },
  { code: "+20", name: "Egypt", flag: "🇪🇬", minLength: 10, maxLength: 10 },
  { code: "+55", name: "Brazil", flag: "🇧🇷", minLength: 10, maxLength: 11 },
  { code: "+52", name: "Mexico", flag: "🇲🇽", minLength: 10, maxLength: 10 },
];

/** Default country when none selected (e.g. India) */
export const DEFAULT_COUNTRY_CODE = "+91";

/** Strip all non-digits from mobile input */
export function stripMobileSpaces(v) {
  return (v || "").toString().replace(/\s/g, "").replace(/\D/g, "").trim();
}

/**
 * Get config for a country code. For "manual" or unknown codes, use flexible 10–13.
 */
export function getCountryConfig(countryCode) {
  if (!countryCode || countryCode === "manual") {
    return { minLength: 10, maxLength: 13, name: "Other", flag: "🌐" };
  }
  const normalized = countryCode.trim();
  const found = COUNTRY_MOBILE_CONFIG.find((c) => c.code === normalized);
  if (found) return found;
  return { minLength: 10, maxLength: 13, name: "Other", flag: "🌐", code: normalized };
}

/**
 * Validate national mobile number (digits only) by country code.
 * @returns { { valid: boolean, message?: string } }
 */
export function validateMobileByCountry(mobile, countryCode) {
  const digits = stripMobileSpaces(mobile);
  if (!digits) return { valid: false, message: "Mobile number is required." };
  const config = getCountryConfig(countryCode);
  if (digits.length < config.minLength) {
    return {
      valid: false,
      message: `${config.name}: mobile must be ${config.minLength} digits.`,
    };
  }
  if (digits.length > config.maxLength) {
    return {
      valid: false,
      message: `${config.name}: mobile must be at most ${config.maxLength} digits (you entered ${digits.length}).`,
    };
  }
  return { valid: true };
}

/**
 * Options for dropdown: value, label (full for list), shortLabel (flag + code for narrow trigger)
 */
export function getCountryOptionsForSelect() {
  const uniq = [];
  const seen = new Set();
  COUNTRY_MOBILE_CONFIG.forEach((c) => {
    if (seen.has(c.code)) return;
    seen.add(c.code);
    uniq.push({
      value: c.code,
      label: `${c.flag}  ${c.code}  ${c.name}`,
      shortLabel: `${c.flag} ${c.code}`,
    });
  });
  uniq.push({
    value: "manual",
    label: "🌐  Other / Manual code",
    shortLabel: "🌐 Other",
  });
  return uniq;
}
