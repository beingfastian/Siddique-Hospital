// One-time update for appointments created before status/history existed.
// Only fills in missing fields (status, startAt, durationMinutes, type, history);
// never changes or removes existing data. Safe to run again.
// Run with: npm run migrate:appointments
import "dotenv/config";
import mongoose from "mongoose";
import appointmentModel from "../model/appointmentModel.js";
import { slotToDate } from "../utils/slots.js";

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || "prescripto",
  });

  // Read raw documents so schema defaults don't hide what's actually missing
  const raw = await appointmentModel.collection
    .find({ $or: [{ status: { $exists: false } }, { startAt: { $exists: false } }, { history: { $exists: false } }] })
    .toArray();

  let updated = 0;
  for (const apt of raw) {
    const set = {};
    if (!apt.status) set.status = apt.cancelled ? "cancelled" : apt.isCompleted ? "completed" : "booked";
    if (!apt.startAt) {
      const startAt = slotToDate(apt.slotDate, apt.slotTime);
      if (startAt) set.startAt = startAt;
    }
    if (apt.durationMinutes === undefined) set.durationMinutes = 30;
    if (!apt.type) set.type = "new";
    if (!apt.history) {
      set.history = [
        {
          at: new Date(apt.date || Date.now()),
          action: "booked",
          to: { slotDate: apt.slotDate, slotTime: apt.slotTime },
        },
      ];
    }
    if (Object.keys(set).length) {
      await appointmentModel.collection.updateOne({ _id: apt._id }, { $set: set });
      updated++;
    }
  }

  await appointmentModel.syncIndexes();
  console.log(`Appointments checked: ${raw.length}, updated: ${updated}. Indexes are up to date.`);
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
