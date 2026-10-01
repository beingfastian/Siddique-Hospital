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
