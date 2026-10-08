// WhatsApp messaging. The provider is chosen by WHATSAPP_PROVIDER in .env:
//   kapso / meta -> WhatsApp Cloud API with approved templates (see whatsapp/templates.js)
//   twilio       -> Twilio (sandbox or sender), template text sent as plain messages
// Every function returns { success, messageId?, error? } and never throws.
//
// Patient messages take a language ("en" | "ur", see patientLanguage()). Dates,
// times and fixed words are written in that language. If the Urdu version of a
// template isn't approved yet (or was paused/disabled by Meta), the message is
// sent in English instead, so a patient never misses a message because of it.
import twilio from "twilio";
import { formatSlotDate, formatDateFor, formatTimeFor } from "../utils/slots.js";
import { HOSPITAL_NAME, HOSPITAL_PHONE } from "./hospital.js";
import { renderTemplate, hasLanguage } from "../whatsapp/templates.js";
import { normalizePhone } from "../whatsapp/phone.js";
import {
  isCloudApiConfigured,
  cloudProviderName,
  sendTemplate,
  sendText,
} from "../whatsapp/cloudApi.js";

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

// Meta errors meaning "this template can't be used in this language right now":
// 132001 doesn't exist in the translation, 132015 paused, 132016 disabled
const TEMPLATE_UNAVAILABLE_CODES = new Set([132001, 132015, 132016]);
const isTemplateUnavailable = (error) =>
  TEMPLATE_UNAVAILABLE_CODES.has(Number(error?.code)) ||
  /template name does not exist|does not exist in the translation|template.*(paused|disabled)/i.test(error?.message || "");

// Templates found unavailable in a language, so the next messages go straight to
// English instead of failing first. Re-checked after a while (it may get approved).
const UNAVAILABLE_RECHECK_MS = 30 * 60 * 1000;
const unavailableUntil = new Map(); // "name/lang" -> timestamp

// Send one of the templates in whatsapp/templates.js through the active provider.
// paramsFor(lang) returns the placeholder values written in that language.
const sendTemplated = async (to, templateName, paramsFor, lang = "en") => {
  try {
    const provider = getWhatsAppProvider();
    if (!provider) {
      return { success: false, error: "WhatsApp is not configured" };
    }
    if (!normalizePhone(to)) {
      return { success: false, error: "No phone number" };
    }

    let language = hasLanguage(templateName, lang) ? lang : "en";
    const key = `${templateName}/${language}`;
    if (language !== "en" && (unavailableUntil.get(key) || 0) > Date.now()) language = "en";

    let result;
    if (provider === "twilio") {
      result = await sendViaTwilio(to, renderTemplate(templateName, paramsFor(language), language));
    } else {
      try {
        result = await sendTemplate(to, templateName, paramsFor(language), language);
      } catch (error) {
        if (language === "en" || !isTemplateUnavailable(error)) throw error;
        console.warn(`WhatsApp ${templateName} [${language}] not available (${error.message}); sending English`);
        unavailableUntil.set(key, Date.now() + UNAVAILABLE_RECHECK_MS);
        language = "en";
        result = await sendTemplate(to, templateName, paramsFor("en"), "en");
      }
    }
    console.log(`WhatsApp ${templateName} [${language}] sent via ${provider}: ${result.messageId}`);
    return { ...result, language };
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

// Who cancelled, in the patient's language. Callers pass the English wording.
const CANCELLED_BY_URDU = {
  "the hospital": "ہسپتال",
  "your doctor": "آپ کے ڈاکٹر",
  "you": "آپ",
};
const cancelledByFor = (cancelledBy, lang) =>
  lang === "ur" ? CANCELLED_BY_URDU[String(cancelledBy).toLowerCase()] || "ہسپتال" : cancelledBy;

// --- Patient messages (lang: "en" | "ur") ---

// Appointment confirmation to the patient
export const sendWhatsAppConfirmation = (phoneNumber, userName, doctorName, doctorSpecialty, appointmentDate, appointmentTime, fee, lang = "en") =>
  sendTemplated(phoneNumber, "appointment_confirmation", (l) => [
    userName,
    HOSPITAL_NAME,
    doctorName,
    doctorSpecialty,
    formatDateFor(appointmentDate, l),
    formatTimeFor(appointmentTime, l),
    fee,
    HOSPITAL_PHONE,
  ], lang);

// Reminder to the patient
export const sendWhatsAppReminder = (phoneNumber, userName, doctorName, appointmentDate, appointmentTime, lang = "en") =>
  sendTemplated(phoneNumber, "appointment_reminder", (l) => [
    HOSPITAL_NAME,
    userName,
    doctorName,
    formatDateFor(appointmentDate, l),
    formatTimeFor(appointmentTime, l),
    HOSPITAL_PHONE,
  ], lang);

// Reschedule notice to the patient (old and new time)
export const sendWhatsAppReschedule = (phoneNumber, userName, doctorName, oldDate, oldTime, newDate, newTime, lang = "en") =>
  sendTemplated(phoneNumber, "appointment_rescheduled", (l) => [
    userName,
    doctorName,
    formatDateFor(oldDate, l),
    formatTimeFor(oldTime, l),
    formatDateFor(newDate, l),
    formatTimeFor(newTime, l),
    HOSPITAL_PHONE,
  ], lang);

// Cancellation notice to the patient. cancelledBy: e.g. "the hospital" or "your doctor"
export const sendWhatsAppCancellation = (phoneNumber, userName, doctorName, appointmentDate, appointmentTime, cancelledBy, lang = "en") =>
  sendTemplated(phoneNumber, "appointment_cancelled", (l) => [
    userName,
    doctorName,
    formatDateFor(appointmentDate, l),
    formatTimeFor(appointmentTime, l),
    cancelledByFor(cancelledBy, l),
    HOSPITAL_PHONE,
  ], lang);

// Live queue: token issued. trackUrl: public page showing the patient's turn
export const sendWhatsAppQueueToken = (phoneNumber, userName, tokenNumber, doctorName, aheadCount, waitMinutes, trackUrl, lang = "en") =>
  sendTemplated(phoneNumber, "queue_token", () => [
    userName,
    HOSPITAL_NAME,
    tokenNumber,
    doctorName,
    aheadCount,
    waitMinutes,
    trackUrl,
  ], lang);

// Live queue: only a few patients ahead, time to come back to the waiting area
export const sendWhatsAppTurnNear = (phoneNumber, userName, doctorName, tokenNumber, aheadCount, lang = "en") =>
  sendTemplated(phoneNumber, "queue_turn_near", () => [
    userName,
    doctorName,
    tokenNumber,
    aheadCount,
    HOSPITAL_NAME,
  ], lang);

// --- Doctor messages (English) ---

// New-appointment notice to the doctor
export const sendDoctorWhatsAppConfirmation = (phoneNumber, doctorName, patientName, patientPhone, appointmentDate, appointmentTime) =>
  sendTemplated(phoneNumber, "appointment_confirmation_doctor", () => [
    HOSPITAL_NAME,
    patientName,
    normalizePhone(patientPhone) || "Not provided",
    formatSlotDate(appointmentDate),
    appointmentTime,
  ]);

// Reminder to the doctor
export const sendDoctorWhatsAppReminder = (phoneNumber, patientName, appointmentDate, appointmentTime) =>
  sendTemplated(phoneNumber, "appointment_reminder_doctor", () => [
    HOSPITAL_NAME,
    patientName,
    formatSlotDate(appointmentDate),
    appointmentTime,
  ]);
