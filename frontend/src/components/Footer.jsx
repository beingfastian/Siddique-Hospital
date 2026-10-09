import { Link } from "react-router-dom";
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import { HOSPITAL_ADDRESS, HOSPITAL_EMAIL, HOSPITAL_NAME, HOSPITAL_PHONE, PRODUCT_NAME } from "../config";
import { useLanguage } from "../i18n";
import { Container, Logo, mapUrl, telUrl, whatsappUrl } from "./site";

const Footer = () => {
  const { t } = useLanguage();
  const linkClass = "inline-flex items-center gap-2 py-1 text-slate-700 hover:text-primary-800";
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <Container className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.5fr]">
        <div>
          <Logo subtitle={HOSPITAL_NAME} />
          <p className="mt-4 max-w-sm text-sm text-slate-600">{t("footer.about", { hospital: HOSPITAL_NAME })}</p>
        </div>
        <nav aria-label={t("footer.links")}>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("footer.links")}</h2>
          <ul className="space-y-1 text-sm">
            <li><Link to="/" className={linkClass}>{t("nav.home")}</Link></li>
            <li><Link to="/doctors" className={linkClass}>{t("nav.doctors")}</Link></li>
            <li><Link to="/about" className={linkClass}>{t("nav.about")}</Link></li>
            <li><Link to="/contact" className={linkClass}>{t("nav.contact")}</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("footer.contact")}</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <a href={whatsappUrl(t("wa.contact"))} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <FaWhatsapp aria-hidden="true" className="text-emerald-700" /> <bdi dir="ltr" lang="en" className="font-sans">{HOSPITAL_PHONE}</bdi>
              </a>
            </li>
            <li>
              <a href={telUrl} className={linkClass}>
                <FaPhoneAlt aria-hidden="true" className="text-slate-500" /> <bdi dir="ltr" lang="en" className="font-sans">{HOSPITAL_PHONE}</bdi>
              </a>
            </li>
            <li>
              <a href={`mailto:${HOSPITAL_EMAIL}`} className={linkClass}>
                <FaEnvelope aria-hidden="true" className="text-slate-500" /> <bdi dir="ltr" lang="en" className="font-sans">{HOSPITAL_EMAIL}</bdi>
              </a>
            </li>
            <li>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <FaMapMarkerAlt aria-hidden="true" className="shrink-0 text-slate-500" /> <bdi lang="en" className="font-sans">{HOSPITAL_ADDRESS}</bdi>
              </a>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-slate-200">
        <Container className="flex flex-col items-center justify-between gap-1 py-4 text-xs text-slate-600 sm:flex-row">
          <p>{t("footer.rights", { year: new Date().getFullYear(), hospital: HOSPITAL_NAME })}</p>
          <p>{t("footer.powered", { product: PRODUCT_NAME })}</p>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
