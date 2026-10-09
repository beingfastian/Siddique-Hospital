// Details of the hospital running this site. Each hospital sets these in
// frontend/.env (VITE_HOSPITAL_*); the defaults are demo placeholders.
const env = import.meta.env;

export const HOSPITAL_NAME = env.VITE_HOSPITAL_NAME || "Qlinic Demo Hospital";
// Optional: shown under the English name on the queue screens
export const HOSPITAL_NAME_URDU = env.VITE_HOSPITAL_NAME_URDU || "";
// Contact number used for WhatsApp buttons, calls and contact info.
export const HOSPITAL_PHONE = env.VITE_HOSPITAL_PHONE || "+920000000000";
export const HOSPITAL_EMAIL = env.VITE_HOSPITAL_EMAIL || "info@example.com";
export const HOSPITAL_ADDRESS = env.VITE_HOSPITAL_ADDRESS || "Hospital address, City";
// Optional: opening hours as you want patients to read them (English and Urdu)
export const HOSPITAL_HOURS = env.VITE_HOSPITAL_HOURS || "";
export const HOSPITAL_HOURS_URDU = env.VITE_HOSPITAL_HOURS_URDU || "";
// Optional: your Google Maps link; otherwise the address is searched on Google Maps
export const HOSPITAL_MAP_URL = env.VITE_HOSPITAL_MAP_URL || "";

// The product itself
export const PRODUCT_NAME = "Qlinic";
export const PRODUCT_TAGLINE = "Care without the wait.";
