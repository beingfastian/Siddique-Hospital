// WhatsApp messaging. The provider is chosen by WHATSAPP_PROVIDER in .env:
//   kapso / meta -> WhatsApp Cloud API with approved templates (see whatsapp/templates.js)
//   twilio       -> Twilio (sandbox or sender), template text sent as plain messages
// Every function returns { success, messageId?, error? } and never throws.
import twilio from "twilio";
import { formatSlotDate } from "../utils/slots.js";
import { HOSPITAL_PHONE } from "./hospital.js";
import { renderTemplate } from "../whatsapp/templates.js";
import { normalizePhone } from "../whatsapp/phone.js";
import {
  isCloudApiConfigured,
  cloudProviderName,
  sendTemplate,
  sendText,
} from "../whatsapp/cloudApi.js";

const HOSPITAL_NAME = process.env.HOSPITAL_NAME || "Siddique Hospital";

const isTwilioConfigured = () =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  );

// Which provider is active: "kapso" | "meta" | "twilio" | null
export const getWhatsAppProvider = () => {
  const wanted = (process.env.WHATSAPP_PROVIDER || "").toLowerCase();
  if ((wanted === "kapso" || wanted === "meta") && isCloudApiConfigured()) return cloudProviderName();
  if ((wanted === "twilio" || !wanted) && isTwilioConfigured()) return "twilio";
  return null;
};

export const isWhatsAppConfigured = () => getWhatsAppProvider() !== null;

let twilioClient = null;
const getTwilioClient = () => {
  if (!twilioClient) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

const sendViaTwilio = async (to, body) => {
  const result = await getTwilioClient().messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${normalizePhone(to)}`,
    body,
  });
  return { success: true, messageId: result.sid };
};

// Send one of the templates in whatsapp/templates.js through the active provider
const sendTemplated = async (to, templateName, params) => {
  try {
    const provider = getWhatsAppProvider();
    if (!provider) {
      return { success: false, error: "WhatsApp is not configured" };
    }
    if (!normalizePhone(to)) {
      return { success: false, error: "No phone number" };
    }
    const result =
      provider === "twilio"
        ? await sendViaTwilio(to, renderTemplate(templateName, params))
        : await sendTemplate(to, templateName, params);
    console.log(`WhatsApp ${templateName} sent via ${provider}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`WhatsApp ${templateName} failed:`, error.message);
    return { success: false, error: error.message };
  }
};

// Free-form reply, e.g. the STATUS/CANCEL bot answering a patient's message.
// Only valid within 24 hours of that person's last message.
export const sendWhatsAppText = async (to, body) => {
  try {
    const provider = getWhatsAppProvider();
    if (!provider) return { success: false, error: "WhatsApp is not configured" };
    return provider === "twilio" ? await sendViaTwilio(to, body) : await sendText(to, body);
  } catch (error) {
    console.error("WhatsApp text failed:", error.message);
    return { success: false, error: error.message };
  }
};

// Appointment confirmation to the patient
export const sendWhatsAppConfirmation = (phoneNumber, userName, doctorName, doctorSpecialty, appointmentDate, appointmentTime, fee) =>
  sendTemplated(phoneNumber, "appointment_confirmation", [
    userName,
    HOSPITAL_NAME,
    doctorName,
    doctorSpecialty,
    formatSlotDate(appointmentDate),
    appointmentTime,
    fee,
    HOSPITAL_PHONE,
  ]);

// New-appointment notice to the doctor
export const sendDoctorWhatsAppConfirmation = (phoneNumber, doctorName, patientName, patientPhone, appointmentDate, appointmentTime) =>
  sendTemplated(phoneNumber, "appointment_confirmation_doctor", [
    HOSPITAL_NAME,
    patientName,
    normalizePhone(patientPhone) || "Not provided",
    formatSlotDate(appointmentDate),
    appointmentTime,
  ]);

// Reminder to the patient
export const sendWhatsAppReminder = (phoneNumber, userName, doctorName, appointmentDate, appointmentTime) =>
  sendTemplated(phoneNumber, "appointment_reminder", [
    HOSPITAL_NAME,
    userName,
    doctorName,
    formatSlotDate(appointmentDate),
    appointmentTime,
    HOSPITAL_PHONE,
  ]);

// Reminder to the doctor
export const sendDoctorWhatsAppReminder = (phoneNumber, patientName, appointmentDate, appointmentTime) =>
  sendTemplated(phoneNumber, "appointment_reminder_doctor", [
    HOSPITAL_NAME,
    patientName,
    formatSlotDate(appointmentDate),
    appointmentTime,
  ]);

// Cancellation notice to the patient. cancelledBy: e.g. "the hospital" or "your doctor"
export const sendWhatsAppCancellation = (phoneNumber, userName, doctorName, appointmentDate, appointmentTime, cancelledBy) =>
  sendTemplated(phoneNumber, "appointment_cancelled", [
    userName,
    doctorName,
    formatSlotDate(appointmentDate),
    appointmentTime,
    cancelledBy,
    HOSPITAL_PHONE,
  ]);
