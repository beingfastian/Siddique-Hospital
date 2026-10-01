import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext.jsx";
import { AppContext } from "../../context/AppContext.jsx";
import { assets } from "../../assets/assets.js";
import { FaWhatsapp, FaEnvelope, FaFilter, FaEye, FaSearch } from "react-icons/fa";

const AllAppointments = () => {
  const { aToken, appointments, getAllAppointments } = useContext(AdminContext);
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterNotification, setFilterNotification] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (aToken) {
      getAllAppointments();
    }
  }, [aToken]);

  const filteredAppointments = appointments.filter(item => {
    const matchesSearch = item.userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.docData.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterStatus !== "all") {
      if (filterStatus === "cancelled" && !item.cancelled) return false;
      if (filterStatus === "completed" && item.isCompleted === false) return false;
      if (filterStatus === "pending" && (item.cancelled || item.isCompleted)) return false;
    }
    
    if (filterNotification !== "all") {
      if (filterNotification === "whatsapp" && !item.userData?.whatsappEnabled) return false;
      if (filterNotification === "email" && item.userData?.whatsappEnabled) return false;
    }
    
    return true;
  });

  const getStatusBadge = (item) => {
    if (item.cancelled) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Cancelled</span>;
    } else if (item.isCompleted) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Completed</span>;
    } else {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Pending</span>;
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">All Appointments</h1>
            <p className="text-gray-600 mt-1">Overview of all appointments in the system</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <FaEye className="text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">View Only - Doctors manage appointments</span>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient or doctor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="flex gap-3">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select 
                value={filterNotification} 
                onChange={(e) => setFilterNotification(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Notifications</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email Only</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <FaWhatsapp className="text-green-500" />
                {appointments.filter(a => a.userData?.whatsappEnabled).length} WhatsApp enabled
              </span>
              <span className="text-gray-400">|</span>
              <span>Total: {appointments.length} appointments</span>
            </div>
            <span>Showing: {filteredAppointments.length} results</span>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700">
          <div className="col-span-3">Patient</div>
          <div className="col-span-1">Age</div>
          <div className="col-span-2">Date & Time</div>
          <div className="col-span-2">Doctor</div>
          <div className="col-span-1">Fee</div>
          <div className="col-span-1">Contact</div>
          <div className="col-span-2">Status</div>
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
                  </div>
                  
                  <div className="col-span-2 flex items-center gap-2">
                    <img
                      className="w-8 h-8 rounded-full object-cover"
                      src={item.docData.image}
                      alt={item.docData.name}
                    />
                    <span className="font-medium text-gray-900">{item.docData.name}</span>
                  </div>
                  
                  <div className="col-span-1 font-semibold text-gray-900">
                    {currency} {item.docData.fee}
                  </div>
                  
                  <div className="col-span-1">
                    {item.userData?.whatsappEnabled ? (
                      <FaWhatsapp className="text-green-500 text-lg" title="WhatsApp" />
                    ) : (
                      <FaEnvelope className="text-blue-500 text-lg" title="Email" />
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    {getStatusBadge(item)}
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
                    <div className="text-right">
                      {getStatusBadge(item)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Date & Time</p>
                      <p className="font-medium">{slotDateFormat(item.slotDate)}</p>
                      <p className="text-gray-600">{item.slotTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Doctor</p>
                      <p className="font-medium">{item.docData.name}</p>
                      <p className="text-gray-600">{currency} {item.docData.fee}</p>
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
                {searchTerm || filterStatus !== "all" || filterNotification !== "all" 
                  ? "No matching appointments found" 
                  : "No appointments yet"
                }
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== "all" || filterNotification !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Appointments will appear here once patients book with doctors"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Message */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <FaEye className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Admin View Only</h4>
            <p className="text-sm text-blue-700 mt-1">
              This is a read-only view for administrators. Appointments can only be managed (completed/cancelled) 
              by the respective doctors through their dashboard. Use the "Book for Patient" feature to create new appointments.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {appointments.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
            <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => !a.isCompleted && !a.cancelled).length}
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
        </div>
      )}
    </div>
  );
};

export default AllAppointments;