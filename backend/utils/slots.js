import doctorModel from "../model/doctorModel.js";

// Slot dates are stored as "d_m_yyyy" (e.g. "15_3_2025").
const SLOT_DATE_PATTERN = /^(\d{1,2})_(\d{1,2})_(\d{4})$/;

export const isValidSlotDate = (slotDate) =>
  typeof slotDate === "string" && SLOT_DATE_PATTERN.test(slotDate);

// Parse "d_m_yyyy" as a local date. `new Date("15/3/2025")` would read it as
// month/day and return Invalid Date, so never pass it to the Date constructor.
export const parseSlotDate = (slotDate) => {
  const match = SLOT_DATE_PATTERN.exec(slotDate || "");
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  return new Date(year, month - 1, day);
};

export const formatSlotDate = (slotDate) => {
  const date = parseSlotDate(slotDate);
  if (!date) return slotDate;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Minutes the hospital's local time is ahead of UTC (Pakistan: +5h, no daylight saving).
// Slot dates and times are entered in hospital time, but servers often run in UTC.
export const HOSPITAL_UTC_OFFSET_MINUTES = Number(process.env.HOSPITAL_UTC_OFFSET_MINUTES ?? 300);

// The exact moment of an appointment, from "d_m_yyyy" + "hh:mm AM/PM" in hospital time.
export const slotToDate = (slotDate, slotTime) => {
  const date = SLOT_DATE_PATTERN.exec(slotDate || "");
  const time = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/.exec((slotTime || "").trim());
  if (!date || !time) return null;
  const [, day, month, year] = date.map(Number);
  let hours = Number(time[1]);
  const minutes = Number(time[2]);
  const meridiem = time[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const utcMs = Date.UTC(year, month - 1, day, hours, minutes) - HOSPITAL_UTC_OFFSET_MINUTES * 60000;
  return new Date(utcMs);
};

// Canonical slot time text, e.g. "9:30 am" -> "09:30 AM" (the format slots are stored in)
export const normalizeSlotTime = (slotTime) => {
  const time = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/.exec((slotTime || "").trim());
  if (!time) return null;
  return `${time[1].padStart(2, "0")}:${time[2]} ${time[3].toUpperCase()}`;
};

// All slot times ("09:00 AM", "09:30 AM", ...) within a doctor's timings,
// in the same 30-minute steps the booking screens use.
export const SLOT_MINUTES = 30;
export const dayTimes = (doctor) => {
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const start = toMinutes(doctor.timings?.start || "10:00");
  const end = toMinutes(doctor.timings?.end || "21:00");
  const times = [];
  for (let m = start; m < end; m += SLOT_MINUTES) {
    const h24 = Math.floor(m / 60);
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    times.push(`${String(h12).padStart(2, "0")}:${String(m % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`);
  }
  return times;
};

// "yyyy-mm-dd" of a moment in hospital time (for comparing with leave dates)
export const hospitalIsoDate = (moment) =>
  new Date(moment.getTime() + HOSPITAL_UTC_OFFSET_MINUTES * 60000).toISOString().slice(0, 10);

// "d_m_yyyy" for a moment, as a date in hospital time (daysAhead: 0 = today, 1 = tomorrow)
export const hospitalSlotDate = (moment = new Date(), daysAhead = 0) => {
  const local = new Date(moment.getTime() + HOSPITAL_UTC_OFFSET_MINUTES * 60000 + daysAhead * 86400000);
  return `${local.getUTCDate()}_${local.getUTCMonth() + 1}_${local.getUTCFullYear()}`;
};

// Atomically reserve a slot. Returns false if it is already booked,
// so two simultaneous bookings can't both succeed.
export const reserveSlot = async (docId, slotDate, slotTime) => {
  const path = `slots_booked.${slotDate}`;
  const updated = await doctorModel.findOneAndUpdate(
    { _id: docId, [path]: { $ne: slotTime } },
    { $push: { [path]: slotTime } }
  );
  return Boolean(updated);
};

// Free a previously reserved slot.
export const releaseSlot = async (docId, slotDate, slotTime) => {
  if (!isValidSlotDate(slotDate)) return;
  await doctorModel.findByIdAndUpdate(docId, {
    $pull: { [`slots_booked.${slotDate}`]: slotTime },
  });
};

// --- Urdu wording for patient messages ---

// "ہفتہ، 3 اکتوبر، 2026"
export const formatSlotDateUrdu = (slotDate) => {
  const date = parseSlotDate(slotDate);
  if (!date) return slotDate;
  return date.toLocaleDateString("ur-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

// "06:30 PM" -> "شام 6:30": the part of day is how times are said in Urdu,
// and is clearer than AM/PM for people who don't read English
export const formatSlotTimeUrdu = (slotTime) => {
  const time = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/.exec((slotTime || "").trim());
  if (!time) return slotTime;
  let h24 = Number(time[1]) % 12;
  if (time[3].toUpperCase() === "PM") h24 += 12;
  const part = h24 < 4 ? "رات" : h24 < 12 ? "صبح" : h24 < 16 ? "دوپہر" : h24 < 20 ? "شام" : "رات";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${part} ${h12}:${time[2]}`;
};

// Date and time in a patient's language ("en" | "ur")
export const formatDateFor = (slotDate, lang) => (lang === "ur" ? formatSlotDateUrdu(slotDate) : formatSlotDate(slotDate));
export const formatTimeFor = (slotTime, lang) => (lang === "ur" ? formatSlotTimeUrdu(slotTime) : slotTime);
