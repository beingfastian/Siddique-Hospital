import React, { useState } from "react";
import { assets } from "../assets/assets.js";
import { Link, NavLink } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { HOSPITAL_PHONE } from "../config";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/doctors", label: "Our Doctors" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const whatsappMessage = "Hello! I would like to request an appointment. Please provide me with available times.";
const whatsappUrl = `https://wa.me/${HOSPITAL_PHONE.replace("+", "")}?text=${encodeURIComponent(whatsappMessage)}`;

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 mb-5">
      <nav className="flex items-center justify-between h-16">
        <Link to="/" aria-label="Siddique Hospital home" className="flex-shrink-0">
          <img src={assets.logo} alt="Siddique Hospital" className="h-9 sm:h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition-colors ${
                    isActive ? "text-primary bg-primary/10" : "text-gray-700 hover:text-primary hover:bg-gray-50"
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            <FaWhatsapp className="text-base" />
            Request Appointment
          </a>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setShowMenu(true)}
            className="md:hidden p-2 -mr-2 rounded-md hover:bg-gray-100"
            aria-label="Open menu"
            aria-expanded={showMenu}
          >
            <img src={assets.menu_icon} className="w-6" alt="" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <img className="h-9 w-auto" src={assets.logo} alt="Siddique Hospital" />
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Close menu"
            >
              <img className="w-6" src={assets.cross_icon} alt="" />
            </button>
          </div>
          <ul className="flex flex-col gap-1 p-4 text-base font-medium">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setShowMenu(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-colors ${
                      isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowMenu(false)}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <FaWhatsapp />
                Request Appointment
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
