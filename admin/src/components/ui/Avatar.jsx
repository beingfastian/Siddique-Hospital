import { useState } from "react";

// A person's photo, or their initials when there is no photo (or it fails to load).
// Never shows a broken image. Tint is picked from the name so the same person
// always gets the same colour. (design-system/qlinic/MASTER.md, Avatar)
const TINTS = [
  "bg-primary-100 text-primary-900",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-900",
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-900",
  "bg-rose-100 text-rose-800",
  "bg-slate-200 text-slate-800",
];

export const initialsOf = (name = "") => {
  const words = String(name).replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

const tintOf = (name = "") => {
  let hash = 0;
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
};

// size: Tailwind size classes, e.g. "w-10 h-10"; textClass for the initials size
const Avatar = ({ src, name, className = "w-10 h-10", textClass = "text-sm", rounded = "rounded-full" }) => {
  const [failed, setFailed] = useState(false);
  const showPhoto = src && !failed;
  return showPhoto ? (
    <img
      src={src}
      alt={name || ""}
      onError={() => setFailed(true)}
      className={`${className} ${rounded} object-cover shrink-0 bg-slate-100`}
      loading="lazy"
    />
  ) : (
    <span
      role="img"
      aria-label={name || "Unknown"}
      className={`${className} ${rounded} ${tintOf(name)} ${textClass} shrink-0 inline-flex items-center justify-center font-semibold select-none`}
    >
      {initialsOf(name)}
    </span>
  );
};

export default Avatar;
