import { useContext, useMemo } from "react";
import { NavLink, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext.jsx";
import { useLanguage } from "../i18n";
import DoctorCard, { Latin } from "../components/DoctorCard";
import { Container, buttonClass, cx, sitsToday } from "../components/site";

const Doctors = () => {
  const { speciality: selected } = useParams();
  const { t, speciality } = useLanguage();
  const { doctors, doctorsStatus, reloadDoctors } = useContext(AppContext);

  // Filters come from the hospital's own doctors (no fixed list)
  const specialities = useMemo(() => {
    const counts = new Map();
    for (const d of doctors) counts.set(d.speciality, (counts.get(d.speciality) || 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [doctors]);

  // Bookable first, then sitting today, then by name
  const shown = useMemo(
    () =>
      doctors
        .filter((d) => !selected || d.speciality === selected)
        .sort((a, b) => (b.available !== false) - (a.available !== false) || sitsToday(b) - sitsToday(a) || a.name.localeCompare(b.name)),
    [doctors, selected]
  );

  const chip = ({ isActive }) =>
    cx(
      "inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-sm font-medium transition-colors",
      isActive ? "border-primary bg-primary text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
    );

  return (
    <Container className="py-8 sm:py-10">
      <h1 className="text-3xl font-bold text-slate-900">{t("doctors.title")}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t("doctors.lead")}</p>

      {specialities.length > 1 && (
        <nav aria-label={t("home.specialitiesTitle")} className="-mx-4 mt-6 overflow-x-auto px-4 pb-1">
          <ul className="flex gap-2">
            <li>
              <NavLink to="/doctors" end className={chip}>
                {t("doctors.all")} <Latin className="text-xs opacity-80">{doctors.length}</Latin>
              </NavLink>
            </li>
            {specialities.map(([name, count]) => (
              <li key={name}>
                <NavLink to={`/doctors/${encodeURIComponent(name)}`} className={chip}>
                  {speciality(name)} <Latin className="text-xs opacity-80">{count}</Latin>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-6">
        {doctorsStatus === "error" && !doctors.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p>{t("doctors.failed")}</p>
            <button type="button" onClick={reloadDoctors} className={buttonClass("secondary", "sm", "mt-3")}>
              {t("doctors.retry")}
            </button>
          </div>
        ) : doctorsStatus === "loading" && !doctors.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("doctors.loading")}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : shown.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((d) => (
              <DoctorCard key={d._id} doctor={d} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">{t("doctors.empty")}</p>
        )}
      </div>
    </Container>
  );
};

export default Doctors;
