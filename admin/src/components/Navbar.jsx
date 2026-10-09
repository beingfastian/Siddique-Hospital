import React, { useContext, useState, useEffect } from "react";
import Avatar from "./ui/Avatar";
import { assets } from "../assets/assets";
import { HOSPITAL_NAME, PRODUCT_NAME } from "../config";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import { LabContext } from "../context/LabContext";
import { useNotifications } from "../context/NotificationContext";

const Navbar = ({ onMenuClick }) => {
  const { aToken, setAToken } = useContext(AdminContext);
  const { dToken, setDToken, doctorData } = useContext(DoctorContext);
  const { lToken, setLToken, labName } = useContext(LabContext);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const logout = () => {
  // Clear tokens first
  if (aToken) {
    setAToken("");
    localStorage.removeItem("aToken");
  }
  if (dToken) {
    setDToken("");
    localStorage.removeItem("dToken");
  }
  if (lToken) {
    setLToken("");
    localStorage.removeItem("lToken");
  }

  setShowLogoutConfirm(false);

  // Navigate after clearing tokens
  setTimeout(() => {
    navigate("/");
  }, 100);
};

  const getNotificationIcon = (type) => {
    const iconProps = "w-5 h-5";
    switch(type) {
      case 'leave_request':
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
      case 'leave_approved':
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'leave_rejected':
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'new_appointment':
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      case 'appointment_completed':
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'new_patient':
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
      default:
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    }
  };

  const userType = aToken ? "Admin" : lToken && !dToken ? "Lab" : "Doctor";
  const userName = aToken
    ? "Administrator"
    : lToken && !dToken
      ? labName || "Lab staff"
      : doctorData ? doctorData.name : "Dr. User";

  return (
    <>
      {/* Main Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-white/20'
          : 'bg-white/60 backdrop-blur-sm border-b border-gray-100/50'
      }`}>
        <div className="px-3 sm:px-6">
          <div className="flex justify-between items-center h-16">

            {/* Left side - Menu button, Logo and Brand */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={onMenuClick}
                className="lg:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={assets.logo_mark}
                    alt={PRODUCT_NAME}
                    className="h-8 w-auto sm:h-10 cursor-pointer transition-transform duration-300 hover:scale-105"
                  />
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 to-primary-500/20 blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Brand text - hidden on mobile */}
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {PRODUCT_NAME}
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">{HOSPITAL_NAME}</p>
                </div>
              </div>
              {/* Role Badge */}
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                aToken
                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/50 shadow-sm shadow-emerald-100/50'
                  : 'bg-gradient-to-r from-primary-50 to-primary-50 text-primary-800 border border-primary-200/50 shadow-sm shadow-primary-100/50'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  aToken ? 'bg-emerald-400' : 'bg-primary-500'
                } animate-pulse`}></div>
                {userType}
              </div>
            </div>

            {/* Right side - User info and logout */}
            <div className="flex items-center space-x-4">

              {/* Notifications - Show for both Admin and Doctor */}
              {(aToken || dToken || lToken) && (
                <div className="relative notification-dropdown">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded-xl transition-all duration-200 hover:bg-gray-100/50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>

                    {/* Notification badge */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-white/50 z-50 max-h-96 overflow-hidden">

                      {/* Header */}
                      <div className="p-4 border-b border-gray-100/50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead(aToken ? 'admin' : 'doctor', dToken ? doctorData?._id : null)}
                              className="text-sm text-primary-700 hover:text-primary-800 font-medium transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications read'}
                        </p>
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                                !notification.read ? 'bg-primary-50/30' : ''
                              }`}
                              onClick={() => markAsRead(notification._id)}
                            >
                              <div className="flex items-start space-x-3">
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                  notification.priority === 'high' ? 'bg-red-100 text-red-600' :
                                  notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-primary-100 text-primary-700'
                                }`}>
                                  {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {notification.title}
                                    </p>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-gray-500">
                                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification._id);
                                      }}
                                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            </div>
                            <p className="text-gray-500 text-sm">No notifications yet</p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* User Info - hidden on mobile */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-700">{userName}</p>
                <p className="text-xs text-gray-500">Welcome back</p>
              </div>

              {/* User Avatar (photo for doctors, initials otherwise) */}
              <Avatar src={dToken ? doctorData?.image : undefined} name={userName} className="w-10 h-10" textClass="text-sm" />

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg ${
                  aToken
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-200 hover:shadow-red-300'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-200 hover:shadow-orange-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-white/50 p-6 w-full max-w-sm mx-auto transform transition-all duration-300">

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-gray-600 text-sm">Are you sure you want to sign out of your {userType.toLowerCase()} account?</p>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-red-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;