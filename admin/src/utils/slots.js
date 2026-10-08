// Shared slot rules for every booking screen (admin booking, doctor follow-up),
// so all of them offer exactly the same times. The backend checks the same rules.

export const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const SLOT_MINUTES = 30;

// "d_m_yyyy", the format slots are stored in
export const toSlotDate = (date) => `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

// "09:30 AM", the format slot times are stored in
export const formatSlotTime = (date) =>
  date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

// "yyyy-mm-dd" of a local date (leave dates use this format)
export const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// doctor.leaves: [{ from: "yyyy-mm-dd", to: "yyyy-mm-dd" }] (approved leave, sent by the backend)
export const isOnLeave = (doctor, date) => {
  const day = toIsoDate(date);
  return (doctor.leaves || []).some((leave) => day >= leave.from && day <= leave.to);
};

// "d_m_yyyy" <-> "yyyy-mm-dd" (for <input type="date">)
export const slotDateToIso = (slotDate) => {
  const [d, m, y] = slotDate.split("_");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};
export const isoToSlotDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}_${m}_${y}`;
};

// Bookable times for one doctor on one day: within the doctor's sitting days and
// timings, not already booked, and not in the past.
export const getDaySlots = (doctor, date, now = new Date()) => {
  if (doctor.sittingDays?.length && !doctor.sittingDays.includes(DAY_NAMES[date.getDay()])) {
    return [];
  }
  if (isOnLeave(doctor, date)) return [];
  const [startHour, startMinute] = (doctor.timings?.start || "10:00").split(":").map(Number);
  const [endHour, endMinute] = (doctor.timings?.end || "21:00").split(":").map(Number);
  const start = new Date(date);
  start.setHours(startHour, startMinute, 0, 0);
  const end = new Date(date);
  end.setHours(endHour, endMinute, 0, 0);

  const booked = doctor.slots_booked?.[toSlotDate(date)] || [];
  const slots = [];
  for (const t = new Date(start); t < end; t.setMinutes(t.getMinutes() + SLOT_MINUTES)) {
    if (t <= now) continue;
    const time = formatSlotTime(t);
    if (!booked.includes(time)) slots.push({ datetime: new Date(t), time });
  }
  return slots;
};

// Days (from today) that have at least one free slot, each with its slots
export const getUpcomingSlots = (doctor, days = 30, now = new Date()) => {
  const result = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const slots = getDaySlots(doctor, date, now);
    if (slots.length) result.push({ date, slots });
  }
  return result;
};

// Has the appointment's time arrived? (startAt from the server; older records fall
// back to "d_m_yyyy" + "hh:mm AM", read in this computer's time zone)
export const hasStarted = (appointment, now = new Date()) => {
  if (appointment.startAt) return new Date(appointment.startAt) <= now;
  const [day, month, year] = String(appointment.slotDate || "").split("_").map(Number);
  const match = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(String(appointment.slotTime || "").trim());
  if (!day || !month || !year || !match) return true;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return new Date(year, month - 1, day, hours, Number(match[2])) <= now;
};
