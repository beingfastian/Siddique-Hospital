// WhatsApp message templates, kept in code so every hospital's WhatsApp account
// gets the same set via `npm run templates:sync`.
//
// Meta review rules followed here: factual (UTILITY) wording, placeholders are
// never at the very start or end and never next to each other, and every
// placeholder has an example value.
//
// The same text is used for Twilio (sent as plain text with values filled in),
// so wording only lives in one place.

export const TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

export const templates = {
  appointment_confirmation: {
    category: "UTILITY",
    body:
      "Dear {{1}}, your appointment at {{2}} is confirmed.\n\n" +
      "Doctor: Dr. {{3}} ({{4}})\n" +
      "Date: {{5}}\n" +
      "Time: {{6}}\n" +
      "Fee: Rs. {{7}}\n\n" +
      "Please arrive 15 minutes early. To change or cancel, call {{8}}. Thank you.",
    example: ["Ali Khan", "City Care Hospital", "Ahmed Raza", "General physician", "Friday, October 3, 2026", "06:30 PM", "1500", "+923001234567"],
  },
  appointment_confirmation_doctor: {
    category: "UTILITY",
    body:
      "New appointment booked at {{1}}.\n\n" +
      "Patient: {{2}}\n" +
      "Phone: {{3}}\n" +
      "Date: {{4}}\n" +
      "Time: {{5}}\n\n" +
      "Please check the doctor panel for details.",
    example: ["City Care Hospital", "Ali Khan", "+923001234567", "Friday, October 3, 2026", "06:30 PM"],
  },
  appointment_reminder: {
    category: "UTILITY",
    body:
      "Reminder from {{1}}: Dear {{2}}, you have an appointment with Dr. {{3}} on {{4}} at {{5}}.\n\n" +
      "To cancel, reply CANCEL or call {{6}}. Thank you.",
    example: ["City Care Hospital", "Ali Khan", "Ahmed Raza", "Friday, October 3, 2026", "06:30 PM", "+923001234567"],
  },
  appointment_reminder_doctor: {
    category: "UTILITY",
    body:
      "Reminder from {{1}}: your appointment with patient {{2}} is on {{3}} at {{4}}.\n\n" +
      "Please check the doctor panel for details.",
    example: ["City Care Hospital", "Ali Khan", "Friday, October 3, 2026", "06:30 PM"],
  },
  appointment_rescheduled: {
    category: "UTILITY",
    body:
      "Dear {{1}}, your appointment with Dr. {{2}} has been moved from {{3}} at {{4}} to {{5}} at {{6}}.\n\n" +
      "If the new time doesn't suit you, please call {{7}}. Thank you.",
    example: ["Ali Khan", "Ahmed Raza", "Tuesday, October 6, 2026", "10:00 AM", "Wednesday, October 7, 2026", "10:00 AM", "+923001234567"],
  },
  appointment_cancelled: {
    category: "UTILITY",
    body:
      "Dear {{1}}, your appointment with Dr. {{2}} on {{3}} at {{4}} has been cancelled by {{5}}.\n\n" +
      "To book again, call or message {{6}}. Thank you.",
    example: ["Ali Khan", "Ahmed Raza", "Friday, October 3, 2026", "06:30 PM", "City Care Hospital", "+923001234567"],
  },
};

// Fill {{n}} placeholders (used for Twilio, which sends plain text)
export const renderTemplate = (name, params) =>
  templates[name].body.replace(/\{\{(\d+)\}\}/g, (_, n) => String(params[Number(n) - 1] ?? ""));
