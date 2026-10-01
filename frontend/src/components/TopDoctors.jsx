import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { FaWhatsapp, FaClock, FaCalendarDay } from "react-icons/fa";
import { HOSPITAL_PHONE } from "../config";

const TopDoctors = () => {
  const { 
    doctors, 
    currencySymbol, 
    getDoctorAvailabilityStatus, 
    formatWorkingHours, 
    formatSittingDays 
  } = useContext(AppContext);
  const navigate = useNavigate();

  // WhatsApp contact function
  const handleDoctorWhatsApp = (doctorName, speciality) => {
    const whatsappNumber = HOSPITAL_PHONE;
    const message = `Hello! I would like to request an appointment with Dr. ${doctorName} (${speciality}). Please let me know the available time slots.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const getAvailabilityDisplay = (doctor) => {
    const status = getDoctorAvailabilityStatus(doctor);
    
    const kind = status.available
      ? "available"
      : status.reason === "On leave"
        ? "on-leave"
        : "unavailable";

    switch (kind) {
      case "available":
        return (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Available Now</span>
          </div>
        );
      case "on-leave":
        return (
          <div className="flex items-center gap-2 text-sm text-orange-500">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>On Leave</span>
          </div>
        );
      case "unavailable":
        if (status.reason.includes("Available from")) {
          return (
            <div className="flex items-center gap-2 text-sm text-blue-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Opens Later</span>
            </div>
          );
        } else if (status.reason.includes("closed")) {
          return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>Closed</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>Unavailable</span>
            </div>
          );
        }
      default:
        return (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span>Contact for availability</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
      <h1 className="text-3xl font-medium">Top Doctors to Book</h1>
      <p className="sm:w-1/3 text-center text-sm">
        Browse through our extensive list of trusted doctors. Contact us via WhatsApp for quick appointment booking.
      </p>
      
      <div className="w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0">
        {doctors.slice(0, 12).map((item, index) => {
          const availabilityStatus = getDoctorAvailabilityStatus(item);
          
          return (
            <div
              key={index}
              className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 bg-white shadow-sm hover:shadow-lg"
            >
              <div className="relative">
                <img 
                  className="bg-blue-50 w-full h-48 object-cover" 
                  src={item.image} 
                  alt={item.name} 
                />
                {/* Availability Badge */}
                <div className="absolute top-2 right-2">
                  {availabilityStatus.available ? (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Available
                    </span>
                  ) : (
                    <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Unavailable
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                {/* Availability Status */}
                {getAvailabilityDisplay(item)}
                
                {/* Doctor Info */}
                <h3 className="text-gray-900 text-lg font-medium mt-2">{item.name}</h3>
                <p className="text-gray-600 text-sm">{item.speciality}</p>
                <p className="text-primary font-medium text-sm mt-1">
                  {currencySymbol} {item.fee}
                </p>
                
                {/* Working Hours & Days */}
                <div className="mt-2 space-y-1">
                  {item.timings && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FaClock />
                      <span>{formatWorkingHours(item)}</span>
                    </div>
                  )}
                  {item.sittingDays && item.sittingDays.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FaCalendarDay />
                      <span>{formatSittingDays(item)}</span>
                    </div>
                  )}
                </div>

                {/* WhatsApp Contact Button */}
                <button
                  onClick={() => handleDoctorWhatsApp(item.name, item.speciality)}
                  className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 text-sm"
                >
                  <FaWhatsapp />
                  Request Appointment
                </button>

                {/* Additional Info for Unavailable Doctors */}
                {!availabilityStatus.available && availabilityStatus.nextAvailable && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Next available: {availabilityStatus.nextAvailable}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <button
        onClick={() => {
          navigate("/doctors");
          scrollTo(0, 0);
        }}
        className="bg-blue-200 text-gray-600 px-12 py-3 rounded-full mt-10 hover:bg-blue-300 transition-colors"
      >
        View All Doctors
      </button>
    </div>
  );
};

export default TopDoctors;