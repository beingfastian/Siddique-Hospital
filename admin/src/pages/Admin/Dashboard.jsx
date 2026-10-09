import React, { useContext, useEffect, useState } from "react";
import { useDialog } from "../../components/ui/Dialog";
import Avatar from "../../components/ui/Avatar";
import { Skeleton, StatTile } from "../../components/ui";
import { AdminContext } from "../../context/AdminContext.jsx";
import { AppContext } from "../../context/AppContext.jsx";
import { FaWhatsapp, FaEnvelope, FaUserMd, FaCalendarCheck, FaUsers, FaUserSlash } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import ProfitReport from "../../components/ProfitReport";

const Dashboard = () => {
  const { confirm } = useDialog();
  const { aToken, getDashData, dashData, cancelAppointment, backendUrl, doctors, getAllDoctors } = useContext(AdminContext);
  // Doctors for the profit report's filter
  useEffect(() => {
    if (aToken) getAllDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aToken]);
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

  // Tiles keep their slot while loading, so nothing jumps when numbers arrive
  const loading = !dashData;
  const last30 = dashData?.last30Days;

  return (
    <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Doctors, bookings and earnings at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatTile label="Doctors" value={dashData?.doctors} icon={<FaUserMd />} loading={loading} />
        <StatTile label="Appointments" value={dashData?.appointments} icon={<FaCalendarCheck />} loading={loading} />
        <StatTile label="Patients" value={dashData?.patients} icon={<FaUsers />} loading={loading} />
        <StatTile
          label="WhatsApp enabled"
          value={whatsappStats.enabledUsers}
          hint={`${whatsappStats.todayNotifications} message${whatsappStats.todayNotifications === 1 ? "" : "s"} sent today`}
          icon={<FaWhatsapp />}
          loading={loading}
        />
        {/* Of patients who should have come (and didn't cancel ahead), how many never showed */}
        <StatTile
          label="No-shows (30 days)"
          value={last30 ? last30.noShow : 0}
          hint={last30 ? `${last30.noShowRate}% missed · ${last30.cancelled} cancelled ahead` : undefined}
          icon={<FaUserSlash />}
          loading={loading}
        />
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
      <>
      {/* Hospital profit by day / week / month, per doctor or all */}
      <div className="mb-8">
        <ProfitReport mode="admin" headers={{ atoken: aToken }} doctors={doctors} />
      </div>

      {/* Latest Bookings */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Latest bookings</h2>
              <p className="text-sm text-slate-600">The most recent appointments</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FaWhatsapp className="text-green-500" />
                <span>WhatsApp</span>
              </div>
              <div className="flex items-center gap-1">
                <FaEnvelope className="text-primary-600" />
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
                  <Avatar src={item.docData.image} name={item.docData.name} className="w-12 h-12" textClass="text-base" />
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
                    <FaEnvelope className="text-primary-600 w-4 h-4" title="Email notification" />
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
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">
                        Pending
                      </span>
                      <button
                        onClick={async () =>
                          (await confirm({
                            title: `Cancel ${item.userData?.name || "this patient"}'s appointment?`,
                            message: "The time slot is freed and the patient is told on WhatsApp (if they agreed to messages).",
                            confirmLabel: "Cancel appointment",
                            tone: "danger",
                          })) && cancelAppointment(item._id)
                        }
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
      </>
      )}
    </div>
  );
};

export default Dashboard;