import { useContext } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { AppContext } from "../context/AppContext";
import { useLanguage } from "../i18n";
import { DoctorPhoto, StatusPill, doctorStatus, formatTime, whatsappUrl, buttonClass } from "./site";

// Latin text (names, numbers) inside Urdu pages keeps its own font and direction
export const Latin = ({ children, className = "" }) => (
  <bdi dir="ltr" lang="en" className={`font-sans ${className}`}>
    {children}
  </bdi>
);

const DoctorCard = ({ doctor }) => {
  const { lang, t, speciality, dayShort, dayFull } = useLanguage();
  const { currencySymbol } = useContext(AppContext);
  const status = doctorStatus(doctor);
  const bookable = doctor.available !== false;
  const days = doctor.sittingDays?.length ? doctor.sittingDays.map(dayShort).join(lang === "ur" ? "، " : ", ") : null;
  const hours = doctor.timings?.start && doctor.timings?.end ? `${formatTime(doctor.timings.start)} – ${formatTime(doctor.timings.end)}` : null;

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <DoctorPhoto doctor={doctor} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900">
            <Latin>Dr. {doctor.name}</Latin>
          </h3>
          <p className="truncate text-sm text-slate-600">{speciality(doctor.speciality)}</p>
          {(doctor.degree || doctor.experience) && (
            <p className="truncate text-xs text-slate-500">
              <Latin>{[doctor.degree, doctor.experience].filter(Boolean).join(" · ")}</Latin>
            </p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <StatusPill status={status} t={t} dayFull={dayFull} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">{t("doctors.fee")}</dt>
          <dd className="font-medium tabular-nums text-slate-900">
            <Latin>
              {currencySymbol} {Number(doctor.fee || 0).toLocaleString("en-PK")}
            </Latin>
          </dd>
        </div>
        <div className="col-span-2 min-w-0">
          <dt className="text-xs text-slate-500">{hours ? t("doctors.hours") : t("doctors.days")}</dt>
          <dd className="text-slate-900">
            {hours ? <Latin className="tabular-nums">{hours}</Latin> : t("status.contact")}
          </dd>
        </div>
        {days && (
          <div className="col-span-3 min-w-0">
            <dt className="text-xs text-slate-500">{t("doctors.days")}</dt>
            <dd className="text-slate-900">{days}</dd>
          </div>
        )}
      </dl>

      <div className="mt-auto pt-4">
        {bookable ? (
          <a
            href={whatsappUrl(t("wa.doctor", { name: doctor.name, speciality: speciality(doctor.speciality) }))}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("whatsapp", "md", "w-full")}
          >
            <FaWhatsapp aria-hidden="true" /> {t("doctors.request")}
          </a>
        ) : (
          <p className="rounded-lg bg-slate-100 py-2.5 text-center text-sm text-slate-600">{t("doctors.unavailable")}</p>
        )}
      </div>
    </article>
  );
};

export default DoctorCard;
