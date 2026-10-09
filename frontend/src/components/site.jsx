// Shared pieces of the patient website (design-system/qlinic/MASTER.md):
// logo, buttons, contact links, doctor photo and availability.
import { useState } from "react";
import { assets } from "../assets/assets";
import { HOSPITAL_ADDRESS, HOSPITAL_MAP_URL, HOSPITAL_PHONE, PRODUCT_NAME } from "../config";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

// --- Contact links ---

const phoneDigits = HOSPITAL_PHONE.replace(/[^\d+]/g, "");
export const whatsappUrl = (message) => `https://wa.me/${phoneDigits.replace("+", "")}?text=${encodeURIComponent(message)}`;
export const telUrl = `tel:${phoneDigits}`;
export const mapUrl = HOSPITAL_MAP_URL || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HOSPITAL_ADDRESS)}`;

// --- Logo: the Qlinic logo image (assets/qlinic-logo.png), hospital name beside it ---

export const Logo = ({ subtitle, compact = false }) => (
  <span className="inline-flex min-w-0 items-center gap-3 font-sans leading-tight" dir="ltr" lang="en">
    {compact ? (
      <img src={assets.logo_mark} alt={PRODUCT_NAME} className="h-9 w-9 shrink-0" />
    ) : (
      <img src={assets.logo} alt={PRODUCT_NAME} className="h-10 w-auto shrink-0" />
    )}
    {subtitle && (
      <>
        <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" />
        <span className="hidden min-w-0 truncate text-sm font-medium text-slate-700 sm:block">{subtitle}</span>
      </>
    )}
  </span>
);

// --- Buttons (as links: every action here opens a page, WhatsApp or the dialer) ---

const BUTTON = {
  primary: "bg-primary text-white hover:bg-primary-800",
  // WhatsApp green that still passes contrast with white text (emerald-700)
  whatsapp: "bg-emerald-700 text-white hover:bg-emerald-800",
  secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  onDark: "bg-white text-primary-900 hover:bg-primary-50",
};
const SIZE = { sm: "h-9 px-3 text-sm gap-1.5", md: "h-11 px-4 text-sm gap-2", lg: "h-12 px-5 text-base gap-2" };

export const buttonClass = (variant = "primary", size = "md", extra = "") =>
  cx("inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150", BUTTON[variant], SIZE[size], extra);

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

export const SectionTitle = ({ title, action, lead }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      {lead && <p className="mt-1 text-slate-600">{lead}</p>}
    </div>
    {action}
  </div>
);

// --- Doctors ---

const initials = (name = "") =>
  name
    .replace(/^dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

// Photo, or initials when there is none or it fails to load (never a broken image)
export const DoctorPhoto = ({ doctor, className = "h-16 w-16" }) => {
  const [failed, setFailed] = useState(false);
  if (!doctor.image || failed) {
    return (
      <span aria-hidden="true" className={cx("flex shrink-0 items-center justify-center rounded-xl bg-primary-50 font-display font-semibold text-primary-800", className)}>
        {initials(doctor.name)}
      </span>
    );
  }
  return <img src={doctor.image} alt="" loading="lazy" onError={() => setFailed(true)} className={cx("shrink-0 rounded-xl bg-slate-100 object-cover", className)} />;
};

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Now in the hospital's time zone, whatever the phone's clock is set to
const hospitalNow = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return { day: parts.weekday.toLowerCase(), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
};

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

// "17:30" -> "5:30 pm"
export const formatTime = (hhmm) => {
  const total = toMinutes(hhmm);
  if (total === null) return hhmm;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

// Is the doctor sitting today? { tone, key, vars } for useLanguage().t
export const doctorStatus = (doctor, now = hospitalNow()) => {
  if (doctor.available === false) return { tone: "off", key: "status.off" };
  const days = doctor.sittingDays?.length ? doctor.sittingDays : DAYS;
  const start = toMinutes(doctor.timings?.start);
  const end = toMinutes(doctor.timings?.end);
  const sitsToday = days.includes(now.day);
  if (sitsToday) {
    if (start === null || end === null) return { tone: "now", key: "status.now" };
    if (now.minutes < start) return { tone: "soon", key: "status.later", vars: { time: formatTime(doctor.timings.start) } };
    if (now.minutes <= end) return { tone: "now", key: "status.now" };
    return { tone: "closed", key: "status.closed" };
  }
  // Next sitting day after today
  const todayIndex = DAYS.indexOf(now.day);
  for (let i = 1; i < 7; i++) {
    const next = DAYS[(todayIndex + i) % 7];
    if (days.includes(next)) return { tone: "later", key: "status.next", vars: { day: next } };
  }
  return { tone: "off", key: "status.contact" };
};

export const sitsToday = (doctor, now = hospitalNow()) =>
  doctor.available !== false && (!doctor.sittingDays?.length || doctor.sittingDays.includes(now.day));

const STATUS_STYLE = {
  now: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  soon: "bg-amber-50 text-amber-800 ring-amber-600/20",
  closed: "bg-slate-100 text-slate-700 ring-slate-500/20",
  later: "bg-slate-100 text-slate-700 ring-slate-500/20",
  off: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

// Availability in words (and a dot), never colour alone
export const StatusPill = ({ status, t, dayFull }) => (
  <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", STATUS_STYLE[status.tone])}>
    <span aria-hidden="true" className={cx("h-1.5 w-1.5 rounded-full", status.tone === "now" ? "bg-emerald-600" : status.tone === "soon" ? "bg-amber-600" : "bg-slate-400")} />
    {t(status.key, { ...status.vars, day: status.vars?.day ? dayFull(status.vars.day) : undefined })}
  </span>
);
