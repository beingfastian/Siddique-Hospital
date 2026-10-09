import React from "react";
import { assets } from "../assets/assets";
import { FaWhatsapp, FaPhone, FaEnvelope } from "react-icons/fa";
import { HOSPITAL_EMAIL, HOSPITAL_NAME, HOSPITAL_PHONE, PRODUCT_NAME, PRODUCT_TAGLINE } from "../config";

const Footer = () => {
  // Contact details
  const whatsappNumber = HOSPITAL_PHONE;
  const phoneNumber = HOSPITAL_PHONE;
  const email = HOSPITAL_EMAIL;
  
  const handleWhatsAppClick = () => {
    const message = "Hello! I would like to get more information about your medical services.";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="md:mx-10">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        {/* Left Section */}
        <div>
          <img src={assets.logo} alt={HOSPITAL_NAME} className="mb-5 w-44" />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            {HOSPITAL_NAME} provides comprehensive healthcare services with a team of
            experienced doctors and modern medical facilities. Contact us via WhatsApp 
            for quick appointment booking and medical consultations.
          </p>
          
          {/* Quick Contact Actions */}
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 w-fit"
            >
              <FaWhatsapp className="text-lg" />
              <span>Quick WhatsApp Contact</span>
            </button>
          </div>
        </div>
        
        {/* Center Section */}
        <div>
          <p className="text-xl font-medium mb-5">QUICK LINKS</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li className="hover:text-primary cursor-pointer" onClick={() => window.location.href = '/'}>
              Home
            </li>
            <li className="hover:text-primary cursor-pointer" onClick={() => window.location.href = '/doctors'}>
              Our Doctors
            </li>
            <li className="hover:text-primary cursor-pointer" onClick={() => window.location.href = '/about'}>
              About us
            </li>
            <li className="hover:text-primary cursor-pointer" onClick={() => window.location.href = '/contact'}>
              Contact us
            </li>
          </ul>
        </div>
        
        {/* Right Section */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-3 text-gray-600">
            {/* WhatsApp Contact */}
            <li className="flex items-center gap-2 hover:text-green-500 cursor-pointer" onClick={handleWhatsAppClick}>
              <FaWhatsapp className="text-green-500" />
              <span>{whatsappNumber}</span>
            </li>
            
            {/* Phone Contact */}
            <li className="flex items-center gap-2 hover:text-primary-600 cursor-pointer" onClick={() => window.open(`tel:${phoneNumber}`)}>
              <FaPhone className="text-primary-600" />
              <span>{phoneNumber}</span>
            </li>
            
            {/* Email Contact */}
            <li className="flex items-center gap-2 hover:text-purple-500 cursor-pointer" onClick={() => window.open(`mailto:${email}`)}>
              <FaEnvelope className="text-purple-500" />
              <span>{email}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div>
        {/* Copyright Text */}
        <hr />
        <div className="py-5 text-sm text-center text-gray-600 space-y-1">
          <p>
            © {new Date().getFullYear()} {HOSPITAL_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-primary">{PRODUCT_NAME}</span> · {PRODUCT_TAGLINE}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Footer;