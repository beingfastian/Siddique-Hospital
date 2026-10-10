import { FaEnvelope, FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import { PRODUCT_NAME, SALES_EMAIL, SALES_PHONE, STAFF_APP_URL } from "../config";
import { useLanguage } from "../i18n";
import { SECTIONS } from "./Navbar";
import { Container, Latin, Logo, telUrl, whatsappUrl } from "./site";

const Footer = () => {
  const { t } = useLanguage();
  const linkClass = "inline-flex min-h-10 items-center gap-2 py-1 text-slate-700 hover:text-primary-800";
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.5fr]">
        <div>
          <Logo tagline />
          <p className="mt-4 max-w-sm text-sm text-slate-600">{t("footer.about")}</p>
        </div>
        <nav aria-label={t("footer.links")}>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("footer.links")}</h2>
          <ul className="space-y-1 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={linkClass}>
                  {t(s.key)}
                </a>
              </li>
            ))}
            {STAFF_APP_URL && (
              <li>
                <a href={STAFF_APP_URL} className={linkClass}>
                  {t("nav.staff")}
                </a>
              </li>
            )}
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("footer.contact")}</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <a href={whatsappUrl(t("wa.demo", { product: PRODUCT_NAME }))} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <FaWhatsapp aria-hidden="true" className="text-emerald-700" /> <Latin>{SALES_PHONE}</Latin>
              </a>
            </li>
            <li>
              <a href={telUrl} className={linkClass}>
                <FaPhoneAlt aria-hidden="true" className="text-slate-500" /> <Latin>{SALES_PHONE}</Latin>
              </a>
            </li>
            {SALES_EMAIL && (
              <li>
                <a href={`mailto:${SALES_EMAIL}`} className={linkClass}>
                  <FaEnvelope aria-hidden="true" className="text-slate-500" /> <Latin>{SALES_EMAIL}</Latin>
                </a>
              </li>
            )}
          </ul>
        </div>
      </Container>
      <div className="border-t border-slate-200">
        <Container className="py-4 text-center text-xs text-slate-600 sm:text-start">
          {t("footer.rights", { year: new Date().getFullYear(), product: PRODUCT_NAME })}
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
