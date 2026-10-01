import React, { useCallback, useContext, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AdminContext } from "./context/AdminContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Admin/Dashboard.jsx";
import AllAppointments from "./pages/Admin/AllAppointments.jsx";
import AddDoctor from "./pages/Admin/AddDoctor.jsx";
import ManageDoctors from "./pages/Admin/ManageDoctors.jsx";
import AddPatient from "./pages/Admin/AddPatient.jsx";
import ManagePatients from "./pages/Admin/ManagePatients.jsx";
import Settings from "./pages/Admin/Settings.jsx";
import BookAppointmentForPatient from "./pages/Admin/BookAppointmentForPatient.jsx";
import { DoctorContext } from "./context/DoctorContext.jsx";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard.jsx";
import DoctorAppointments from "./pages/Doctor/DoctorAppointments.jsx";
import DoctorProfile from "./pages/Doctor/DoctorProfile.jsx";
import DoctorLeaveRequest from "./pages/Doctor/DoctorLeaveRequest";
import AdminLeaveManagement from './pages/Admin/AdminLeaveManagement.jsx';
import { NotificationProvider } from "./context/NotificationContext.jsx";
import ForgotPassword from "./pages/Doctor/ForgotPassword";
import VerifyOTP from "./pages/Doctor/VerifyOTP";
import ResetPassword from "./pages/Doctor/ResetPassword";

const App = () => {
  const { aToken } = useContext(AdminContext);
  const { dToken } = useContext(DoctorContext);
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);
  return (
    <BrowserRouter>
      <ToastContainer />
      {aToken || dToken ? (
        <NotificationProvider>
          <div className="min-h-screen bg-[#F8F9FD]">
            <Navbar onMenuClick={() => setNavOpen(true)} />
            <div className="flex">
              <Sidebar mobileOpen={navOpen} onClose={closeNav} />
              <main className="flex-1 min-w-0">
              {aToken ? (
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/all-appointments" element={<AllAppointments />} />
                  <Route path="/book-appointment" element={<BookAppointmentForPatient />} />
                  <Route path="/doctors" element={<ManageDoctors />} />
                  <Route path="/add-doctor" element={<AddDoctor />} />
                  <Route path="/patients" element={<ManagePatients />} />
                  <Route path="/add-patient" element={<AddPatient />} />
                  <Route path="/leave-management" element={<AdminLeaveManagement />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              ) : (
                <Routes>
                  <Route path="/doctor" element={<DoctorDashboard />} />
                  <Route path="/doctor/appointments" element={<DoctorAppointments />} />
                  <Route path="/doctor/profile" element={<DoctorProfile />} />
                  <Route path="/doctor/leave-requests" element={<DoctorLeaveRequest />} />
                  <Route path="*" element={<Navigate to="/doctor" replace />} />
                </Routes>
              )}
              </main>
            </div>
          </div>
        </NotificationProvider>
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;