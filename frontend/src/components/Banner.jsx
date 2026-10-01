import React from "react";
import { assets } from "../assets/assets";
import { FaWhatsapp } from "react-icons/fa";
import { HOSPITAL_PHONE } from "../config";

const Banner = () => {
  // WhatsApp contact details
  const whatsappNumber = HOSPITAL_PHONE;
  const whatsappMessage = "Hello! I saw your website and would like to request an appointment. Could you please help me schedule one?";
  
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex bg-primary rounded-lg px-6 sm:px-10 md:px-14 lg:px-12 md:mx-10">
      {/* Left Side */}
      <div className="flex-1 py-8 sm:py-10 md:py-16 lg:py-24 lg:pl-5">
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold text-white">
          <p className="mt-4">Book Appointment</p>
          <p>With 100+ Trusted Doctors</p>
        </div>
        <p className="text-white text-sm sm:text-base mt-4 mb-6 opacity-90">
          Contact us on WhatsApp for instant appointment booking
        </p>
        <button
          onClick={handleWhatsAppClick}
          className="bg-green-500 hover:bg-green-600 text-white text-lg font-medium px-8 py-4 rounded-full mt-6 hover:scale-105 transition-all duration-300 flex items-center gap-3 shadow-lg"
        >
          <FaWhatsapp className="text-xl" />
          Contact on WhatsApp
        </button>
      </div>
      
      {/* Right Side */}
      <div className="hidden md:block md:w-1/2 lg:w-[370px] relative">
        <img
          className="w-full absolute bottom-0 right-0 max-w-md"
          src={assets.appointment_img}
          alt="Appointment"
        />
      </div>
    </div>
  );
};

export default Banner;