// English / Urdu for the Qclinics website. The choice is remembered on the device.
// Urdu switches the page to right-to-left and the Nastaliq font (index.css).
// Only describe what the product really does today.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "qclinics.lang";

const STRINGS = {
  en: {
    "nav.features": "Features",
    "nav.how": "How it works",
    "nav.pakistan": "Built for Pakistan",
    "nav.faq": "FAQ",
    "nav.menu": "Menu",
    "nav.close": "Close menu",
    "nav.staff": "Staff sign in",
    "lang.switch": "اردو",
    "lang.switchLabel": "پڑھیں اردو میں",
    "action.demo": "Book a free demo",
    "action.demoShort": "Book a demo",
    "action.call": "Call us",
    "action.callShort": "Call",
    "action.email": "Email us",
    "action.see": "See how it works",

    "hero.kicker": "Care without the wait.",
    "hero.title": "Hospital software that ends the waiting-room crowd.",
    "hero.lead": "Tokens, a live queue, WhatsApp reminders in Urdu, lab reports and doctor earnings: one simple system for hospitals and clinics in Pakistan.",
    "hero.point1": "Patients don't need to install an app",
    "hero.point2": "Runs on any computer, tablet or phone",
    "hero.point3": "Urdu and English for patients",
    "mock.board": "Waiting-room screen",
    "mock.now": "Now serving",
    "mock.next": "Next",
    "mock.doctor": "Dr. Ahmed Raza · General physician",
    "mock.whatsapp": "WhatsApp to the patient",
    "mock.message": "آپ کا ٹوکن نمبر 14 ہے۔ آپ سے پہلے 2 مریض ہیں، تقریباً 15 منٹ۔",
    "mock.track": "Follow your turn",

    "problems.title": "Sound familiar?",
    "problems.p1": "A packed waiting hall, and arguments over whose turn it is.",
    "problems.p2": "Patients book and don't come, while others wait for hours.",
    "problems.p3": "Lab reports get lost on the way back to the doctor.",
    "problems.p4": "Doctor shares worked out by hand at the end of every month.",

    "features.title": "Everything the front desk, doctors and lab need",
    "features.lead": "One system, three simple logins: reception, doctors and the lab.",
    "f.queue.title": "Live token queue",
    "f.queue.text": "Reception issues tokens for appointments and walk-ins. Doctors call the next patient, and the waiting-room TV shows who is being seen.",
    "f.track.title": "Turn tracking on the patient's phone",
    "f.track.text": "A QR code on the printed slip and a WhatsApp link show how many patients are ahead, so families can wait outside.",
    "f.whatsapp.title": "WhatsApp messages in Urdu",
    "f.whatsapp.text": "Booking confirmations, reminders and token updates in Urdu or English, only for patients who agree.",
    "f.appointments.title": "Appointments, walk-ins and follow-ups",
    "f.appointments.text": "Book from a phone-number search, check patients in on arrival, and let doctors schedule the next visit in one click.",
    "f.lab.title": "In-house lab",
    "f.lab.text": "Doctors request tests, the lab uploads the report, and the doctor reviews and approves it.",
    "f.earnings.title": "Doctor shares and profit reports",
    "f.earnings.text": "Set each doctor's share once. Every completed visit is split automatically, with daily, weekly and monthly reports.",
    "f.schedule.title": "Doctor days and leave",
    "f.schedule.text": "Sitting days, timings and leave in one place. Move or cancel a whole day and patients are told.",
    "f.slips.title": "Printed slips",
    "f.slips.text": "Token and appointment slips with the hospital's name, ready for any printer at the counter.",

    "pk.title": "Built for how hospitals work in Pakistan",
    "pk.p1": "Urdu on everything patients see: messages, slips and the token page.",
    "pk.p2": "WhatsApp first: no app to download, no login for patients.",
    "pk.p3": "Families can share one phone number. Patients without a phone get a printed token.",
    "pk.p4": "Works on everyday Android phones and slow internet, and keeps retrying when the connection drops.",
    "pk.p5": "Pakistan time, rupees, CNIC and local phone numbers built in.",

    "how.title": "Up and running quickly",
    "how.s1.title": "Tell us about your hospital",
    "how.s1.text": "Your doctors, their sitting days and fees, and the WhatsApp number patients know.",
    "how.s2.title": "We set it up with your team",
    "how.s2.text": "We add your doctors and show reception, doctors and the lab how to use it.",
    "how.s3.title": "Go live",
    "how.s3.text": "Patients get tokens and WhatsApp updates from the first day.",

    "faq.title": "Questions hospitals ask",
    "faq.q1": "Do patients need to install an app?",
    "faq.a1": "No. Patients get WhatsApp messages and a link to follow their turn. Nothing to download, nothing to sign up for.",
    "faq.q2": "What about patients without WhatsApp or a phone?",
    "faq.a2": "Reception can register any patient, even without a phone number, and print a token slip. WhatsApp is optional.",
    "faq.q3": "What equipment do we need?",
    "faq.a3": "The computers or tablets you already have, with a browser and internet. A TV for the waiting-room screen and a printer for slips are optional.",
    "faq.q4": "Who can see patient information?",
    "faq.a4": "Only your staff can sign in, and each role sees what it needs: doctors see their own patients and earnings, the lab sees its requests.",
    "faq.q5": "How much does it cost?",
    "faq.a5": "It depends on the number of doctors and your setup. Message us and we'll send pricing for your hospital.",
    "faq.q6": "Is it in Urdu?",
    "faq.a6": "Everything patients see is available in Urdu and English. The staff screens are in simple English.",

    "cta.title": "See it running in your hospital",
    "cta.text": "Book a free demo on WhatsApp. We'll show you the queue, the WhatsApp messages and the reports with your own doctors.",

    "footer.about": "Token queue, WhatsApp reminders, lab reports and doctor earnings for hospitals and clinics in Pakistan.",
    "footer.links": "Product",
    "footer.contact": "Contact",
    "footer.rights": "© {year} {product}. All rights reserved.",

    "wa.demo": "Hello! I'd like a demo of {product} for our hospital.",
  },
  ur: {
    "nav.features": "خصوصیات",
    "nav.how": "طریقہ کار",
    "nav.pakistan": "پاکستان کے لیے",
    "nav.faq": "سوالات",
    "nav.menu": "مینو",
    "nav.close": "مینو بند کریں",
    "nav.staff": "اسٹاف لاگ اِن",
    "lang.switch": "English",
    "lang.switchLabel": "Read in English",
    "action.demo": "مفت ڈیمو بُک کریں",
    "action.demoShort": "ڈیمو بُک کریں",
    "action.call": "ہمیں کال کریں",
    "action.callShort": "کال",
    "action.email": "ای میل کریں",
    "action.see": "دیکھیں یہ کیسے کام کرتا ہے",

    "hero.kicker": "علاج، انتظار کے بغیر۔",
    "hero.title": "ایسا ہسپتال سافٹ ویئر جو ویٹنگ روم کا رش ختم کر دے۔",
    "hero.lead": "ٹوکن، لائیو باری، اردو میں واٹس ایپ یاد دہانیاں، لیب رپورٹس اور ڈاکٹرز کی آمدن: پاکستان کے ہسپتالوں اور کلینکس کے لیے ایک آسان نظام۔",
    "hero.point1": "مریضوں کو کوئی ایپ انسٹال نہیں کرنی پڑتی",
    "hero.point2": "کسی بھی کمپیوٹر، ٹیبلٹ یا فون پر چلتا ہے",
    "hero.point3": "مریضوں کے لیے اردو اور انگریزی",
    "mock.board": "ویٹنگ روم اسکرین",
    "mock.now": "اب باری",
    "mock.next": "اگلے",
    "mock.doctor": "Dr. Ahmed Raza · General physician",
    "mock.whatsapp": "مریض کو واٹس ایپ",
    "mock.message": "آپ کا ٹوکن نمبر 14 ہے۔ آپ سے پہلے 2 مریض ہیں، تقریباً 15 منٹ۔",
    "mock.track": "اپنی باری دیکھیں",

    "problems.title": "کیا یہ مسائل جانے پہچانے ہیں؟",
    "problems.p1": "بھرا ہوا ویٹنگ ہال، اور باری پر جھگڑے۔",
    "problems.p2": "مریض وقت لے کر نہیں آتے، اور دوسرے گھنٹوں انتظار کرتے ہیں۔",
    "problems.p3": "لیب رپورٹس ڈاکٹر تک پہنچتے پہنچتے گم ہو جاتی ہیں۔",
    "problems.p4": "ہر مہینے کے آخر میں ڈاکٹرز کا حصہ ہاتھ سے حساب کرنا۔",

    "features.title": "ریسپشن، ڈاکٹرز اور لیب کو جو کچھ چاہیے",
    "features.lead": "ایک نظام، تین آسان لاگ اِن: ریسپشن، ڈاکٹرز اور لیب۔",
    "f.queue.title": "لائیو ٹوکن قطار",
    "f.queue.text": "ریسپشن اپوائنٹمنٹ اور واک اِن مریضوں کو ٹوکن دیتا ہے۔ ڈاکٹر اگلے مریض کو بلاتے ہیں اور ویٹنگ روم کی ٹی وی پر نمبر نظر آتا ہے۔",
    "f.track.title": "مریض کے فون پر باری",
    "f.track.text": "پرچی پر QR کوڈ اور واٹس ایپ لنک سے پتا چلتا ہے کہ آگے کتنے مریض ہیں، تاکہ گھر والے باہر انتظار کر سکیں۔",
    "f.whatsapp.title": "اردو میں واٹس ایپ پیغامات",
    "f.whatsapp.text": "وقت کی تصدیق، یاد دہانی اور ٹوکن کی اطلاع اردو یا انگریزی میں، صرف ان مریضوں کو جو اجازت دیں۔",
    "f.appointments.title": "اپوائنٹمنٹ، واک اِن اور فالو اَپ",
    "f.appointments.text": "فون نمبر سے مریض تلاش کر کے وقت دیں، آنے پر چیک اِن کریں، اور ڈاکٹر ایک کلک میں اگلی ملاقات طے کریں۔",
    "f.lab.title": "ہسپتال کی اپنی لیب",
    "f.lab.text": "ڈاکٹر ٹیسٹ لکھتے ہیں، لیب رپورٹ اپ لوڈ کرتی ہے، اور ڈاکٹر دیکھ کر منظور کرتے ہیں۔",
    "f.earnings.title": "ڈاکٹرز کا حصہ اور منافع کی رپورٹس",
    "f.earnings.text": "ہر ڈاکٹر کا حصہ ایک بار طے کریں۔ ہر مکمل وزٹ خود تقسیم ہوتا ہے، روزانہ، ہفتہ وار اور ماہانہ رپورٹس کے ساتھ۔",
    "f.schedule.title": "ڈاکٹرز کے دن اور چھٹیاں",
    "f.schedule.text": "بیٹھنے کے دن، اوقات اور چھٹیاں ایک جگہ۔ پورا دن آگے کریں یا منسوخ کریں تو مریضوں کو اطلاع ہو جاتی ہے۔",
    "f.slips.title": "پرنٹ شدہ پرچیاں",
    "f.slips.text": "ہسپتال کے نام کے ساتھ ٹوکن اور اپوائنٹمنٹ کی پرچیاں، کاؤنٹر کے کسی بھی پرنٹر کے لیے تیار۔",

    "pk.title": "پاکستان کے ہسپتالوں کے کام کے طریقے کے مطابق",
    "pk.p1": "مریض جو کچھ دیکھتے ہیں وہ اردو میں: پیغامات، پرچیاں اور ٹوکن کا صفحہ۔",
    "pk.p2": "پہلے واٹس ایپ: نہ کوئی ایپ، نہ مریضوں کے لیے لاگ اِن۔",
    "pk.p3": "پورا خاندان ایک ہی فون نمبر استعمال کر سکتا ہے۔ جن کے پاس فون نہیں انہیں پرنٹ ٹوکن ملتا ہے۔",
    "pk.p4": "عام اینڈرائیڈ فونز اور کمزور انٹرنیٹ پر چلتا ہے، اور کنکشن ٹوٹنے پر خود دوبارہ کوشش کرتا ہے۔",
    "pk.p5": "پاکستانی وقت، روپے، شناختی کارڈ اور مقامی فون نمبر پہلے سے شامل۔",

    "how.title": "جلد شروع کریں",
    "how.s1.title": "ہمیں اپنے ہسپتال کے بارے میں بتائیں",
    "how.s1.text": "آپ کے ڈاکٹرز، ان کے دن اور فیس، اور وہ واٹس ایپ نمبر جو مریض جانتے ہیں۔",
    "how.s2.title": "ہم آپ کی ٹیم کے ساتھ سیٹ اَپ کرتے ہیں",
    "how.s2.text": "ہم آپ کے ڈاکٹرز شامل کرتے ہیں اور ریسپشن، ڈاکٹرز اور لیب کو استعمال سکھاتے ہیں۔",
    "how.s3.title": "شروع کریں",
    "how.s3.text": "پہلے دن سے مریضوں کو ٹوکن اور واٹس ایپ اطلاعات ملتی ہیں۔",

    "faq.title": "ہسپتالوں کے عام سوالات",
    "faq.q1": "کیا مریضوں کو کوئی ایپ انسٹال کرنی ہوگی؟",
    "faq.a1": "نہیں۔ مریضوں کو واٹس ایپ پیغام اور باری دیکھنے کا لنک ملتا ہے۔ نہ کچھ ڈاؤن لوڈ کرنا، نہ سائن اَپ۔",
    "faq.q2": "جن مریضوں کے پاس واٹس ایپ یا فون نہیں؟",
    "faq.a2": "ریسپشن کسی بھی مریض کو، فون نمبر کے بغیر بھی، رجسٹر کر کے ٹوکن کی پرچی پرنٹ کر سکتا ہے۔ واٹس ایپ اختیاری ہے۔",
    "faq.q3": "کون سا سامان چاہیے؟",
    "faq.a3": "آپ کے موجودہ کمپیوٹر یا ٹیبلٹ، براؤزر اور انٹرنیٹ کے ساتھ۔ ویٹنگ روم کے لیے ٹی وی اور پرچی کے لیے پرنٹر اختیاری ہیں۔",
    "faq.q4": "مریضوں کی معلومات کون دیکھ سکتا ہے؟",
    "faq.a4": "صرف آپ کا اسٹاف لاگ اِن کر سکتا ہے، اور ہر ایک کو اتنا ہی نظر آتا ہے جتنا ضروری ہے: ڈاکٹرز کو اپنے مریض اور آمدن، لیب کو اپنی درخواستیں۔",
    "faq.q5": "اس کی قیمت کیا ہے؟",
    "faq.a5": "یہ ڈاکٹرز کی تعداد اور آپ کے سیٹ اَپ پر منحصر ہے۔ ہمیں پیغام بھیجیں، ہم آپ کے ہسپتال کے لیے قیمت بھیج دیں گے۔",
    "faq.q6": "کیا یہ اردو میں ہے؟",
    "faq.a6": "مریض جو کچھ دیکھتے ہیں وہ اردو اور انگریزی دونوں میں ہے۔ اسٹاف کی اسکرینز آسان انگریزی میں ہیں۔",

    "cta.title": "اپنے ہسپتال میں چلتا ہوا دیکھیں",
    "cta.text": "واٹس ایپ پر مفت ڈیمو بُک کریں۔ ہم آپ کے اپنے ڈاکٹرز کے ساتھ قطار، واٹس ایپ پیغامات اور رپورٹس دکھائیں گے۔",

    "footer.about": "پاکستان کے ہسپتالوں اور کلینکس کے لیے ٹوکن قطار، واٹس ایپ یاد دہانیاں، لیب رپورٹس اور ڈاکٹرز کی آمدن۔",
    "footer.links": "پروڈکٹ",
    "footer.contact": "رابطہ",
    "footer.rights": "© {year} {product}۔ جملہ حقوق محفوظ ہیں۔",

    "wa.demo": "السلام علیکم! ہمیں اپنے ہسپتال کے لیے {product} کا ڈیمو چاہیے۔",
  },
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
      return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
