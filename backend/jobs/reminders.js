// Automatic WhatsApp appointment reminders.
//
//   REMINDER_DAY_BEFORE_AT=19:00  patient reminder the evening before (hospital time); empty = off
//   REMINDER_MINUTES_BEFORE=60    patient + doctor reminder this long before; 0 = off
//   REMINDERS_ENABLED=false       turns the scheduler off
//
// Checks every 5 minutes. Each reminder is claimed atomically on the appointment
// (reminders.dayBefore / reminders.beforeStart) before sending, so it is sent at
// most once even if two server instances run. A reminder whose time already
// passed when the appointment was booked is skipped (the confirmation covers it).
// Note: a sleeping free-tier server (e.g. Render free) can't send reminders while asleep.
import appointmentModel from "../model/appointmentModel.js";
import userModel from "../model/userModel.js";
import doctorModel from "../model/doctorModel.js";
import { slotToDate, hospitalSlotDate, HOSPITAL_UTC_OFFSET_MINUTES } from "../utils/slots.js";
import {
  isWhatsAppConfigured,
  sendWhatsAppReminder,
  sendDoctorWhatsAppReminder,
} from "../config/whatsappService.js";
import { patientLanguage } from "../whatsapp/templates.js";

const CHECK_EVERY_MS = 5 * 60 * 1000;

const dayBeforeAt = () => {
  const match = /^(\d{1,2}):(\d{2})$/.exec((process.env.REMINDER_DAY_BEFORE_AT ?? "19:00").trim());
  return match ? { hours: Number(match[1]), minutes: Number(match[2]) } : null;
};
const minutesBefore = () => Number(process.env.REMINDER_MINUTES_BEFORE ?? 60);

// The evening-before moment for an appointment, in hospital time
const dayBeforeMoment = (appointmentAt, at) => {
  const local = new Date(appointmentAt.getTime() + HOSPITAL_UTC_OFFSET_MINUTES * 60000);
  const utcMs =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - 1, at.hours, at.minutes) -
    HOSPITAL_UTC_OFFSET_MINUTES * 60000;
  return new Date(utcMs);
};

// Mark a reminder as handled; returns false if another run already claimed it
const claim = async (appointmentId, field) => {
  const updated = await appointmentModel.findOneAndUpdate(
    { _id: appointmentId, [`reminders.${field}`]: { $exists: false } },
    { $set: { [`reminders.${field}`]: new Date() } }
  );
  return Boolean(updated);
};

const sendPatientReminder = async (apt) => {
  const patient = await userModel.findById(apt.userId).select("name whatsappEnabled whatsappNumber phone language");
  if (patient?.whatsappEnabled) {
    await sendWhatsAppReminder(
      patient.whatsappNumber || patient.phone,
      patient.name,
      apt.docData?.name,
      apt.slotDate,
      apt.slotTime,
      patientLanguage(patient)
    );
  }
};

const sendDoctorReminder = async (apt) => {
  const doctor = await doctorModel.findById(apt.docId).select("whatsappEnabled whatsappNumber");
  if (doctor?.whatsappEnabled && doctor.whatsappNumber) {
    await sendDoctorWhatsAppReminder(doctor.whatsappNumber, apt.userData?.name, apt.slotDate, apt.slotTime);
  }
};

export const runReminderCheck = async (now = new Date()) => {
  // Only today's and tomorrow's appointments can be due
  const appointments = await appointmentModel.find({
    slotDate: { $in: [hospitalSlotDate(now, 0), hospitalSlotDate(now, 1)] },
    cancelled: false,
    isCompleted: false,
    status: { $ne: "no_show" },
  });

  const evening = dayBeforeAt();
  const before = minutesBefore();
  let sent = 0;

  for (const apt of appointments) {
    const startsAt = slotToDate(apt.slotDate, apt.slotTime);
    if (!startsAt || startsAt <= now) continue;
    const bookedAt = new Date(apt.date);

    if (evening && !apt.reminders?.dayBefore) {
      const dueAt = dayBeforeMoment(startsAt, evening);
      if (now >= dueAt && (await claim(apt._id, "dayBefore"))) {
        // Skip if the appointment was booked after the reminder time
        if (bookedAt < dueAt) {
          await sendPatientReminder(apt);
          sent++;
        }
      }
    }

    if (before > 0 && !apt.reminders?.beforeStart) {
      const dueAt = new Date(startsAt.getTime() - before * 60000);
      if (now >= dueAt && (await claim(apt._id, "beforeStart"))) {
        if (bookedAt < dueAt) {
          await sendPatientReminder(apt);
          await sendDoctorReminder(apt);
          sent++;
        }
      }
    }
  }

  if (sent) console.log(`Reminders: sent for ${sent} appointment(s)`);
  return sent;
};

export const startReminderScheduler = () => {
  if (process.env.REMINDERS_ENABLED === "false") {
    console.log("Reminders: disabled (REMINDERS_ENABLED=false)");
    return;
  }
  if (!isWhatsAppConfigured()) {
    console.log("Reminders: WhatsApp not configured, scheduler not started");
    return;
  }
  const run = () => runReminderCheck().catch((error) => console.error("Reminder check failed:", error.message));
  setTimeout(run, 30 * 1000); // shortly after startup, once the database is connected
  setInterval(run, CHECK_EVERY_MS);
  console.log(
    `Reminders: on (evening before at ${process.env.REMINDER_DAY_BEFORE_AT ?? "19:00"}, ` +
    `${minutesBefore()} min before; checked every 5 min)`
  );
};
