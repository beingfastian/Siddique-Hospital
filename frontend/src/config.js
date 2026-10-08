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

// The product itself
export const PRODUCT_NAME = "Qlinic";
export const PRODUCT_TAGLINE = "Care without the wait.";
