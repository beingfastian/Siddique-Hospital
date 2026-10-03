// Rescheduling and whole-day actions, shared by the admin and doctor routes.
// A doctor can only act on their own appointments; the admin can act on any.
// When one side makes a change, the other side gets an in-app notification.
import appointmentModel from "../model/appointmentModel.js";
import { createNotification } from "./notificationController.js";
import { formatSlotDate } from "../utils/slots.js";
import {
  AppointmentError,
  moveAppointment,
  rescheduleDay,
  cancelDay,
} from "../services/appointmentService.js";

const actorOf = (req, role) => (role === "doctor" ? { role: "doctor", id: req.doctorId } : { role: "admin" });

// Notify the side that didn't make the change
const notifyOtherSide = async (req, role, doctorId, type, title, message, relatedId) => {
  try {
    const toAdmin = role === "doctor";
    const notification = await createNotification(
      toAdmin ? "admin" : doctorId,
      toAdmin ? "admin" : "doctor",
      toAdmin ? doctorId : "admin",
      toAdmin ? "doctor" : "admin",
      type,
      title,
      message,
      "medium",
      relatedId
    );
    req.app.get("io")?.to(toAdmin ? "admin" : `doctor_${doctorId}`).emit("newNotification", notification);
  } catch (error) {
    console.error("Could not create notification:", error.message);
  }
};

const fail = (res, error) => {
  if (!(error instanceof AppointmentError)) console.error(error);
  res.json({ success: false, message: error.message });
};

// POST { appointmentId, slotDate, slotTime, reason? }
export const rescheduleOne = (role) => async (req, res) => {
  try {
    const { appointmentId, slotDate, slotTime, reason } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment || (role === "doctor" && appointment.docId !== req.doctorId)) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    const updated = await moveAppointment(appointmentId, slotDate, slotTime, actorOf(req, role), { reason });
    const when = `${formatSlotDate(updated.slotDate)} at ${updated.slotTime}`;

    await notifyOtherSide(
      req, role, updated.docId,
      "appointment_rescheduled",
      "Appointment Rescheduled",
      `${updated.userData?.name}'s appointment was moved to ${when}${reason ? ` (${reason})` : ""}.`,
      appointmentId
    );
    res.json({ success: true, message: `Moved to ${when}`, appointment: updated });
  } catch (error) {
    fail(res, error);
  }
};

// POST { docId (admin only), fromSlotDate, toSlotDate, reason? }
export const rescheduleWholeDay = (role) => async (req, res) => {
  try {
    const docId = role === "doctor" ? req.doctorId : req.body.docId;
    const { fromSlotDate, toSlotDate, reason } = req.body;
    const result = await rescheduleDay({ docId, fromSlotDate, toSlotDate, actor: actorOf(req, role), reason });

    if (result.moved.length) {
      await notifyOtherSide(
        req, role, docId,
        "appointment_rescheduled",
        "Day Rescheduled",
        `${result.moved.length} appointment(s) moved from ${formatSlotDate(fromSlotDate)} to ${formatSlotDate(toSlotDate)}` +
          (result.notMoved.length ? `; ${result.notMoved.length} could not be moved` : "") + ".",
        docId
      );
    }
    res.json({ success: true, ...result });
  } catch (error) {
    fail(res, error);
  }
};

// POST { docId (admin only), slotDate, reason? }
export const cancelWholeDay = (role) => async (req, res) => {
  try {
    const docId = role === "doctor" ? req.doctorId : req.body.docId;
    const { slotDate, reason } = req.body;
    const result = await cancelDay({
      docId,
      slotDate,
      actor: actorOf(req, role),
      reason,
      cancelledBy: role === "doctor" ? "your doctor" : "the hospital",
    });

    if (result.cancelled.length) {
      await notifyOtherSide(
        req, role, docId,
        "appointment_cancelled",
        "Day Cancelled",
        `${result.cancelled.length} appointment(s) on ${formatSlotDate(slotDate)} were cancelled` +
          (reason ? ` (${reason})` : "") + ".",
        docId
      );
    }
    res.json({ success: true, ...result });
  } catch (error) {
    fail(res, error);
  }
};
