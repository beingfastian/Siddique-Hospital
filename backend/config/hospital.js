// Details of the hospital running Qlinic, shown in WhatsApp replies and emails.
// Each hospital sets these in .env (HOSPITAL_*); the defaults are demo placeholders.
export const HOSPITAL_NAME = process.env.HOSPITAL_NAME || "Qlinic Demo Hospital";
export const HOSPITAL_PHONE = process.env.HOSPITAL_PHONE || "+920000000000";
export const HOSPITAL_EMAIL = process.env.HOSPITAL_EMAIL || "";
export const HOSPITAL_ADDRESS = process.env.HOSPITAL_ADDRESS || "";
// Patient-facing website, e.g. "cityhospital.com" (optional)
export const HOSPITAL_WEBSITE = process.env.HOSPITAL_WEBSITE || "";

export const PRODUCT_NAME = "Qlinic";
export const PRODUCT_TAGLINE = "Care without the wait.";
