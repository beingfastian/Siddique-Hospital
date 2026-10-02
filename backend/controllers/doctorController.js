import doctorModel from "../model/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../model/appointmentModel.js";
import leaveRequestModel from "../model/leaveRequestModel.js";
import { createNotification } from "./notificationController.js";
import { releaseSlot } from "../utils/slots.js";
import userModel from "../model/userModel.js";
import { sendWhatsAppCancellation } from "../config/whatsappService.js";

const changeAvailabilities = async (req, res) => {
  try {
    const { docId } = req.body;
    const docData = await doctorModel.findById(docId);
    if (!docData) {
      return res.json({ success: false, message: "Doctor not found" });
    }
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.json({ success: true, message: "Availability Changed Successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({
      success: true,
      doctors,
      message: "Doctors List Fetched Successfully",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API for doctor login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
    const token = jwt.sign(
      { id: doctor._id, role: "doctor" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );
    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor Appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });

    if (!appointments) {
      return res.json({ success: false, message: "No appointments found" });
    }
    res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment complete for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    
    if (appointmentData && appointmentData.docId === docId && !appointmentData.cancelled) {
      // Mark appointment as completed
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      
      // Get doctor details for notification
      const doctor = await doctorModel.findById(docId);
      
      // Create notification for admin
      const notification = await createNotification(
        'admin',                    // recipient
        'admin',                    // recipientType
        docId,                      // sender (doctor ID)
        'doctor',                   // senderType
        'appointment_completed',     // type
        'Appointment Completed',     // title
        `Dr. ${doctor.name} has completed an appointment with ${appointmentData.userData.name}.`, // message
        'medium',                   // priority
        appointmentId               // relatedId
      );
      
      // Emit notification via Socket.IO to admin
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('newNotification', notification);
      }
      
      return res.json({
        success: true,
        message: "Appointment Completed",
      });
    } else {
      res.json({ success: false, message: "Mark Failed" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId === docId && !appointmentData.cancelled) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      await releaseSlot(docId, appointmentData.slotDate, appointmentData.slotTime);

      // Tell the patient (if they agreed to WhatsApp messages)
      const patient = await userModel.findById(appointmentData.userId).select("name whatsappEnabled whatsappNumber phone");
      if (patient?.whatsappEnabled) {
        await sendWhatsAppCancellation(
          patient.whatsappNumber || patient.phone,
          patient.name,
          req.doctor?.name || appointmentData.docData?.name,
          appointmentData.slotDate,
          appointmentData.slotTime,
          "your doctor"
        );
      }

      return res.json({
        success: true,
        message: "Appointment Cancelled",
      });
    }
    res.json({ success: false, message: "Cancellation Failed" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });
    let earnings = 0;

    // Calculate earnings from completed appointments
    appointments.map((item) => {
      if (item.isCompleted) {
        earnings += item.amount;
      }
    });

    let patients = [];

    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor profile for doctor panel
const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel.findById(docId).select("-password");
    res.json({ success: true, profileData });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update doctor profile for doctor panel
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fee, address, available } = req.body;
    await doctorModel.findByIdAndUpdate(docId, { fee, address, available });
    res.json({ success: true, message: "Profile Updated Successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Doctor applies for leave
const requestLeave = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { fromDate, toDate, reason, type } = req.body;

    if (!doctorId) {
      return res.json({ success: false, message: "Doctor not authenticated" });
    }
    
    if (!fromDate || !toDate || !reason) {
      return res.json({ success: false, message: "All fields are required" });
    }
    
    // Validate dates
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (from < today) {
      return res.json({ success: false, message: "From date cannot be in the past" });
    }
    
    if (to < from) {
      return res.json({ success: false, message: "To date must be after from date" });
    }
    
    // Check for overlapping leave requests
    const overlap = await leaveRequestModel.findOne({
      doctorId,
      status: { $ne: "rejected" },
      $or: [
        { 
          fromDate: { $lte: new Date(toDate) }, 
          toDate: { $gte: new Date(fromDate) } 
        },
      ],
    });
    
    if (overlap) {
      return res.json({
        success: false,
        message: "Leave request overlaps with existing request",
      });
    }
    
    // Create leave request
    const leaveRequest = await leaveRequestModel.create({
      doctorId,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      type: type || "vacation",
    });
    
    // Get doctor details for notification
    const doctor = await doctorModel.findById(doctorId);
    
    // Create notification for admin
    const notification = await createNotification(
      'admin',                    // recipient
      'admin',                    // recipientType
      doctorId,                   // sender (doctor ID)
      'doctor',                   // senderType
      'leave_request',            // type
      'New Leave Request',        // title
      `Dr. ${doctor.name} has requested leave from ${from.toLocaleDateString()} to ${to.toLocaleDateString()}.`, // message
      'high',                     // priority
      leaveRequest._id.toString() // relatedId
    );
    
    // Emit notification via Socket.IO to admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('newNotification', notification);
    }
    
    res.json({ success: true, message: "Leave request submitted successfully" });
  } catch (error) {
    console.error('Error in requestLeave:', error);
    res.json({ success: false, message: error.message });
  }
};



// List doctor's leave requests
const listLeaveRequests = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const leaveRequests = await leaveRequestModel
      .find({ doctorId })
      .sort({ submittedAt: -1 });
    res.json({ success: true, leaveRequests });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Cancel a pending leave request
const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await leaveRequestModel.findById(id);
    if (!leave || leave.doctorId !== req.doctorId || leave.status !== "pending") {
      return res.json({ success: false, message: "Cannot cancel this leave request" });
    }
    await leaveRequestModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Leave request cancelled" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Add this to your existing exports
const getDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const doctorData = await doctorModel.findById(doctorId).select("-password");
    
    if (!doctorData) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    // Fix image URL - only prepend server URL if it's not already a full URL
    if (doctorData.image) {
      // If image is already a full URL (starts with http), use it as is
      if (doctorData.image.startsWith('http://') || doctorData.image.startsWith('https://')) {
        // Do nothing, keep the URL as is
      } 
      // If it's a relative path, prepend the server URL
      else {
        doctorData.image = `${req.protocol}://${req.get('host')}/${doctorData.image}`;
      }
    }
    
    res.json({ success: true, doctorData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export {
  changeAvailabilities,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  requestLeave,
  listLeaveRequests,
  cancelLeaveRequest,
  getDoctorProfile,
};