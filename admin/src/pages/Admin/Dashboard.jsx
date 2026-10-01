import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext.jsx";
import { assets } from "../../assets/assets.js";
import { AppContext } from "../../context/AppContext.jsx";
import { FaWhatsapp, FaEnvelope, FaUserMd, FaCalendarCheck, FaUsers, FaChartLine } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { aToken, getDashData, dashData, cancelAppointment, backendUrl } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);
  const [whatsappStats, setWhatsappStats] = useState({
    enabledUsers: 0,
    todayNotifications: 0
  });

  const getWhatsAppStats = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/whatsapp-stats", {
        headers: { aToken }
      });
      if (data.success) {
        setWhatsappStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp stats:", error);
    }
  };

  useEffect(() => {
    if (aToken) {
      getDashData();
      getWhatsAppStats();
    }
  }, [aToken]);

  if (!dashData) {
    return (
      <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-2xl"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-64 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Doctors",
      value: dashData.doctors,
      icon: <FaUserMd className="text-2xl" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Total Appointments",
      value: dashData.appointments,
      icon: <FaCalendarCheck className="text-2xl" />,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    },
    {
      title: "Total Patients",
      value: dashData.patients,
      icon: <FaUsers className="text-2xl" />,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "WhatsApp Enabled",
      value: whatsappStats.enabledUsers,
      subtitle: `${whatsappStats.todayNotifications} sent today`,
      icon: <FaWhatsapp className="text-2xl" />,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

  return (
    <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your healthcare system today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                )}
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                <div className={card.color}>
                  {card.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Latest Bookings</h2>
                <p className="text-sm text-gray-500">Recent appointment bookings</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FaWhatsapp className="text-green-500" />
                <span>WhatsApp</span>
              </div>
              <div className="flex items-center gap-1">
                <FaEnvelope className="text-blue-500" />
                <span>Email</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {dashData.latestAppointments.length !== 0 ? (
            dashData.latestAppointments.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <img
                    className="w-12 h-12 rounded-full object-cover"
                    src={item.docData.image}
                    alt={item.docData.name}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{item.docData.name}</p>
                    <p className="text-sm text-gray-600">Patient: {item.userData.name}</p>
                    <p className="text-sm text-gray-500">
                      {slotDateFormat(item.slotDate)}, {item.slotTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {item.userData.whatsappEnabled && (
                      <div className="flex items-center gap-1">
                        <FaWhatsapp className="text-green-500 w-4 h-4" title="WhatsApp enabled" />
                      </div>
                    )}
                    <FaEnvelope className="text-blue-500 w-4 h-4" title="Email notification" />
                  </div>

                  {item.cancelled ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">
                      Cancelled
                    </span>
                  ) : item.isCompleted ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                      Completed
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">
                        Pending
                      </span>
                      <button
                        onClick={() => window.confirm("Cancel this appointment? The patient's slot will be freed.") && cancelAppointment(item._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel Appointment"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarCheck className="text-gray-400 text-xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Appointments</h3>
              <p className="text-gray-500">New appointment bookings will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;