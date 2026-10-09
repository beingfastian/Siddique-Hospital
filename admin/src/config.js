// Details of the hospital using this admin panel (VITE_HOSPITAL_* in admin/.env).
// The defaults are demo placeholders.
const env = import.meta.env;

export const HOSPITAL_NAME = env.VITE_HOSPITAL_NAME || "Demo Hospital";
// Optional: printed under the English name on slips
export const HOSPITAL_NAME_URDU = env.VITE_HOSPITAL_NAME_URDU || "";
export const HOSPITAL_ADDRESS = env.VITE_HOSPITAL_ADDRESS || "";
export const HOSPITAL_PHONE = env.VITE_HOSPITAL_PHONE || "+920000000000";

export const PRODUCT_NAME = "Qclinics";
export const PRODUCT_TAGLINE = "Care without the wait.";
