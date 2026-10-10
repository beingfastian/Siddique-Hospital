// Shared pieces of the Qclinics website (design-system/qclinics/MASTER.md):
// logo, buttons, contact links, layout.
import { assets } from "../assets/assets";
import { PRODUCT_NAME, PRODUCT_TAGLINE, SALES_PHONE } from "../config";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

// --- Contact links (the Qclinics team, for demos) ---

const phoneDigits = SALES_PHONE.replace(/[^\d+]/g, "");
export const whatsappUrl = (message) => `https://wa.me/${phoneDigits.replace("+", "")}?text=${encodeURIComponent(message)}`;
export const telUrl = `tel:${phoneDigits}`;

// --- Logo: the Q mark from the official file, with the name set beside it ---

export const Logo = ({ tagline = false, size = "md" }) => (
  <span className="inline-flex items-center gap-2 font-sans" dir="ltr" lang="en">
    <img src={assets.logo_mark} alt="" width={size === "lg" ? 48 : 36} height={size === "lg" ? 48 : 36} className={size === "lg" ? "h-12 w-12" : "h-9 w-9"} />
    <span className="leading-none">
      <span className={cx("block font-display font-extrabold tracking-tight text-slate-900", size === "lg" ? "text-3xl" : "text-xl")}>{PRODUCT_NAME}</span>
      {tagline && <span className="mt-1 block text-xs font-medium text-slate-700">{PRODUCT_TAGLINE}</span>}
    </span>
  </span>
);

// --- Buttons (as links: every action opens WhatsApp, the dialer, mail or a section) ---

const BUTTON = {
  primary: "bg-primary text-white hover:bg-primary-800",
  // WhatsApp green that still passes contrast with white text (emerald-700)
  whatsapp: "bg-emerald-700 text-white hover:bg-emerald-800",
  secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
  onDark: "bg-white text-primary-900 hover:bg-primary-50",
  outlineDark: "border border-white/60 text-white hover:bg-white/10",
};
const SIZE = { sm: "h-9 px-3 text-sm gap-1.5", md: "h-11 px-4 text-sm gap-2", lg: "h-12 px-5 text-base gap-2" };

export const buttonClass = (variant = "primary", size = "md", extra = "") =>
  cx("inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150", BUTTON[variant], SIZE[size], extra);

export const ButtonLink = ({ href, variant, size, icon, children, className = "", external = false, ...props }) => (
  <a href={href} className={buttonClass(variant, size, className)} {...(external && { target: "_blank", rel: "noopener noreferrer" })} {...props}>
    {icon && (
      <span aria-hidden="true" className="inline-flex text-[1.1em]">
        {icon}
      </span>
    )}
    {children}
  </a>
);

// --- Layout ---

export const Container = ({ children, className = "" }) => <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;

// Latin text (names, numbers) inside Urdu keeps its own font and direction
export const Latin = ({ children, className = "" }) => (
  <bdi dir="ltr" lang="en" className={cx("font-sans", className)}>
    {children}
  </bdi>
);
