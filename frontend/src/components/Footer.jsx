import React from "react";
import { assets } from "../assets/assets";
import { FaFacebook, FaInstagram, FaWhatsapp, FaPhone, FaEnvelope } from "react-icons/fa";
import { HOSPITAL_PHONE } from "../config";

const Footer = () => {
  // Contact details
  const whatsappNumber = HOSPITAL_PHONE;
  const phoneNumber = HOSPITAL_PHONE;
  const email = "Siddiquehospital@gmail.com";
  
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
          <img src={assets.logo} alt="" className="mb-5 w-40" />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            Siddique Hospital provides comprehensive healthcare services with a team of 
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
            <li className="flex items-center gap-2 hover:text-blue-500 cursor-pointer" onClick={() => window.open(`tel:${phoneNumber}`)}>
              <FaPhone className="text-blue-500" />
              <span>{phoneNumber}</span>
            </li>
            
            {/* Email Contact */}
            <li className="flex items-center gap-2 hover:text-purple-500 cursor-pointer" onClick={() => window.open(`mailto:${email}`)}>
              <FaEnvelope className="text-purple-500" />
              <span>{email}</span>
            </li>
            
            {/* Social Media */}
            <li className="flex gap-4 mt-3">
              <a
                href="https://www.facebook.com/share/1LVbk5wJp1/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl hover:text-blue-600 transition-colors"
              >
                <FaFacebook />
              </a>
              <a
                href="https://www.instagram.com/siddique.hospital?igsh=b2I4MTRqYnVnMDdi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl hover:text-pink-600 transition-colors"
              >
                <FaInstagram />
              </a>
              <button
                onClick={handleWhatsAppClick}
                className="text-2xl hover:text-green-600 transition-colors"
              >
                <FaWhatsapp />
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      <div>
        {/* Copyright Text */}
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright 2025@Siddique Hospital - All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;