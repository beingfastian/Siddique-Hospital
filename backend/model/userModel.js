import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cnic: { type: String, unique: true, sparse: true }, // Unique CNIC for admin patients
  phone: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  gender: { type: String, default: "Male" },
  address: { type: Object, required: true },
  image: { type: String },
  whatsappEnabled: { type: Boolean, default: false },
  whatsappNumber: { type: String, default: "" },
  // When the patient agreed to receive WhatsApp messages (set when WhatsApp is enabled)
  whatsappConsentAt: { type: Date },
  // Language of WhatsApp messages: "ur" (Urdu) or "en" (English). Missing on older
  // records, which then use WHATSAPP_DEFAULT_LANGUAGE (Urdu unless set).
  language: { type: String, enum: ["ur", "en"] },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;