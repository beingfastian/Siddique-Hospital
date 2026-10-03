// Every change to an appointment goes through this service: booking, follow-ups,
// completing, cancelling and moving (rescheduling). It keeps the slot reservation,
// status fields, history and notifications consistent no matter who made the change.
import appointmentModel from "../model/appointmentModel.js";
import doctorModel from "../model/doctorModel.js";
import userModel from "../model/userModel.js";
import {
  isValidSlotDate,
  normalizeSlotTime,
  slotToDate,
  reserveSlot,
  releaseSlot,
  HOSPITAL_UTC_OFFSET_MINUTES,
} from "../utils/slots.js";
import {
  sendWhatsAppConfirmation,
  sendDoctorWhatsAppConfirmation,
  sendWhatsAppCancellation,
} from "../config/whatsappService.js";
import {
  sendUserAppointmentConfirmation,
  sendDoctorAppointmentNotification,
} from "../config/emailService.js";

// An error whose message is safe to show to staff
export class AppointmentError extends Error {}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Appointments that can still change (also matches records from before `status` existed)
const ACTIVE = { cancelled: { $ne: true }, isCompleted: { $ne: true } };

// Same rules as admin/src/utils/slots.js: valid format, in the future, doctor available,
// on one of the doctor's sitting days and within their timings.
// Returns { slotDate, slotTime (normalized), startAt }.
export const validateSlot = (doctor, slotDate, slotTime, now = new Date()) => {
  const time = normalizeSlotTime(slotTime);
  if (!isValidSlotDate(slotDate) || !time) {
    throw new AppointmentError("Please select a date and time slot");
  }
  const startAt = slotToDate(slotDate, time);
  if (!startAt) throw new AppointmentError("Invalid date or time");
  if (startAt <= now) throw new AppointmentError("That time has already passed");
  if (!doctor.available) throw new AppointmentError("Doctor is not available for appointments");

  // Day and time in hospital time
  const local = new Date(startAt.getTime() + HOSPITAL_UTC_OFFSET_MINUTES * 60000);
  const day = DAY_NAMES[local.getUTCDay()];
  if (doctor.sittingDays?.length && !doctor.sittingDays.includes(day)) {
    throw new AppointmentError(`Dr. ${doctor.name} doesn't see patients on ${day[0].toUpperCase() + day.slice(1)}`);
  }
  if (doctor.timings?.start && doctor.timings?.end) {
    const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
    if (minutes < toMinutes(doctor.timings.start) || minutes >= toMinutes(doctor.timings.end)) {
      throw new AppointmentError(
        `Dr. ${doctor.name} sees patients from ${doctor.timings.start} to ${doctor.timings.end}`
      );
    }
  }
  return { slotDate, slotTime: time, startAt };
};

const historyEntry = (action, actor, extra = {}) => ({ at: new Date(), by: actor, action, ...extra });

// Create an appointment: validate, reserve the slot atomically, save.
// actor: { role: "admin" | "doctor" | "patient" | "system", id }
export const bookAppointment = async ({
  patient,
  doctor,
  slotDate,
  slotTime,
  amount,
  discountPercent,
  finalFee,
  type = "new",
  parentAppointmentId,
  actor,
}) => {
  const slot = validateSlot(doctor, slotDate, slotTime);
  const docId = doctor._id.toString();

  if (!(await reserveSlot(docId, slot.slotDate, slot.slotTime))) {
    throw new AppointmentError("Selected time slot is not available");
  }

  const docSnapshot = doctor.toObject ? doctor.toObject() : { ...doctor };
  delete docSnapshot.slots_booked;
  delete docSnapshot.password;
  const userSnapshot = patient.toObject ? patient.toObject() : { ...patient };
  delete userSnapshot.password;

  try {
    return await appointmentModel.create({
      userId: patient._id.toString(),
      docId,
      slotDate: slot.slotDate,
      slotTime: slot.slotTime,
      startAt: slot.startAt,
      userData: userSnapshot,
      docData: docSnapshot,
      amount: amount ?? doctor.fee,
      date: Date.now(),
      status: "booked",
      type,
      ...(parentAppointmentId && { parentAppointmentId }),
      createdBy: actor,
      history: [
        historyEntry(type === "follow_up" ? "follow_up_booked" : "booked", actor, {
          to: { slotDate: slot.slotDate, slotTime: slot.slotTime },
        }),
      ],
      ...(discountPercent && { discountPercent }),
      ...(finalFee && { finalFee }),
    });
  } catch (error) {
    await releaseSlot(docId, slot.slotDate, slot.slotTime);
    throw error;
  }
};

// WhatsApp + email confirmations. Returns WhatsApp results for the admin screen.
export const sendBookingNotifications = async (appointment, patient, doctor, { notifyDoctor = true } = {}) => {
  const { slotDate, slotTime, amount } = appointment;
  const patientPhone = patient.whatsappNumber || patient.phone;
  const results = {
    patient: { sent: false, error: null, enabled: Boolean(patient.whatsappEnabled), phone: patientPhone },
    doctor: { sent: false, error: null, enabled: Boolean(doctor.whatsappEnabled), phone: doctor.whatsappNumber },
  };

  const tasks = [];
  if (patient.whatsappEnabled && patientPhone) {
    tasks.push(
      sendWhatsAppConfirmation(patientPhone, patient.name, doctor.name, doctor.speciality, slotDate, slotTime, amount)
        .then((r) => Object.assign(results.patient, { sent: r.success, error: r.success ? null : r.error }))
    );
  }
  if (notifyDoctor && doctor.whatsappEnabled && doctor.whatsappNumber) {
    tasks.push(
      sendDoctorWhatsAppConfirmation(doctor.whatsappNumber, doctor.name, patient.name, patientPhone, slotDate, slotTime)
        .then((r) => Object.assign(results.doctor, { sent: r.success, error: r.success ? null : r.error }))
    );
  }
  if (patient.email) {
    tasks.push(
      sendUserAppointmentConfirmation(patient.email, patient.name, doctor.name, doctor.speciality, slotDate, slotTime, amount)
    );
  }
  if (notifyDoctor && doctor.email) {
    tasks.push(
      sendDoctorAppointmentNotification(doctor.email, doctor.name, patient.name, patient.email || "Not provided", slotDate, slotTime, amount)
    );
  }
  await Promise.allSettled(tasks);
  return results;
};

// Mark as completed. Only an active appointment can be completed.
export const completeAppointment = async (appointmentId, actor) => {
  const updated = await appointmentModel.findOneAndUpdate(
    { _id: appointmentId, ...ACTIVE },
    {
      $set: { status: "completed", isCompleted: true },
      $push: { history: historyEntry("completed", actor) },
    },
    { new: true }
  );
  if (!updated) throw new AppointmentError("This appointment can't be completed (already completed or cancelled)");
  return updated;
};

// Cancel, free the slot, and tell the patient (if they agreed to WhatsApp).
// cancelledBy: wording for the patient message, e.g. "the hospital" or "your doctor"
export const cancelAppointment = async (appointmentId, actor, { reason, cancelledBy, notifyPatient = true } = {}) => {
  const updated = await appointmentModel.findOneAndUpdate(
    { _id: appointmentId, ...ACTIVE },
    {
      $set: { status: "cancelled", cancelled: true },
      $push: { history: historyEntry("cancelled", actor, { ...(reason && { reason }) }) },
    },
    { new: true }
  );
  if (!updated) throw new AppointmentError("This appointment can't be cancelled (already completed or cancelled)");

  await releaseSlot(updated.docId, updated.slotDate, updated.slotTime);

  if (notifyPatient) {
    const patient = await userModel.findById(updated.userId).select("name whatsappEnabled whatsappNumber phone");
    if (patient?.whatsappEnabled) {
      await sendWhatsAppCancellation(
        patient.whatsappNumber || patient.phone,
        patient.name,
        updated.docData?.name,
        updated.slotDate,
        updated.slotTime,
        cancelledBy || "the hospital"
      );
    }
  }
  return updated;
};

// Move an active appointment to a new time with the same doctor.
// Order: reserve the new slot -> update the appointment -> release the old slot,
// so a failure never leaves the patient without a slot. Reminders are reset.
export const moveAppointment = async (appointmentId, newSlotDate, newSlotTime, actor, { reason } = {}) => {
  const appointment = await appointmentModel.findOne({ _id: appointmentId, ...ACTIVE });
  if (!appointment) throw new AppointmentError("This appointment can't be moved (already completed or cancelled)");

  const doctor = await doctorModel.findById(appointment.docId).select("-password");
  if (!doctor) throw new AppointmentError("Doctor not found");
  const slot = validateSlot(doctor, newSlotDate, newSlotTime);
  if (slot.slotDate === appointment.slotDate && slot.slotTime === appointment.slotTime) {
    throw new AppointmentError("The new time is the same as the current one");
  }

  if (!(await reserveSlot(appointment.docId, slot.slotDate, slot.slotTime))) {
    throw new AppointmentError("Selected time slot is not available");
  }

  const from = { slotDate: appointment.slotDate, slotTime: appointment.slotTime };
  const updated = await appointmentModel.findOneAndUpdate(
    { _id: appointmentId, ...ACTIVE, slotDate: from.slotDate, slotTime: from.slotTime },
    {
      $set: { slotDate: slot.slotDate, slotTime: slot.slotTime, startAt: slot.startAt },
      $unset: { reminders: 1 },
      $push: {
        history: historyEntry("rescheduled", actor, {
          from,
          to: { slotDate: slot.slotDate, slotTime: slot.slotTime },
          ...(reason && { reason }),
        }),
      },
    },
    { new: true }
  );
  if (!updated) {
    // Someone changed it meanwhile: give the new slot back
    await releaseSlot(appointment.docId, slot.slotDate, slot.slotTime);
    throw new AppointmentError("The appointment was changed by someone else. Please refresh and try again.");
  }

  await releaseSlot(appointment.docId, from.slotDate, from.slotTime);
  return updated;
};

// Follow-up visits are free within this many days of the original visit (0 = always charge)
const followUpFreeDays = () => Number(process.env.FOLLOW_UP_FREE_DAYS ?? 0);

// A doctor schedules a follow-up from one of their own appointments.
export const bookFollowUp = async ({ parentAppointmentId, doctorId, slotDate, slotTime }) => {
  const parent = await appointmentModel.findById(parentAppointmentId);
  if (!parent || parent.docId !== doctorId) throw new AppointmentError("Appointment not found");
  if (parent.cancelled) throw new AppointmentError("Can't schedule a follow-up for a cancelled appointment");

  const [patient, doctor] = await Promise.all([
    userModel.findById(parent.userId).select("-password"),
    doctorModel.findById(doctorId).select("-password"),
  ]);
  if (!patient) throw new AppointmentError("Patient no longer exists");
  if (!doctor) throw new AppointmentError("Doctor not found");

  // Free if within the follow-up window of the original visit
  const freeDays = followUpFreeDays();
  const parentStart = parent.startAt || slotToDate(parent.slotDate, parent.slotTime);
  const newStart = slotToDate(slotDate, normalizeSlotTime(slotTime) || "");
  const isFree =
    freeDays > 0 && parentStart && newStart && newStart - parentStart <= freeDays * 86400000;

  return bookAppointment({
    patient,
    doctor,
    slotDate,
    slotTime,
    amount: isFree ? 0 : doctor.fee,
    type: "follow_up",
    parentAppointmentId: parent._id.toString(),
    actor: { role: "doctor", id: doctorId },
  }).then((appointment) => ({ appointment, patient, doctor }));
};
