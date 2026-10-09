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

  // "09:00" -> "9:00 AM"
  const clock = (hhmm) => {
    const [h, m] = String(hhmm || "").split(":").map(Number);
    if (Number.isNaN(h)) return hhmm;
    return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  // One honest line about when the doctor sits, worded the same way everywhere:
  // in clinic now / sits today from ... / closed for today / next sitting day /
  // not taking appointments. (Before, the home page said "Unavailable" at night
  // while the doctors page said "Available" for the same doctor.)
  const getAvailabilityDisplay = (doctor) => {
    const status = getDoctorAvailabilityStatus(doctor);
    const line = (dot, text, label) => (
      <div className={`flex items-center gap-2 text-sm ${text}`}>
        <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden="true"></span>
        <span>{label}</span>
      </div>
    );
    if (!doctor.available) return line("bg-gray-400", "text-gray-600", "Not taking appointments");
    if (status.available) return line("bg-green-600", "text-green-700", "In clinic now");
    if (status.reason?.startsWith("Available from")) return line("bg-primary", "text-primary", `Sits today from ${clock(doctor.timings?.start)}`);
    if (status.reason?.includes("closed")) return line("bg-gray-400", "text-gray-600", "Closed for today · back tomorrow");
    if (status.nextAvailable) return line("bg-gray-400", "text-gray-600", `Next sitting: ${status.nextAvailable}`);
    return line("bg-gray-400", "text-gray-600", "Call to check timings");
  };

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
      <h1 className="text-3xl font-medium">Top Doctors to Book</h1>
      <p className="sm:w-1/3 text-center text-sm">
        Browse through our extensive list of trusted doctors. Contact us via WhatsApp for quick appointment booking.
      </p>
      
      <div className="w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0">
        {doctors.slice(0, 12).map((item, index) => {
          
          return (
            <div
              key={index}
              className="border border-primary-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 bg-white shadow-sm hover:shadow-lg"
            >
              <div className="relative">
                <img 
                  className="bg-primary-50 w-full h-48 object-cover" 
                  src={item.image} 
                  alt={item.name} 
                />
                {/* Only when the doctor isn't taking appointments at all */}
                {!item.available && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-gray-700 text-white px-2 py-1 rounded-full text-xs font-medium">Not taking appointments</span>
                  </div>
                )}
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
        className="bg-primary-200 text-gray-600 px-12 py-3 rounded-full mt-10 hover:bg-primary-300 transition-colors"
      >
        View All Doctors
      </button>
    </div>
  );
};

export default TopDoctors;