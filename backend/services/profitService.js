// Fee split between the hospital and its doctors, and the profit reports.
//
// Each doctor has hospitalSharePercent (the agreed share of every consultation fee).
// When a visit is completed, the split is saved on the visit (appointment.share),
// so changing a doctor's share later never rewrites past profit. Visits completed
// before shares existed are split with the doctor's current share and counted as
// "estimated" in the report.
//
// Money is whole rupees: hospital = round(fee x percent / 100), doctor = fee - hospital,
// so the two parts always add up to the fee exactly.
import appointmentModel from "../model/appointmentModel.js";
import doctorModel from "../model/doctorModel.js";
import { HOSPITAL_UTC_OFFSET_MINUTES, slotToDate } from "../utils/slots.js";

// An error whose message is safe to show
export class ProfitError extends Error {}

// "25", 25, "22.5", "25%" -> 25 / 22.5 (0..100, at most 2 decimals). Throws on anything else.
export const parsePercent = (value) => {
  const text = String(value ?? "").trim().replace(/\s*%$/, "");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) throw new ProfitError("Hospital share must be a percentage from 0 to 100, e.g. 25");
  const number = Number(text);
  if (number < 0 || number > 100) throw new ProfitError("Hospital share must be between 0 and 100%");
  return number;
};

// fee 1000, 25% -> { percent: 25, hospital: 250, doctor: 750 }
export const splitFee = (amount, percent) => {
  const fee = Math.max(0, Math.round(Number(amount) || 0));
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  const hospital = Math.round((fee * pct) / 100);
  return { percent: pct, hospital, doctor: fee - hospital };
};

// The split to save on a visit that is being completed (its doctor's current share)
export const shareForCompletion = async (appointment) => {
  const doctor = await doctorModel.findById(appointment.docId).select("hospitalSharePercent").lean();
  return splitFee(appointment.amount, doctor?.hospitalSharePercent ?? 0);
};

// A visit's split: the saved one, or (older visits) worked out with the doctor's current share
export const visitSplit = (visit, currentPercent) =>
  visit.share && typeof visit.share.hospital === "number" && typeof visit.share.doctor === "number"
    ? { percent: visit.share.percent, hospital: visit.share.hospital, doctor: visit.share.doctor, estimated: false }
    : { ...splitFee(visit.amount, currentPercent ?? 0), estimated: true };

// --- Periods, in hospital time ---

const DAY_MS = 86400000;
const offsetMs = () => HOSPITAL_UTC_OFFSET_MINUTES * 60000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// "yyyy-mm-dd" -> the UTC moment that day starts in hospital time (null if not a real date)
const dayStart = (iso) => {
  const m = ISO_DATE.exec(iso || "");
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (new Date(ms).getUTCDate() !== Number(m[3])) return null; // e.g. 2026-02-31
  return ms - offsetMs();
};

// A moment shifted so its UTC parts are the hospital's local date and time
const local = (moment) => new Date(new Date(moment).getTime() + offsetMs());
const isoOf = (d) => d.toISOString().slice(0, 10);
export const hospitalToday = () => isoOf(local(Date.now()));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabel = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;

// Key and label of the period (day / week starting Monday / month) a moment falls in
const periodOf = (moment, groupBy) => {
  const d = local(moment);
  if (groupBy === "month") {
    return {
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    };
  }
  if (groupBy === "week") {
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
    return { key: isoOf(monday), label: `Week of ${dayLabel(monday)}` };
  }
  return { key: isoOf(d), label: dayLabel(d) };
};

// Every period between two hospital days (both included), in order, so empty ones show as 0
const periodsBetween = (fromIso, toIso, groupBy) => {
  const out = [];
  const seen = new Set();
  for (let ms = dayStart(fromIso); ms <= dayStart(toIso); ms += DAY_MS) {
    const p = periodOf(ms, groupBy);
    if (!seen.has(p.key)) {
      seen.add(p.key);
      out.push(p);
    }
  }
  return out;
};

const MAX_DAYS = 731; // two years

// Profit report.
//   from, to: "yyyy-mm-dd" hospital days (both included; default today)
//   docId:    one doctor, or all doctors when empty
//   groupBy:  "day" | "week" | "month" (a range over a year is shown by month)
// A visit counts on the day it took place, once it is completed.
export const profitReport = async ({ from, to, docId, groupBy = "day" } = {}) => {
  const today = hospitalToday();
  from = from || today;
  to = to || from;
  const start = dayStart(from);
  const endDay = dayStart(to);
  if (start === null || endDay === null) throw new ProfitError("Please choose valid dates");
  if (endDay < start) throw new ProfitError("The end date is before the start date");
  const days = Math.round((endDay - start) / DAY_MS) + 1;
  if (days > MAX_DAYS) throw new ProfitError("Please choose at most two years");
  if (!["day", "week", "month"].includes(groupBy)) groupBy = "day";
  if (groupBy === "day" && days > 366) groupBy = "month";
  const end = endDay + DAY_MS; // exclusive

  const visits = await appointmentModel
    .find({
      isCompleted: true,
      ...(docId && { docId: String(docId) }),
      // Older records without startAt are placed by their slot date below
      $or: [{ startAt: { $gte: new Date(start), $lt: new Date(end) } }, { startAt: { $exists: false } }],
    })
    .select("amount docId startAt slotDate slotTime share docData.name")
    .lean();

  const doctors = await doctorModel.find(docId ? { _id: docId } : {}).select("name speciality hospitalSharePercent").lean();
  const doctorById = new Map(doctors.map((d) => [String(d._id), d]));

  const periods = periodsBetween(from, to, groupBy);
  const series = new Map(periods.map((p) => [p.key, { ...p, visits: 0, fees: 0, hospital: 0, doctor: 0 }]));
  const byDoctor = new Map();
  const totals = { visits: 0, fees: 0, hospital: 0, doctor: 0 };
  let estimated = 0;

  const add = (target, split) => {
    target.visits++;
    target.fees += split.hospital + split.doctor;
    target.hospital += split.hospital;
    target.doctor += split.doctor;
  };

  for (const visit of visits) {
    const at = visit.startAt ? new Date(visit.startAt) : slotToDate(visit.slotDate, visit.slotTime);
    if (!at || at.getTime() < start || at.getTime() >= end) continue;
    const doctor = doctorById.get(visit.docId);
    const split = visitSplit(visit, doctor?.hospitalSharePercent);
    if (split.estimated) estimated++;

    const period = series.get(periodOf(at, groupBy).key);
    if (period) add(period, split);
    add(totals, split);

    if (!byDoctor.has(visit.docId)) {
      byDoctor.set(visit.docId, {
        docId: visit.docId,
        name: doctor?.name || visit.docData?.name || "Deleted doctor",
        speciality: doctor?.speciality || "",
        currentPercent: doctor ? doctor.hospitalSharePercent ?? 0 : null,
        visits: 0,
        fees: 0,
        hospital: 0,
        doctor: 0,
      });
    }
    add(byDoctor.get(visit.docId), split);
  }

  // Doctors with no completed visits in the range still appear with 0
  for (const d of doctors) {
    const id = String(d._id);
    if (!byDoctor.has(id)) {
      byDoctor.set(id, {
        docId: id,
        name: d.name,
        speciality: d.speciality,
        currentPercent: d.hospitalSharePercent ?? 0,
        visits: 0,
        fees: 0,
        hospital: 0,
        doctor: 0,
      });
    }
  }

  return {
    from,
    to,
    days,
    groupBy,
    totals,
    series: [...series.values()],
    byDoctor: [...byDoctor.values()].sort((a, b) => b.hospital - a.hospital || a.name.localeCompare(b.name)),
    // Completed before shares were recorded: split with the doctor's current share
    estimatedVisits: estimated,
    doctorsWithoutShare: doctors.filter((d) => !d.hospitalSharePercent).map((d) => d.name),
  };
};
