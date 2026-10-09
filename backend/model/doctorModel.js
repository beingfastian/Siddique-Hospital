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
    // Hospital's share of each consultation fee, in percent (e.g. 25: fee 1000 ->
    // hospital 250, doctor 750), as agreed between the hospital and the doctor
    hospitalSharePercent: { type: Number, min: 0, max: 100, default: 0 },
    // Every change to the share, for the record (past visits keep the share they had)
    shareHistory: {
      type: [
        new mongoose.Schema({ percent: Number, from: { type: Date, default: Date.now }, by: String }, { _id: false }),
      ],
      default: [],
    },
  },
  { minimize: false }
);

const doctorModel =
  mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;
