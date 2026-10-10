import { useLanguage, LANGUAGES } from "../i18n";
import { ButtonLink, Container } from "../components/site";

// Shown for addresses that don't exist. The host returns it with status 404
// (dist/404.html), so search engines don't index it as a copy of the home page.
const NotFound = () => {
  const { lang, t } = useLanguage();
  return (
    <Container className="py-20 text-center">
      <h1 className="text-3xl font-bold text-slate-900">{t("notFound.title")}</h1>
      <p className="mt-3 text-slate-600">{t("notFound.text")}</p>
      <ButtonLink href={LANGUAGES[lang].path} variant="primary" size="lg" className="mt-8">
        {t("notFound.home")}
      </ButtonLink>
    </Container>
  );
};

export default NotFound;
