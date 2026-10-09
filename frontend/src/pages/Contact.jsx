import { FaClock, FaEnvelope, FaExclamationTriangle, FaMapMarkerAlt, FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import { HOSPITAL_ADDRESS, HOSPITAL_EMAIL, HOSPITAL_HOURS, HOSPITAL_HOURS_URDU, HOSPITAL_PHONE } from "../config";
import { useLanguage } from "../i18n";
import { Latin } from "../components/DoctorCard";
import { Container, buttonClass, mapUrl, telUrl, whatsappUrl } from "../components/site";

// One way to reach the hospital: icon, what it is for, the number/address
const Method = ({ href, external, icon, title, hint, value, iconClass }) => (
  <a
    href={href}
    {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-primary-300 hover:bg-primary-50/30"
  >
    <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg ${iconClass}`}>
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block font-semibold text-slate-900">{title}</span>
      <span className="block text-sm text-slate-600">{hint}</span>
      <span className="mt-1 block break-words font-medium text-slate-900">{value}</span>
    </span>
  </a>
);

const Contact = () => {
  const { lang, t } = useLanguage();
  const hours = lang === "ur" ? HOSPITAL_HOURS_URDU || HOSPITAL_HOURS : HOSPITAL_HOURS;
  return (
    <Container className="py-8 sm:py-10">
      <h1 className="text-3xl font-bold text-slate-900">{t("contact.title")}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t("contact.lead")}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Method
          href={whatsappUrl(t("wa.general"))}
          external
          icon={<FaWhatsapp />}
          iconClass="bg-emerald-50 text-emerald-700"
          title={t("action.whatsappShort")}
          hint={t("contact.whatsappHint")}
          value={<Latin>{HOSPITAL_PHONE}</Latin>}
        />
        <Method
          href={telUrl}
          icon={<FaPhoneAlt />}
          iconClass="bg-primary-50 text-primary-700"
          title={t("action.callShort")}
          hint={t("contact.callHint")}
          value={<Latin>{HOSPITAL_PHONE}</Latin>}
        />
        <Method
          href={`mailto:${HOSPITAL_EMAIL}`}
          icon={<FaEnvelope />}
          iconClass="bg-slate-100 text-slate-700"
          title={t("action.email")}
          hint={t("contact.emailHint")}
          value={<Latin>{HOSPITAL_EMAIL}</Latin>}
        />
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-700">
              <FaMapMarkerAlt />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">{t("contact.address")}</h2>
              <p className="mt-1 text-slate-900">{HOSPITAL_ADDRESS}</p>
              {hours && (
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                  <FaClock aria-hidden="true" className="text-slate-500" />
                  <span>
                    <span className="sr-only">{t("contact.hours")}: </span>
                    {hours}
                  </span>
                </p>
              )}
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm", "mt-4")}>
                <FaMapMarkerAlt aria-hidden="true" /> {t("action.map")}
              </a>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <FaExclamationTriangle aria-hidden="true" className="mt-0.5 shrink-0" /> {t("contact.emergency")}
      </p>
    </Container>
  );
};

export default Contact;
