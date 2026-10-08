// WhatsApp message templates, kept in code so every hospital's WhatsApp account
// gets the same set via `npm run templates:sync`.
//
// Meta review rules followed here: factual (UTILITY) wording, placeholders are
// never at the very start or end and never next to each other, and every
// placeholder has an example value.
//
// The same text is used for Twilio (sent as plain text with values filled in),
// so wording only lives in one place.
//
// Languages: every template has English (`body`). Patient-facing templates also
// have Urdu (`ur`), submitted to Meta as a translation of the same template name.
// Placeholders keep the same order in both languages, so callers pass one list
// (values such as dates are formatted in the patient's language by the caller).
// Doctor-facing templates are English only.

export const LANGUAGES = ["en", "ur"];

// Language for patients who haven't chosen one (records from before this setting).
// Urdu by default: many patients' families read Urdu but not English.
export const DEFAULT_PATIENT_LANGUAGE = LANGUAGES.includes(process.env.WHATSAPP_DEFAULT_LANGUAGE)
  ? process.env.WHATSAPP_DEFAULT_LANGUAGE
  : "ur";

// The base language every template exists in
export const TEMPLATE_LANGUAGE = "en";

// Meta's language code for each of our languages. English templates may have been
// created as "en_US" etc. on an existing account: WHATSAPP_TEMPLATE_LANGUAGE keeps that working.
export const metaLanguageCode = (lang) =>
  lang === "en" ? process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en" : lang;

// "ur" | "en" for a patient (falls back to the hospital default)
export const patientLanguage = (patient) =>
  LANGUAGES.includes(patient?.language) ? patient.language : DEFAULT_PATIENT_LANGUAGE;

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
    example: ["Ali Khan", "Siddique Hospital", "Ahmed Raza", "General physician", "Friday, October 3, 2026", "06:30 PM", "1500", "+923001234567"],
    ur: {
      body:
        "محترم {{1}}، {{2}} میں آپ کی اپائنٹمنٹ کنفرم ہو گئی ہے۔\n\n" +
        "ڈاکٹر: {{3}} ({{4}})\n" +
        "تاریخ: {{5}}\n" +
        "وقت: {{6}}\n" +
        "فیس: {{7}} روپے\n\n" +
        "براہ کرم 15 منٹ پہلے تشریف لائیں۔ تبدیلی یا منسوخی کے لیے {{8}} پر کال کریں۔ شکریہ۔",
      example: ["علی خان", "Siddique Hospital", "احمد رضا", "General physician", "جمعہ، 3 اکتوبر، 2026", "شام 6:30", "1500", "+923001234567"],
    },
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
    example: ["Siddique Hospital", "Ali Khan", "+923001234567", "Friday, October 3, 2026", "06:30 PM"],
  },
  appointment_reminder: {
    category: "UTILITY",
    body:
      "Reminder from {{1}}: Dear {{2}}, you have an appointment with Dr. {{3}} on {{4}} at {{5}}.\n\n" +
      "To cancel, reply CANCEL or call {{6}}. Thank you.",
    example: ["Siddique Hospital", "Ali Khan", "Ahmed Raza", "Friday, October 3, 2026", "06:30 PM", "+923001234567"],
    ur: {
      body:
        "یاد دہانی از {{1}}: محترم {{2}}، ڈاکٹر {{3}} کے ساتھ آپ کی اپائنٹمنٹ {{4}} کو {{5}} بجے ہے۔\n\n" +
        "منسوخ کرنے کے لیے CANCEL لکھ کر بھیجیں یا {{6}} پر کال کریں۔ شکریہ۔",
      example: ["Siddique Hospital", "علی خان", "احمد رضا", "جمعہ، 3 اکتوبر، 2026", "شام 6:30", "+923001234567"],
    },
  },
  appointment_reminder_doctor: {
    category: "UTILITY",
    body:
      "Reminder from {{1}}: your appointment with patient {{2}} is on {{3}} at {{4}}.\n\n" +
      "Please check the doctor panel for details.",
    example: ["Siddique Hospital", "Ali Khan", "Friday, October 3, 2026", "06:30 PM"],
  },
  appointment_rescheduled: {
    category: "UTILITY",
    body:
      "Dear {{1}}, your appointment with Dr. {{2}} has been moved from {{3}} at {{4}} to {{5}} at {{6}}.\n\n" +
      "If the new time doesn't suit you, please call {{7}}. Thank you.",
    example: ["Ali Khan", "Ahmed Raza", "Tuesday, October 6, 2026", "10:00 AM", "Wednesday, October 7, 2026", "10:00 AM", "+923001234567"],
    ur: {
      body:
        "محترم {{1}}، ڈاکٹر {{2}} کے ساتھ آپ کی اپائنٹمنٹ {{3}}، {{4}} سے بدل کر {{5}}، {{6}} کر دی گئی ہے۔\n\n" +
        "اگر نیا وقت مناسب نہ ہو تو براہ کرم {{7}} پر کال کریں۔ شکریہ۔",
      example: ["علی خان", "احمد رضا", "منگل، 6 اکتوبر، 2026", "صبح 10:00", "بدھ، 7 اکتوبر، 2026", "صبح 10:00", "+923001234567"],
    },
  },
  appointment_cancelled: {
    category: "UTILITY",
    body:
      "Dear {{1}}, your appointment with Dr. {{2}} on {{3}} at {{4}} has been cancelled by {{5}}.\n\n" +
      "To book again, call or message {{6}}. Thank you.",
    example: ["Ali Khan", "Ahmed Raza", "Friday, October 3, 2026", "06:30 PM", "Siddique Hospital", "+923001234567"],
    ur: {
      body:
        "محترم {{1}}، ڈاکٹر {{2}} کے ساتھ {{3}} کو {{4}} بجے والی آپ کی اپائنٹمنٹ {{5}} کی طرف سے منسوخ کر دی گئی ہے۔\n\n" +
        "دوبارہ وقت لینے کے لیے {{6}} پر کال یا میسج کریں۔ شکریہ۔",
      example: ["علی خان", "احمد رضا", "جمعہ، 3 اکتوبر، 2026", "شام 6:30", "ہسپتال", "+923001234567"],
    },
  },
  // Live queue: sent when a token is issued (only if the patient agreed to WhatsApp)
  queue_token: {
    category: "UTILITY",
    body:
      "Dear {{1}}, your token number at {{2}} is {{3}} for Dr. {{4}}.\n\n" +
      "Patients ahead of you: {{5}}. Approximate wait: {{6}} minutes.\n\n" +
      "See your turn live: {{7}}\n" +
      "We will message you again when your turn is near. Thank you.",
    example: ["Ali Khan", "Siddique Hospital", "12", "Ahmed Raza", "5", "45", "https://siddiquehospital.com/queue/t/aB3dE9xY"],
    ur: {
      body:
        "محترم {{1}}، {{2}} میں آپ کا ٹوکن نمبر {{3}} ہے (ڈاکٹر {{4}})۔\n\n" +
        "آپ سے پہلے مریض: {{5}}۔ اندازاً انتظار: {{6}} منٹ۔\n\n" +
        "اپنی باری یہاں دیکھیں: {{7}}\n" +
        "باری قریب آنے پر ہم آپ کو دوبارہ میسج کریں گے۔ شکریہ۔",
      example: ["علی خان", "Siddique Hospital", "12", "احمد رضا", "5", "45", "https://siddiquehospital.com/queue/t/aB3dE9xY"],
    },
  },
  // Live queue: sent once when only a few patients are ahead
  queue_turn_near: {
    category: "UTILITY",
    body:
      "Dear {{1}}, your turn with Dr. {{2}} is near. Your token number is {{3}} and {{4}} patient(s) are ahead of you.\n\n" +
      "Please come back to the waiting area at {{5}}. Thank you.",
    example: ["Ali Khan", "Ahmed Raza", "12", "2", "Siddique Hospital"],
    ur: {
      body:
        "محترم {{1}}، ڈاکٹر {{2}} کے پاس آپ کی باری قریب ہے۔ آپ کا ٹوکن نمبر {{3}} ہے اور آپ سے پہلے {{4}} مریض ہیں۔\n\n" +
        "براہ کرم {{5}} کے ویٹنگ ایریا میں واپس آ جائیں۔ شکریہ۔",
      example: ["علی خان", "احمد رضا", "12", "2", "Siddique Hospital"],
    },
  },
};

// Does this template exist in this language?
export const hasLanguage = (name, lang) => lang === "en" || Boolean(templates[name]?.[lang]);

// Body and example of a template in a language (English if that translation doesn't exist)
export const templateBody = (name, lang = "en") =>
  (lang !== "en" && templates[name]?.[lang]?.body) || templates[name].body;
export const templateExample = (name, lang = "en") =>
  (lang !== "en" && templates[name]?.[lang]?.example) || templates[name].example;

// Fill {{n}} placeholders (used for Twilio, which sends plain text)
export const renderTemplate = (name, params, lang = "en") =>
  templateBody(name, lang).replace(/\{\{(\d+)\}\}/g, (_, n) => String(params[Number(n) - 1] ?? ""));
