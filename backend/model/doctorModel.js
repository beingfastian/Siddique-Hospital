import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fee: { type: Number, required: true },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    // --- New fields for admin/doctor ---
    whatsappEnabled: { type: Boolean, default: false },
    whatsappNumber: { type: String, default: "" },
    whatsappConsentAt: { type: Date }, // When the doctor agreed to WhatsApp messages
    timings: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "17:00" },
    },
    sittingDays: { type: [String], default: [] }, // e.g. ["monday", "tuesday"]
    holidays: { type: String, default: "" },
  },
  { minimize: false }
);

const doctorModel =
  mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;
