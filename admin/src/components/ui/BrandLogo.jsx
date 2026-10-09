import { assets } from "../../assets/assets";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "../../config";

// Qclinics logo: the Q mark from the official file, with the name set beside it
// (dark navy, extra bold, like the original wordmark). Swap for the official
// Qclinics logo file once it is available.
const SIZES = {
  sm: { mark: "h-8 w-8", name: "text-lg", tag: "text-[10px]" },
  md: { mark: "h-10 w-10", name: "text-xl", tag: "text-xs" },
  lg: { mark: "h-14 w-14", name: "text-3xl", tag: "text-sm" },
};

const BrandLogo = ({ size = "md", tagline = false, className = "" }) => {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src={assets.logo_mark} alt="" className={`${s.mark} shrink-0`} />
      <span className="leading-none">
        <span className={`block font-display font-extrabold tracking-tight text-slate-900 ${s.name}`}>{PRODUCT_NAME}</span>
        {tagline && <span className={`mt-1 block font-medium text-slate-700 ${s.tag}`}>{PRODUCT_TAGLINE}</span>}
      </span>
    </span>
  );
};

export default BrandLogo;
