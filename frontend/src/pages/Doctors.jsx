import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext.jsx";
import { FaWhatsapp } from "react-icons/fa";
import { HOSPITAL_PHONE } from "../config";

const Doctors = () => {
  const { speciality } = useParams();
  const [filteredDoc, setFilteredDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const { doctors } = useContext(AppContext);

  // WhatsApp contact details
  const whatsappNumber = HOSPITAL_PHONE;

  const applyFilter = () => {
    if (speciality) {
      setFilteredDoc(doctors.filter((doc) => doc.speciality === speciality));
    } else {
      setFilteredDoc(doctors);
    }
  };

  const handleDoctorWhatsApp = (doctorName, speciality) => {
    const message = `Hello! I would like to request an appointment with Dr. ${doctorName} (${speciality}). Please let me know the available time slots.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // In Doctors.js component
useEffect(() => {
  try {
    applyFilter();
  } catch (error) {
    console.error("Error applying filter:", error);
    setFilteredDoc([]);
  }
}, [speciality, doctors]);

  return (
    <div>
      <p className="text-gray-600">Browse through our specialist doctors.</p>
      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
        <button
          className={`py-1 px-3 border rounded text-md transition-all sm:hidden ${
            showFilter ? "bg-primary text-white" : ""
          }`}
          onClick={() => setShowFilter((prev) => !prev)}
        >
          Filters
        </button>
        <div
          className={`flex-col gap-4 text-sm text-gray-600 ${
            showFilter ? "flex" : "hidden sm:flex"
          }`}
        >
          <p
            onClick={() => window.location.href = speciality === "General physician" ? "/doctors" : "/doctors/General physician"}
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "General physician" ? "bg-indigo-100 text-black" : ""
            }`}
          >
            General physician
          </p>
          <p
            onClick={() => window.location.href = speciality === "Gynecologist" ? "/doctors" : "/doctors/Gynecologist"}
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Gynecologist" ? "bg-indigo-100 text-black" : ""
            }`}
          >
            Gynecologist
          </p>
          <p
            onClick={() => window.location.href = speciality === "Dermatologist" ? "/doctors" : "/doctors/Dermatologist"}
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Dermatologist" ? "bg-indigo-100 text-black" : ""
            }`}
          >
            Dermatologist
          </p>
          <p
            onClick={() => window.location.href = speciality === "Pediatricians" ? "/doctors" : "/doctors/Pediatricians"}
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Pediatricians" ? "bg-indigo-100 text-black" : ""
            }`}
          >
            Pediatricians
          </p>
          <p
            onClick={() => window.location.href = speciality === "Neurologist" ? "/doctors" : "/doctors/Neurologist"}
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Neurologist" ? "bg-indigo-100 text-black" : ""
            }`}
          >
            Neurologist
          </p>
          <p
            onClick={() => window.location.href = speciality === "Gastroenterologist" ? "/doctors" : "/doctors/Gastroenterologist"}
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Gastroenterologist" ? "bg-indigo-100 text-black" : ""
            }`}
          >
            Gastroenterologist
          </p>
        </div>
        <div className="w-full grid grid-cols-auto gap-4 gap-y-6">
          {filteredDoc.map((item, index) => (
            <div
              key={index}
              className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
            >
              <img className="bg-blue-50" src={item.image} alt={item.name} />
              <div className="p-4">
                <div
                  className={`flex items-center gap-2 text-sm text-center ${
                    item.available ? "text-green-500" : "text-gray-500"
                  }`}
                >
                  <p
                    className={`w-2 h-2 ${
                      item.available ? "bg-green-500" : "bg-gray-500"
                    } rounded-full`}
                  ></p>
                  <p>{item.available ? "Available" : "Not Available"}</p>
                </div>
                <p className="text-gray-900 text-lg font-medium">{item.name}</p>
                <p className="text-gray-600 text-sm mb-3">{item.speciality}</p>
                <p className="text-gray-600 text-sm mb-3">Fee: Rs. {item.fee}</p>
                
                {item.available && (
                  <button
                    onClick={() => handleDoctorWhatsApp(item.name, item.speciality)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
                  >
                    <FaWhatsapp />
                    Request Appointment
                  </button>
                )}
                
                {!item.available && (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
                  >
                    Currently Unavailable
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Doctors;