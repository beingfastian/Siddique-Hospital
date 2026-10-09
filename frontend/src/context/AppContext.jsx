import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [doctors, setDoctors] = useState([]);
  // "loading" | "ready" | "error": pages show a retry instead of an empty list
  const [doctorsStatus, setDoctorsStatus] = useState("loading");
  const currencySymbol = "Rs."; // Changed to Pakistani Rupees
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const getDoctorsData = async () => {
  setDoctorsStatus((prev) => (prev === "ready" ? prev : "loading"));
  try {
    const { data } = await axios.get(backendUrl + "/api/doctor/list", { timeout: 20000 });
    if (data.success) {
      setDoctors(data.doctors);
      setDoctorsStatus("ready");
    } else {
      console.error("Backend error:", data.message);
      setDoctorsStatus("error");
    }
  } catch (error) {
    console.error("Error fetching doctors:", error);
    setDoctorsStatus("error");
  }
};

  // Function to get doctor's availability status with reason
const getDoctorAvailabilityStatus = (doctor) => {
  if (!doctor.available) {
    return { available: false, reason: "Currently unavailable" };
  }
  
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // Fixed line
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Check sitting days
  if (doctor.sittingDays && doctor.sittingDays.length > 0) {
    if (!doctor.sittingDays.includes(currentDay)) {
      const nextWorkingDay = getNextWorkingDay(doctor.sittingDays);
      return { 
        available: false, 
        reason: `Not available on ${currentDay}s`,
        nextAvailable: nextWorkingDay
      };
    }
  }
  
  // Check working hours
  if (doctor.timings) {
    const [startHour, startMin] = doctor.timings.start.split(':').map(Number);
    const [endHour, endMin] = doctor.timings.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (currentTime < startTime) {
      return { 
        available: false, 
        reason: `Available from ${doctor.timings.start}`,
        nextAvailable: `Today at ${doctor.timings.start}`
      };
    }
    
    if (currentTime > endTime) {
      return { 
        available: false, 
        reason: `Clinic closed at ${doctor.timings.end}`,
        nextAvailable: "Tomorrow"
      };
    }
  }
  
  return { available: true, reason: "Available now" };
};

  // Helper function to get next working day
  const getNextWorkingDay = (sittingDays) => {
    const daysMap = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const today = new Date().getDay();
    const workingDayNumbers = sittingDays.map(day => daysMap[day]).sort((a, b) => a - b);
    
    // Find next working day
    let nextDay = workingDayNumbers.find(day => day > today);
    if (!nextDay) {
      nextDay = workingDayNumbers[0]; // Next week
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[nextDay];
  };

  // Function to format working hours for display
  const formatWorkingHours = (doctor) => {
    if (!doctor.timings) return "Contact for timings";
    
    const formatTime = (time) => {
      const [hour, minute] = time.split(':');
      const hourNum = parseInt(hour);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
      return `${displayHour}:${minute} ${ampm}`;
    };
    
    return `${formatTime(doctor.timings.start)} - ${formatTime(doctor.timings.end)}`;
  };

  // Function to format sitting days for display
  const formatSittingDays = (doctor) => {
    if (!doctor.sittingDays || doctor.sittingDays.length === 0) {
      return "Contact for schedule";
    }
    
    const dayNames = {
      'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed',
      'thursday': 'Thu', 'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun'
    };
    
    return doctor.sittingDays.map(day => dayNames[day]).join(', ');
  };

  useEffect(() => {
    getDoctorsData();

    // Re-render every minute so time-based availability badges stay current
    const interval = setInterval(() => setDoctors((prev) => [...prev]), 60000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    doctors,
    doctorsStatus,
    reloadDoctors: getDoctorsData,
    backendUrl,
    currencySymbol,
    getDoctorAvailabilityStatus,
    formatWorkingHours,
    formatSittingDays
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;