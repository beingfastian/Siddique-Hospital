import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FaBars, FaPhoneAlt, FaTimes, FaWhatsapp } from "react-icons/fa";
import { HOSPITAL_NAME } from "../config";
import { useLanguage } from "../i18n";
import { ButtonLink, Container, Logo, cx, telUrl, whatsappUrl } from "./site";

const LINKS = [
  { to: "/", key: "nav.home" },
  { to: "/doctors", key: "nav.doctors" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
];

// English <-> Urdu. The label is always in the other language, so it can be read.
export const LanguageSwitch = ({ className = "" }) => {
  const { lang, setLang, t } = useLanguage();
  const next = lang === "ur" ? "en" : "ur";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      lang={next}
      aria-label={t("lang.switchLabel")}
      className={cx("inline-flex h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50", className)}
    >
      {t("lang.switch")}
    </button>
  );
};

const Navbar = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass = ({ isActive }) =>
    cx("rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-primary-50 text-primary-800" : "text-slate-700 hover:bg-slate-100");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <Container className="flex h-16 items-center justify-between gap-3">
        <Link to="/" aria-label={`${HOSPITAL_NAME}: ${t("nav.home")}`} className="min-w-0">
          <Logo subtitle={HOSPITAL_NAME} />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.to === "/"} className={linkClass}>
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitch className="hidden sm:inline-flex" />
          <ButtonLink href={telUrl} variant="secondary" icon={<FaPhoneAlt />} className="hidden lg:inline-flex h-10">
            {t("action.callShort")}
          </ButtonLink>
          <ButtonLink href={whatsappUrl(t("wa.general"))} external variant="whatsapp" icon={<FaWhatsapp />} className="hidden md:inline-flex h-10">
            {t("action.whatsapp")}
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? t("nav.close") : t("nav.menu")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
          >
            {open ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
          </button>
        </div>
      </Container>

      {open && (
        <div id="site-menu" className="border-t border-slate-200 bg-white md:hidden">
          <Container className="py-3">
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.to === "/"} className={({ isActive }) => cx(linkClass({ isActive }), "block px-4 py-3 text-base")}>
                    {t(link.key)}
                  </NavLink>
                </li>
              ))}
            </ul>
            <LanguageSwitch className="mt-3 w-full justify-center sm:hidden" />
          </Container>
        </div>
      )}
    </header>
  );
};

// Phones: Call and WhatsApp always one tap away at the bottom of the screen
export const MobileActionBar = () => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="grid grid-cols-2 gap-2">
        <ButtonLink href={telUrl} variant="secondary" icon={<FaPhoneAlt />}>
          {t("action.callShort")}
        </ButtonLink>
        <ButtonLink href={whatsappUrl(t("wa.general"))} external variant="whatsapp" icon={<FaWhatsapp />}>
          {t("action.whatsappShort")}
        </ButtonLink>
      </div>
    </div>
  );
};

export default Navbar;
