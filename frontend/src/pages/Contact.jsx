import React from "react";
import { assets } from "../assets/assets";
import { FaWhatsapp, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { HOSPITAL_ADDRESS, HOSPITAL_EMAIL, HOSPITAL_PHONE } from "../config";

const Contact = () => {
  // Contact details
  const whatsappNumber = HOSPITAL_PHONE;
  const phoneNumber = HOSPITAL_PHONE;
  const email = HOSPITAL_EMAIL;
  
  const handleWhatsAppClick = () => {
    const message = "Hello! I would like to get in touch regarding your medical services.";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneClick = () => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleEmailClick = () => {
    window.open(`mailto:${email}`, '_self');
  };

  return (
    <div>
      <div className="text-center text-2xl pt-10 text-gray-500">
        <p>
          CONTACT <span className="text-gray-700 font-semibold">US</span>
        </p>
      </div>
      
      <div className="my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-md">
        <img
          className="w-full md:max-w-[360px]"
          src={assets.contact_image}
          alt="Contact"
        />
        <div className="flex flex-col justify-center items-start gap-6">
          <p className="font-semibold text-xl text-gray-600">OUR OFFICE</p>
          <div className="flex items-start gap-3 text-gray-500">
            <FaMapMarkerAlt className="text-primary mt-1" />
            <div>
              <p>{HOSPITAL_ADDRESS}</p>
            </div>
          </div>
          
          {/* Contact Methods */}
          <div className="space-y-4 w-full">
            {/* WhatsApp Contact */}
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-3 w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-300 border border-green-200"
            >
              <FaWhatsapp className="text-green-500 text-2xl" />
              <div className="text-left">
                <p className="font-medium text-gray-700">WhatsApp</p>
                <p className="text-green-600">{whatsappNumber}</p>
                <p className="text-sm text-gray-500">Quick response via WhatsApp</p>
              </div>
            </button>

            {/* Phone Contact */}
            <button
              onClick={handlePhoneClick}
              className="flex items-center gap-3 w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-300 border border-blue-200"
            >
              <FaPhone className="text-blue-500 text-2xl" />
              <div className="text-left">
                <p className="font-medium text-gray-700">Phone</p>
                <p className="text-blue-600">{phoneNumber}</p>
                <p className="text-sm text-gray-500">Call us directly</p>
              </div>
            </button>

            {/* Email Contact */}
            <button
              onClick={handleEmailClick}
              className="flex items-center gap-3 w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-300 border border-purple-200"
            >
              <FaEnvelope className="text-purple-500 text-2xl" />
              <div className="text-left">
                <p className="font-medium text-gray-700">Email</p>
                <p className="text-purple-600">{email}</p>
                <p className="text-sm text-gray-500">Send us an email</p>
              </div>
            </button>
          </div>

          {/* Quick Appointment Request */}
          <div className="w-full mt-6">
            <p className="font-semibold text-lg text-gray-600 mb-3">
              QUICK APPOINTMENT REQUEST
            </p>
            <p className="text-gray-500 mb-4">
              Get instant response for appointment booking via WhatsApp.
            </p>
            <button
              onClick={handleWhatsAppClick}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
            >
              <FaWhatsapp className="text-xl" />
              Request Appointment Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;