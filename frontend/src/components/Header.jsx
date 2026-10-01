import React from "react";
import { assets } from "../assets/assets";
import { FaWhatsapp } from "react-icons/fa";
import { HOSPITAL_PHONE } from "../config";

const Header = () => {
  // WhatsApp contact details
  const whatsappNumber = HOSPITAL_PHONE;
  const whatsappMessage = "Hello! I would like to request an appointment. Please provide me with available times and doctor information.";
  
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col md:flex-row flex-wrap bg-primary rounded-lg px-6 md:px-10 lg:px-20">
      {/* Left Side */}
      <div className="md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[10vw] md:mb-[-30px]">
        <p className="text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight">
          Book Appointment <br /> With Trusted Doctors
        </p>
        <div className="flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light">
          <img className="w-28" src={assets.group_profiles} alt="Group Image" />
          <p>
            Simply contact us via WhatsApp to schedule your appointment with our{" "}
            <br className="hidden sm:block" />
            trusted doctors. Quick, easy, and hassle-free.
          </p>
        </div>
        <button
          onClick={handleWhatsAppClick}
          className="flex items-center gap-3 bg-green-500 hover:bg-green-600 px-8 py-4 rounded-full text-white text-lg font-medium m-auto md:m-0 hover:scale-105 transition-all duration-300 shadow-lg"
        >
          <FaWhatsapp className="text-2xl" />
          Request Appointment
        </button>
        
        {/* Additional contact info */}
        <div className="flex items-center gap-2 text-white text-sm opacity-90 mt-2">
          <FaWhatsapp className="text-green-300" />
          <span>WhatsApp: {whatsappNumber}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="md:w-1/2 relative">
        <img
          className="w-full md:absolute bottom-0 h-auto rounded-lg"
          src={assets.header_img}
          alt="Header Image"
        />
      </div>
    </div>
  );
};

export default Header;