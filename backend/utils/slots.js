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
