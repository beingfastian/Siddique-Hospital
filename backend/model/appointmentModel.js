import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  docId: { type: String, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number, required: true },
  date: { type: Number, required: true },
  cancelled: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  // --- Admin/discount/cnic fields ---
  discountPercent: { type: Number, default: 0 }, // Discount applied (if any)
  finalFee: { type: Number }, // Final fee after discount (if any)
  cnic: { type: String }, // Patient CNIC (for admin bookings)
  // ...add more admin-specific fields as needed...
});

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);

export default appointmentModel;