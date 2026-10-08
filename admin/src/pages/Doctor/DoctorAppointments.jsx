import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { FaWhatsapp, FaEnvelope, FaSearch, FaFilter, FaCalendarPlus, FaExchangeAlt, FaCalendarDay, FaUserSlash } from "react-icons/fa";
import FollowUpModal from "../../components/FollowUpModal";
import { DoctorRescheduleModal } from "../../components/RescheduleModal";
import DayActionsDialog from "../../components/DayActionsDialog";

const DoctorAppointments = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
    rescheduleDay,
    cancelDay,
    profileData,
    markNoShow,
  } = useContext(DoctorContext);
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [followUpFor, setFollowUpFor] = useState(null);
  const [rescheduleFor, setRescheduleFor] = useState(null);
  const [showDayActions, setShowDayActions] = useState(false);

  // Follow-up booked from each visit: parent appointment id -> follow-up appointment
  const followUps = {};
  appointments.forEach((a) => {
    if (a.parentAppointmentId && !a.cancelled) followUps[a.parentAppointmentId] = a;
  });

  useEffect(() => {
    dToken && getAppointments();
  }, [dToken]);

  // Filter appointments based on search and status
  const filteredAppointments = appointments.filter(item => {
    const matchesSearch = item.userData.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "completed" && item.isCompleted) ||
      (filterStatus === "cancelled" && item.cancelled) ||
      (filterStatus === "no_show" && item.status === "no_show") ||
      (filterStatus === "pending" && !item.isCompleted && !item.cancelled && item.status !== "no_show");
    
    return matchesSearch && matchesStatus;
  }).reverse();

  const getTypeBadge = (item) =>
    item.type === "follow_up" && (
      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Follow-up</span>
    );

  const followUpNote = (item) =>
    followUps[item._id] && (
      <p className="text-xs text-purple-700 mt-1">
        Follow-up: {slotDateFormat(followUps[item._id].slotDate)}, {followUps[item._id].slotTime}
      </p>
    );

  const rescheduleButton = (item) =>
    !item.cancelled && !item.isCompleted && (
      <button
        onClick={() => setRescheduleFor(item)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Reschedule"
        aria-label="Reschedule"
      >
        <FaExchangeAlt className="w-4 h-4" />
      </button>
    );

  const followUpButton = (item) =>
    !item.cancelled && (
      <button
        onClick={() => setFollowUpFor(item)}
        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        title="Schedule follow-up"
        aria-label="Schedule follow-up"
      >
        <FaCalendarPlus className="w-4 h-4" />
      </button>
    );

  const getStatusBadge = (item) => {
    if (item.cancelled) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Cancelled</span>;
    } else if (item.isCompleted) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Completed</span>;
    } else if (item.status === "no_show") {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">No-show</span>;
    } else {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Pending</span>;
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">All Appointments</h1>
          <button
            onClick={() => setShowDayActions(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FaCalendarDay className="text-blue-600" />
            Manage a day
          </button>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No-show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700">
          <div className="col-span-3">Patient</div>
          <div className="col-span-1">Age</div>
          <div className="col-span-2">Date & Time</div>
          <div className="col-span-1">Payment</div>
          <div className="col-span-1">Fee</div>
          <div className="col-span-1">Contact</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Actions</div>
        </div>

        {/* Appointments List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((item, index) => (
              <div key={index} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                {/* Desktop Layout */}
                <div className="hidden lg:grid grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <img
                      className="w-10 h-10 rounded-full object-cover"
                      src={item.userData.image}
                      alt={item.userData.name}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{item.userData.name}</p>
                      {item.userData.whatsappEnabled && (
                        <p className="text-xs text-green-600">{item.userData.whatsappNumber}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-1 text-gray-600">
                    {calculateAge(item.userData.dob)}
                  </div>
                  
                  <div className="col-span-2 text-gray-600">
                    <p className="font-medium">{slotDateFormat(item.slotDate)}</p>
                    <p className="text-sm text-gray-500">{item.slotTime}</p>
                    {followUpNote(item)}
                  </div>
                  
                  <div className="col-span-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {item.payment ? "Online" : "Cash"}
                    </span>
                  </div>
                  
                  <div className="col-span-1 font-semibold text-gray-900">
                    {currency}{item.amount}
                  </div>
                  
                  <div className="col-span-1">
                    {item.userData?.whatsappEnabled ? (
                      <FaWhatsapp className="text-green-500 text-lg" title="WhatsApp" />
                    ) : (
                      <FaEnvelope className="text-blue-500 text-lg" title="Email" />
                    )}
                  </div>
                  
                  <div className="col-span-1 flex flex-col items-start gap-1">
                    {getStatusBadge(item)}
                    {getTypeBadge(item)}
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex gap-2">
                      {!item.cancelled && !item.isCompleted && (
                        <>
                          <button
                            onClick={() => window.confirm(`Cancel ${item.userData.name}'s appointment? The patient will be told on WhatsApp.`) && cancelAppointment(item._id)}
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
                          {item.status !== "no_show" && (
                            <button
                              onClick={() =>
                                window.confirm("Mark this appointment as no-show? The patient didn't come.") &&
                                markNoShow(item._id)
                              }
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Mark as no-show"
                            >
                              <FaUserSlash className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {rescheduleButton(item)}
{followUpButton(item)}
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-12 h-12 rounded-full object-cover"
                        src={item.userData.image}
                        alt={item.userData.name}
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{item.userData.name}</p>
                        <p className="text-sm text-gray-500">Age: {calculateAge(item.userData.dob)}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {getStatusBadge(item)}
                      {getTypeBadge(item)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Date & Time</p>
                      <p className="font-medium">{slotDateFormat(item.slotDate)}</p>
                      <p className="text-gray-600">{item.slotTime}</p>
                      {followUpNote(item)}
                    </div>
                    <div>
                      <p className="text-gray-500">Fee</p>
                      <p className="font-semibold">{currency}{item.amount}</p>
                      <p className="text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {item.payment ? "Online" : "Cash"}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.userData?.whatsappEnabled ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <FaWhatsapp />
                          <span>WhatsApp</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <FaEnvelope />
                          <span>Email</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {!item.cancelled && !item.isCompleted && (
                        <>
                          <button
                            onClick={() => window.confirm(`Cancel ${item.userData.name}'s appointment? The patient will be told on WhatsApp.`) && cancelAppointment(item._id)}
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
                          {item.status !== "no_show" && (
                            <button
                              onClick={() =>
                                window.confirm("Mark this appointment as no-show? The patient didn't come.") &&
                                markNoShow(item._id)
                              }
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Mark as no-show"
                            >
                              <FaUserSlash className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {rescheduleButton(item)}
{followUpButton(item)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="text-gray-400 text-xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== "all" ? "No matching appointments" : "No appointments found"}
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Your appointments will appear here once patients book with you"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {appointments.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
            <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => !a.isCompleted && !a.cancelled && a.status !== "no_show").length}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.isCompleted).length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
            <div className="text-2xl font-bold text-red-600">
              {appointments.filter(a => a.cancelled).length}
            </div>
            <div className="text-sm text-gray-500">Cancelled</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {appointments.filter(a => a.status === "no_show").length}
            </div>
            <div className="text-sm text-gray-500">No-show</div>
          </div>
        </div>
      )}

      {followUpFor && (
        <FollowUpModal appointment={followUpFor} onClose={() => setFollowUpFor(null)} />
      )}
      {rescheduleFor && (
        <DoctorRescheduleModal appointment={rescheduleFor} onClose={() => setRescheduleFor(null)} />
      )}
      {showDayActions && (
        <DayActionsDialog
          doctorName={profileData?.name}
          appointments={appointments}
          onMove={rescheduleDay}
          onCancelDay={cancelDay}
          onClose={() => setShowDayActions(false)}
        />
      )}
    </div>
  );
};

export default DoctorAppointments;