// Shared slot rules for every booking screen (admin booking, doctor follow-up),
// so all of them offer exactly the same times. The backend checks the same rules.

export const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const SLOT_MINUTES = 30;

// "d_m_yyyy", the format slots are stored in
export const toSlotDate = (date) => `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

// "09:30 AM", the format slot times are stored in
export const formatSlotTime = (date) =>
  date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

// Bookable times for one doctor on one day: within the doctor's sitting days and
// timings, not already booked, and not in the past.
export const getDaySlots = (doctor, date, now = new Date()) => {
  if (doctor.sittingDays?.length && !doctor.sittingDays.includes(DAY_NAMES[date.getDay()])) {
    return [];
  }
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
