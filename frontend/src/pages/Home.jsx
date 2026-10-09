import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowRight, FaCheck, FaPhoneAlt, FaStethoscope, FaTv, FaWhatsapp } from "react-icons/fa";
import { AppContext } from "../context/AppContext";
import { HOSPITAL_NAME } from "../config";
import { useLanguage } from "../i18n";
import { specialityData } from "../assets/assets";
import DoctorCard, { Latin } from "../components/DoctorCard";
import { ButtonLink, Container, DoctorPhoto, SectionTitle, StatusPill, buttonClass, cx, doctorStatus, sitsToday, telUrl, whatsappUrl } from "../components/site";

const BOARD_MS = 30000;

// Icons for the specialities we have artwork for; others get a stethoscope
const SPECIALITY_ICONS = Object.fromEntries(specialityData.map((s) => [s.speciality.toLowerCase(), s.image]));
SPECIALITY_ICONS.pediatrician = SPECIALITY_ICONS.paediatrician = SPECIALITY_ICONS.pediatricians;
SPECIALITY_ICONS.gynaecologist = SPECIALITY_ICONS.gynecologist;

// The public waiting-room board (token numbers and doctor names only)
const useBoard = (backendUrl) => {
  const [board, setBoard] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      axios
        .get(`${backendUrl}/api/queue/public/board`, { timeout: 10000 })
        .then(({ data }) => alive && data.success && setBoard(data.board))
        .catch(() => {});
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), BOARD_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [backendUrl]);
  return board;
};

// Right side of the hero: who is being seen now, or who sits today
const TodayPanel = ({ board, doctors }) => {
  const { t, speciality, dayFull } = useLanguage();
  const live = board?.doctors?.length ? board.doctors : null;
  const today = doctors.filter((d) => sitsToday(d));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          {live && (
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
            </span>
          )}
          {live ? t("home.liveTitle") : t("home.todayTitle")}
        </h2>
        {live && (
          <Link to="/queue" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-800 hover:underline">
            <FaTv aria-hidden="true" /> {t("home.liveMore")}
          </Link>
        )}
      </div>

      {live ? (
        <ul className="divide-y divide-slate-100">
          {live.map((d) => (
            <li key={d.docId} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  <Latin>Dr. {d.doctorName}</Latin>
                </p>
                <p className="truncate text-sm text-slate-600">
                  {d.paused ? t("home.liveBreak") : !d.started ? t("home.liveNotStarted") : t("home.liveWaiting", { count: d.waitingCount })}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-xs text-slate-500">{t("home.liveNow")}</p>
                <p className="font-display text-2xl font-semibold tabular-nums text-slate-900">
                  <Latin>{d.nowServing ? `#${d.nowServing}` : "–"}</Latin>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : today.length ? (
        <ul className="divide-y divide-slate-100">
          {today.slice(0, 5).map((d) => (
            <li key={d._id} className="flex items-center gap-3 py-3">
              <DoctorPhoto doctor={d} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  <Latin>Dr. {d.name}</Latin>
                </p>
                <p className="truncate text-sm text-slate-600">{speciality(d.speciality)}</p>
              </div>
              <StatusPill status={doctorStatus(d)} t={t} dayFull={dayFull} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">{t("home.todayNone")}</p>
      )}
    </div>
  );
};

// Paste the link from WhatsApp or the slip (or just its code) to open the token page
const TrackToken = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const text = value.trim();
    const id = (text.match(/\/queue\/t\/([A-Za-z0-9_-]{6,16})/) || [])[1] || (/^[A-Za-z0-9_-]{6,16}$/.test(text) ? text : null);
    if (!id) return setError(t("track.invalid"));
    navigate(`/queue/t/${id}`);
  };
  return (
    <section aria-labelledby="track-title" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 id="track-title" className="text-xl font-semibold text-slate-900">
        {t("track.title")}
      </h2>
      <p className="mt-1 text-sm text-slate-600">{t("track.text")}</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row" noValidate>
        <label htmlFor="track-input" className="sr-only">
          {t("track.label")}
        </label>
        <input
          id="track-input"
          dir="ltr"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder={t("track.placeholder")}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "track-error" : undefined}
          autoComplete="off"
          className={cx(
            "h-11 w-full flex-1 rounded-lg border bg-white px-3 font-sans text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600",
            error ? "border-red-500" : "border-slate-300"
          )}
        />
        <button type="submit" className={buttonClass("primary", "md")}>
          {t("action.track")}
        </button>
      </form>
      {error && (
        <p id="track-error" role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
};

const Home = () => {
  const { t, speciality } = useLanguage();
  const { doctors, doctorsStatus, backendUrl } = useContext(AppContext);
  const board = useBoard(backendUrl);

  const specialities = useMemo(() => {
    const counts = new Map();
    for (const d of doctors) counts.set(d.speciality, (counts.get(d.speciality) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [doctors]);

  // Bookable doctors first, then those sitting today
  const featured = useMemo(
    () => [...doctors].sort((a, b) => (b.available !== false) - (a.available !== false) || sitsToday(b) - sitsToday(a)).slice(0, 6),
    [doctors]
  );

  const steps = [
    { title: t("home.step1Title"), text: t("home.step1Text") },
    { title: t("home.step2Title"), text: t("home.step2Text") },
    { title: t("home.step3Title"), text: t("home.step3Text") },
  ];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <Container className="grid items-center gap-10 py-10 md:py-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-medium text-primary-800">{t("home.kicker", { hospital: HOSPITAL_NAME })}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">{t("home.title")}</h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">{t("home.lead")}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={whatsappUrl(t("wa.general"))} external variant="whatsapp" size="lg" icon={<FaWhatsapp />}>
                {t("action.whatsapp")}
              </ButtonLink>
              <ButtonLink href={telUrl} variant="secondary" size="lg" icon={<FaPhoneAlt />}>
                {t("action.call")}
              </ButtonLink>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              {["home.trust1", "home.trust2", "home.trust3"].map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <FaCheck aria-hidden="true" className="shrink-0 text-primary-700" /> {t(key)}
                </li>
              ))}
            </ul>
          </div>
          <TodayPanel board={board} doctors={doctors} />
        </Container>
      </section>

      <Container className="space-y-14 py-12">
        {/* Specialities */}
        {specialities.length > 0 && (
          <section>
            <SectionTitle title={t("home.specialitiesTitle")} />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {specialities.map(([name, count]) => {
                const icon = SPECIALITY_ICONS[name.trim().toLowerCase()];
                return (
                  <li key={name}>
                    <Link
                      to={`/doctors/${encodeURIComponent(name)}`}
                      className="flex h-full flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                    >
                      {icon ? (
                        <img src={icon} alt="" className="h-12 w-12" />
                      ) : (
                        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-700">
                          <FaStethoscope />
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-900">{speciality(name)}</span>
                      <span className="text-xs text-slate-500">
                        <Latin>{count}</Latin>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Doctors */}
        <section>
          <SectionTitle
            title={t("home.doctorsTitle")}
            action={
              <Link to="/doctors" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-800 hover:underline">
                {t("action.allDoctors")} <FaArrowRight aria-hidden="true" className="rtl:rotate-180" />
              </Link>
            }
          />
          {doctorsStatus === "loading" && !doctors.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("doctors.loading")}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((d) => (
                <DoctorCard key={d._id} doctor={d} />
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section>
          <SectionTitle title={t("home.howTitle")} />
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  <Latin>{i + 1}</Latin>
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <TrackToken />
      </Container>
    </>
  );
};

export default Home;
