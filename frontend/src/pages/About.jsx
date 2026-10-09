import { FaClock, FaFlask, FaWhatsapp } from "react-icons/fa";
import { HOSPITAL_NAME } from "../config";
import { useLanguage } from "../i18n";
import { ButtonLink, Container, whatsappUrl } from "../components/site";

const About = () => {
  const { t } = useLanguage();
  const points = [
    { icon: <FaClock />, title: t("about.e1Title"), text: t("about.e1Text") },
    { icon: <FaWhatsapp />, title: t("about.e2Title"), text: t("about.e2Text") },
    { icon: <FaFlask />, title: t("about.e3Title"), text: t("about.e3Text") },
  ];
  return (
    <Container className="py-8 sm:py-10">
      <h1 className="text-3xl font-bold text-slate-900">{t("about.title", { hospital: HOSPITAL_NAME })}</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-600">{t("about.lead", { hospital: HOSPITAL_NAME })}</p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">{t("about.expectTitle")}</h2>
      <ul className="mt-5 grid gap-4 md:grid-cols-3">
        {points.map((p) => (
          <li key={p.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-lg text-primary-700">
              {p.icon}
            </span>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{p.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{p.text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <ButtonLink href={whatsappUrl(t("wa.general"))} external variant="whatsapp" size="lg" icon={<FaWhatsapp />}>
          {t("action.whatsapp")}
        </ButtonLink>
      </div>
    </Container>
  );
};

export default About;
