import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true }, // 'admin' or doctor ID
  recipientType: { type: String, required: true, enum: ['admin', 'doctor'] },
  sender: { type: String, required: true }, // doctor ID or 'admin'
  senderType: { type: String, required: true, enum: ['admin', 'doctor'] },
  type: { 
    type: String, 
    required: true, 
    enum: ['leave_request', 'leave_approved', 'leave_rejected', 'new_appointment', 'appointment_completed', 'appointment_rescheduled', 'appointment_cancelled', 'new_patient']
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
  relatedId: { type: String }, // ID of related entity (appointment, leave request, etc.)
});

const notificationModel = mongoose.models.notification || mongoose.model("notification", notificationSchema);
export default notificationModel;