import mongoose from "mongoose";

// A patient. Identified by CNIC when given; the phone is a contact number, not an
// identity: in Pakistan a family often shares one phone (father, mother and children
// registered on the same number), and some walk-in patients have no phone at all.
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cnic: { type: String, unique: true, sparse: true }, // Unique CNIC (when known)
  phone: { type: String, index: true }, // contact number; can be shared by a family
  // "yyyy-mm-dd". Walk-ins registered at the queue give only an age: dob is then worked
  // out from it and dobEstimated is true.
  dob: { type: String },
  dobEstimated: { type: Boolean },
  gender: { type: String, default: "Male" },
  address: { type: Object, default: () => ({ line1: "", line2: "" }) },
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
  createdAt: { type: Date, default: Date.now },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
