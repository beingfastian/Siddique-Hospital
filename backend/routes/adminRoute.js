import express from "express";
import {
  addDoctor,
  updateDoctor,
  deleteDoctor,
  allDoctors,
  loginAdmin,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  addPatient,
  getAllPatients,
  updatePatient,
  deletePatient,
  bookAppointmentForPatient,
  getWhatsAppStats,
  // Make sure these are imported correctly
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveStats,
  getSystemStatus,
} from "../controllers/adminController.js";
import upload from "../middleware/multer.js";
import authAdmin from "../middleware/authAdmin.js";
import { changeAvailabilities } from "../controllers/doctorController.js";
import { rescheduleOne, rescheduleWholeDay, cancelWholeDay } from "../controllers/rescheduleController.js";

const adminRouter = express.Router();

// Authentication (public route)
adminRouter.post("/login", loginAdmin);

// Doctor Management Routes
adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
adminRouter.put("/update-doctor/:doctorId", authAdmin, updateDoctor);
adminRouter.delete("/delete-doctor/:doctorId", authAdmin, deleteDoctor);
adminRouter.post("/all-doctors", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailabilities);

// Patient Management Routes
adminRouter.post("/add-patient", authAdmin, upload.single("image"), addPatient);
adminRouter.get("/all-patients", authAdmin, getAllPatients);
adminRouter.put("/update-patient/:patientId", authAdmin, updatePatient);
adminRouter.delete("/delete-patient/:patientId", authAdmin, deletePatient);

// Appointment Management Routes
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel); // Fixed: removed 's'
adminRouter.post("/mark-no-show", authAdmin, appointmentNoShow);
adminRouter.post("/book-appointment-for-patient", authAdmin, bookAppointmentForPatient);
adminRouter.post("/reschedule-appointment", authAdmin, rescheduleOne("admin"));
adminRouter.post("/reschedule-day", authAdmin, rescheduleWholeDay("admin"));
adminRouter.post("/cancel-day", authAdmin, cancelWholeDay("admin"));

// Leave Management Routes - Ensure these are properly defined
adminRouter.get("/leave-requests", authAdmin, getAllLeaveRequests);
adminRouter.post("/approve-leave", authAdmin, approveLeaveRequest);
adminRouter.post("/reject-leave", authAdmin, rejectLeaveRequest);
adminRouter.get("/leave-stats", authAdmin, getLeaveStats);

// Dashboard and Statistics
adminRouter.get("/dashboard", authAdmin, adminDashboard);
adminRouter.get("/whatsapp-stats", authAdmin, getWhatsAppStats);
adminRouter.get("/system-status", authAdmin, getSystemStatus);

export default adminRouter;