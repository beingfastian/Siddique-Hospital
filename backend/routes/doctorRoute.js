// Fixed doctorRoute.js - Ensure proper route configuration
import express from "express";
import {
  appointmentsDoctor,
  doctorList,
  loginDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  requestLeave,
  listLeaveRequests,
  cancelLeaveRequest,
  getDoctorProfile,
  scheduleFollowUp,
} from "../controllers/doctorController.js";
import authDoctor from "../middleware/authDoctor.js";

const doctorRouter = express.Router();

// Public routes
doctorRouter.get("/list", doctorList);
doctorRouter.post("/login", loginDoctor);

// Protected routes (require authentication)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.post("/follow-up", authDoctor, scheduleFollowUp);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);
doctorRouter.get("/get-profile", authDoctor, getDoctorProfile);
// Leave request routes with proper HTTP methods
doctorRouter.post("/request-leave", authDoctor, requestLeave);
doctorRouter.get("/leave-requests", authDoctor, listLeaveRequests);
doctorRouter.delete("/cancel-leave-request/:id", authDoctor, cancelLeaveRequest);

export default doctorRouter;