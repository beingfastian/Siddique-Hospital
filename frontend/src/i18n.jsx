// English / Urdu for the patient website. Many patients and their families read
// Urdu more easily; the choice is remembered on the phone. Urdu switches the page
// to right-to-left and the Nastaliq font (index.css: [lang="ur"]).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "qlinic.lang";

const STRINGS = {
  en: {
    "nav.home": "Home",
    "nav.doctors": "Doctors",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.menu": "Menu",
    "nav.close": "Close menu",
    "lang.switch": "اردو",
    "lang.switchLabel": "پڑھیں اردو میں",
    "action.whatsapp": "Book on WhatsApp",
    "action.whatsappShort": "WhatsApp",
    "action.call": "Call reception",
    "action.callShort": "Call",
    "action.email": "Email",
    "action.map": "Open in Google Maps",
    "action.allDoctors": "See all doctors",
    "action.track": "Track",

    "home.kicker": "Welcome to {hospital}",
    "home.title": "See a trusted doctor, without the long wait.",
    "home.lead": "Message us on WhatsApp to book. On the day, take your token at reception and follow your turn on your phone.",
    "home.trust1": "Reply on WhatsApp, in Urdu or English",
    "home.trust2": "Live token tracking on your phone",
    "home.trust3": "Lab reports checked by your doctor",
    "home.liveTitle": "Live at the hospital",
    "home.liveNow": "Now with the doctor",
    "home.liveWaiting": "{count} waiting",
    "home.liveBreak": "On a break",
    "home.liveNotStarted": "Not started yet",
    "home.liveMore": "Waiting-room screen",
    "home.todayTitle": "Doctors sitting today",
    "home.todayNone": "No doctor is sitting today. Message us to book for another day.",
    "home.specialitiesTitle": "Find a doctor by speciality",
    "home.doctorsTitle": "Our doctors",
    "home.howTitle": "How it works",
    "home.step1Title": "Book on WhatsApp",
    "home.step1Text": "Send us a message with the doctor's name. We reply with a time.",
    "home.step2Title": "Get your token",
    "home.step2Text": "On the day, reception gives you a token number and a slip.",
    "home.step3Title": "Follow your turn",
    "home.step3Text": "Scan the slip or open the WhatsApp link to see how many are ahead of you.",
    "track.title": "Track your token",
    "track.text": "Paste the link from your WhatsApp message or slip, or type the code printed on it.",
    "track.label": "Token link or code",
    "track.placeholder": "e.g. https://…/queue/t/AbC123xy",
    "track.invalid": "That doesn't look like a token link. Check the slip and try again.",

    "doctors.title": "Our doctors",
    "doctors.lead": "Choose a doctor and book on WhatsApp. Fees are paid at the hospital.",
    "doctors.all": "All",
    "doctors.empty": "No doctors in this speciality yet.",
    "doctors.loading": "Loading doctors…",
    "doctors.failed": "Couldn't load the doctors. Check your internet and try again.",
    "doctors.retry": "Try again",
    "doctors.fee": "Fee",
    "doctors.days": "Days",
    "doctors.hours": "Timings",
    "doctors.request": "Book on WhatsApp",
    "doctors.unavailable": "Not taking bookings",
    "doctors.experience": "{years} experience",

    "status.now": "Available now",
    "status.later": "Today from {time}",
    "status.closed": "Finished for today",
    "status.next": "Next: {day}",
    "status.off": "Not available",
    "status.contact": "Call for timings",

    "about.title": "About {hospital}",
    "about.lead": "{hospital} is a hospital for families in our area: experienced doctors, a lab on site, and a front desk that keeps your wait short.",
    "about.expectTitle": "What you can expect",
    "about.e1Title": "A shorter wait",
    "about.e1Text": "Every patient gets a token. You can see your place in line on your phone and arrive when your turn is near.",
    "about.e2Title": "Messages you can read",
    "about.e2Text": "Booking confirmations and reminders on WhatsApp, in Urdu or English, if you agree to receive them.",
    "about.e3Title": "Tests under one roof",
    "about.e3Text": "Your doctor requests lab tests, our lab sends the report straight back, and the doctor reviews it with you.",

    "contact.title": "Contact us",
    "contact.lead": "WhatsApp is the quickest way to book. For anything urgent, please call.",
    "contact.address": "Address",
    "contact.hours": "Opening hours",
    "contact.whatsappHint": "Quick reply for bookings",
    "contact.callHint": "Speak to reception",
    "contact.emailHint": "For reports and other questions",
    "contact.emergency": "In a medical emergency, call 1122 or go to the nearest emergency department.",

    "footer.about": "{hospital}: trusted doctors, an on-site lab and less waiting.",
    "footer.links": "Pages",
    "footer.contact": "Contact",
    "footer.rights": "© {year} {hospital}. All rights reserved.",
    "footer.powered": "Powered by {product}",

    "wa.general": "Hello! I would like to book an appointment. Please tell me the available times.",
    "wa.doctor": "Hello! I would like to book an appointment with Dr. {name} ({speciality}). Please tell me the available times.",
    "wa.contact": "Hello! I have a question about your services.",
  },
  ur: {
    "nav.home": "ہوم",
    "nav.doctors": "ڈاکٹرز",
    "nav.about": "ہمارے بارے میں",
    "nav.contact": "رابطہ",
    "nav.menu": "مینو",
    "nav.close": "مینو بند کریں",
    "lang.switch": "English",
    "lang.switchLabel": "Read in English",
    "action.whatsapp": "واٹس ایپ پر وقت لیں",
    "action.whatsappShort": "واٹس ایپ",
    "action.call": "ریسپشن کو کال کریں",
    "action.callShort": "کال",
    "action.email": "ای میل",
    "action.map": "گوگل میپس پر دیکھیں",
    "action.allDoctors": "تمام ڈاکٹرز دیکھیں",
    "action.track": "دیکھیں",

    "home.kicker": "{hospital} میں خوش آمدید",
    "home.title": "بھروسے کے ڈاکٹر سے ملیں، لمبے انتظار کے بغیر۔",
    "home.lead": "وقت لینے کے لیے ہمیں واٹس ایپ پر پیغام بھیجیں۔ اُس دن ریسپشن سے ٹوکن لیں اور اپنی باری فون پر دیکھیں۔",
    "home.trust1": "واٹس ایپ پر جواب، اردو یا انگریزی میں",
    "home.trust2": "ٹوکن کی باری فون پر لائیو",
    "home.trust3": "لیب رپورٹ آپ کے ڈاکٹر دیکھتے ہیں",
    "home.liveTitle": "ہسپتال میں ابھی",
    "home.liveNow": "ڈاکٹر کے پاس",
    "home.liveWaiting": "{count} انتظار میں",
    "home.liveBreak": "وقفہ",
    "home.liveNotStarted": "ابھی شروع نہیں ہوا",
    "home.liveMore": "ویٹنگ روم اسکرین",
    "home.todayTitle": "آج بیٹھنے والے ڈاکٹرز",
    "home.todayNone": "آج کوئی ڈاکٹر نہیں بیٹھے۔ کسی اور دن کے لیے پیغام بھیجیں۔",
    "home.specialitiesTitle": "شعبے کے مطابق ڈاکٹر تلاش کریں",
    "home.doctorsTitle": "ہمارے ڈاکٹرز",
    "home.howTitle": "طریقہ کار",
    "home.step1Title": "واٹس ایپ پر وقت لیں",
    "home.step1Text": "ڈاکٹر کے نام کے ساتھ پیغام بھیجیں۔ ہم آپ کو وقت بتا دیں گے۔",
    "home.step2Title": "ٹوکن لیں",
    "home.step2Text": "اُس دن ریسپشن آپ کو ٹوکن نمبر اور پرچی دے گا۔",
    "home.step3Title": "اپنی باری دیکھیں",
    "home.step3Text": "پرچی اسکین کریں یا واٹس ایپ لنک کھولیں، اور دیکھیں آپ سے پہلے کتنے مریض ہیں۔",
    "track.title": "اپنا ٹوکن دیکھیں",
    "track.text": "واٹس ایپ پیغام یا پرچی والا لنک یہاں لگائیں، یا اس پر لکھا کوڈ درج کریں۔",
    "track.label": "ٹوکن لنک یا کوڈ",
    "track.placeholder": "مثلاً https://…/queue/t/AbC123xy",
    "track.invalid": "یہ ٹوکن لنک درست نہیں لگتا۔ پرچی دیکھ کر دوبارہ کوشش کریں۔",

    "doctors.title": "ہمارے ڈاکٹرز",
    "doctors.lead": "ڈاکٹر منتخب کریں اور واٹس ایپ پر وقت لیں۔ فیس ہسپتال میں ادا کی جاتی ہے۔",
    "doctors.all": "سب",
    "doctors.empty": "اس شعبے میں ابھی کوئی ڈاکٹر نہیں۔",
    "doctors.loading": "ڈاکٹرز لوڈ ہو رہے ہیں…",
    "doctors.failed": "ڈاکٹرز لوڈ نہیں ہو سکے۔ انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔",
    "doctors.retry": "دوبارہ کوشش کریں",
    "doctors.fee": "فیس",
    "doctors.days": "دن",
    "doctors.hours": "اوقات",
    "doctors.request": "واٹس ایپ پر وقت لیں",
    "doctors.unavailable": "ابھی وقت نہیں دے رہے",
    "doctors.experience": "{years} تجربہ",

    "status.now": "ابھی دستیاب",
    "status.later": "آج {time} سے",
    "status.closed": "آج کا وقت ختم",
    "status.next": "اگلی بار: {day}",
    "status.off": "دستیاب نہیں",
    "status.contact": "اوقات کے لیے کال کریں",

    "about.title": "{hospital} کے بارے میں",
    "about.lead": "{hospital} ہمارے علاقے کے خاندانوں کا ہسپتال ہے: تجربہ کار ڈاکٹرز، ہسپتال کے اندر لیب، اور ایسا ریسپشن جو آپ کا انتظار کم رکھتا ہے۔",
    "about.expectTitle": "آپ کو کیا ملے گا",
    "about.e1Title": "کم انتظار",
    "about.e1Text": "ہر مریض کو ٹوکن ملتا ہے۔ آپ اپنی باری فون پر دیکھ سکتے ہیں اور باری قریب ہونے پر آ سکتے ہیں۔",
    "about.e2Title": "پیغامات جو آپ پڑھ سکیں",
    "about.e2Text": "وقت کی تصدیق اور یاد دہانی واٹس ایپ پر، اردو یا انگریزی میں، اگر آپ اجازت دیں۔",
    "about.e3Title": "ٹیسٹ ایک ہی جگہ",
    "about.e3Text": "ڈاکٹر لیب ٹیسٹ لکھتے ہیں، ہماری لیب رپورٹ سیدھی انہیں بھیجتی ہے، اور ڈاکٹر آپ کے ساتھ دیکھتے ہیں۔",

    "contact.title": "ہم سے رابطہ کریں",
    "contact.lead": "وقت لینے کا سب سے تیز طریقہ واٹس ایپ ہے۔ کسی فوری بات کے لیے کال کریں۔",
    "contact.address": "پتہ",
    "contact.hours": "اوقاتِ کار",
    "contact.whatsappHint": "وقت لینے کے لیے فوری جواب",
    "contact.callHint": "ریسپشن سے بات کریں",
    "contact.emailHint": "رپورٹس اور دیگر سوالات کے لیے",
    "contact.emergency": "طبی ایمرجنسی میں 1122 پر کال کریں یا قریبی ایمرجنسی میں جائیں۔",

    "footer.about": "{hospital}: بھروسے کے ڈاکٹرز، ہسپتال میں لیب اور کم انتظار۔",
    "footer.links": "صفحات",
    "footer.contact": "رابطہ",
    "footer.rights": "© {year} {hospital}۔ جملہ حقوق محفوظ ہیں۔",
    "footer.powered": "{product} کے تعاون سے",

    "wa.general": "السلام علیکم! مجھے ڈاکٹر سے ملنے کا وقت چاہیے۔ براہِ کرم دستیاب اوقات بتا دیں۔",
    "wa.doctor": "السلام علیکم! مجھے ڈاکٹر {name} ({speciality}) سے ملنے کا وقت چاہیے۔ براہِ کرم دستیاب اوقات بتا دیں۔",
    "wa.contact": "السلام علیکم! مجھے آپ کی سروسز کے بارے میں معلومات چاہییں۔",
  },
};

// Speciality names in Urdu (doctor data is in English; unknown ones stay as typed)
const SPECIALITY_UR = {
  "general physician": "جنرل فزیشن",
  gynecologist: "ماہرِ امراضِ نسواں",
  gynaecologist: "ماہرِ امراضِ نسواں",
  dermatologist: "ماہرِ امراضِ جلد",
  pediatricians: "ماہرِ امراضِ اطفال",
  pediatrician: "ماہرِ امراضِ اطفال",
  paediatrician: "ماہرِ امراضِ اطفال",
  neurologist: "ماہرِ امراضِ اعصاب",
  gastroenterologist: "ماہرِ امراضِ معدہ",
  cardiologist: "ماہرِ امراضِ قلب",
  "ent specialist": "ماہرِ ناک، کان، گلا",
  orthopedic: "ماہرِ ہڈی و جوڑ",
  "orthopaedic surgeon": "ماہرِ ہڈی و جوڑ",
  dentist: "دانتوں کے ڈاکٹر",
  "eye specialist": "ماہرِ امراضِ چشم",
};

const DAY_NAMES = {
  en: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" },
  ur: { monday: "پیر", tuesday: "منگل", wednesday: "بدھ", thursday: "جمعرات", friday: "جمعہ", saturday: "ہفتہ", sunday: "اتوار" },
};
const DAY_FULL = {
  en: { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" },
  ur: DAY_NAMES.ur,
};

const LanguageContext = createContext(null);

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "ur" ? "ur" : "en";
  } catch {
    return "en";
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(readStored);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: the choice lasts until the tab closes */
    }
  }, []);

  const t = useCallback(
    (key, vars = {}) => {
      const text = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
      return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      speciality: (name) => (lang === "ur" && SPECIALITY_UR[String(name || "").trim().toLowerCase()]) || name,
      dayShort: (day) => DAY_NAMES[lang][day] || day,
      dayFull: (day) => DAY_FULL[lang][day] || day,
    }),
    [lang, setLang, t]
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
