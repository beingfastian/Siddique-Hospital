import React, { useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import ProfitReport from "../../components/ProfitReport";
import { FaWhatsapp, FaEnvelope, FaDollarSign, FaCalendarCheck, FaUsers, FaUserSlash } from "react-icons/fa";

const DoctorDashboard = () => {
  const {
    getDashData,
    dashData,
    dToken,
    completeAppointment,
    cancelAppointment,
  } = useContext(DoctorContext);
  const { slotDateFormat, currency } = useContext(AppContext);
  
  useEffect(() => {
    if (dToken) {
      getDashData();
    }
  }, [dToken]);
  
  return (
    dashData && (
      <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">My Earnings (all time)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currency}{Number(dashData.earnings || 0).toLocaleString("en-PK")}
                </p>
                {dashData.hospitalSharePercent > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">After the hospital&apos;s {dashData.hospitalSharePercent}% share</p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FaDollarSign className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashData.appointments}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaCalendarCheck className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashData.patients}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FaUsers className="text-indigo-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">No-shows</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashData.noShow ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FaUserSlash className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* The doctor's earnings by day / week / month */}
        <div className="mb-8">
          <ProfitReport mode="doctor" headers={{ dtoken: dToken }} />
        </div>

        {/* Latest Bookings */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Latest Bookings</h2>
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
                      src={item.userData.image}
                      alt={item.userData.name}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{item.userData.name}</p>
                      <p className="text-sm text-gray-500">
                        {slotDateFormat(item.slotDate)}, {item.slotTime}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      {item.userData?.whatsappEnabled ? (
                        <FaWhatsapp className="text-green-500 w-4 h-4" title="WhatsApp enabled" />
                      ) : (
                        <FaEnvelope className="text-blue-500 w-4 h-4" title="Email only" />
                      )}
                    </div>
                    
                    {item.cancelled ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">
                        Cancelled
                      </span>
                    ) : item.isCompleted ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                        Completed
                      </span>
                    ) : item.status === "no_show" ? (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">
                        No-show
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => cancelAppointment(item._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => completeAppointment(item._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Complete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Yet</h3>
                <p className="text-gray-500">Your upcoming appointments will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorDashboard;