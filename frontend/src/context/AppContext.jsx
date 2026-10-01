import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [doctors, setDoctors] = useState([]);
  const currencySymbol = "Rs."; // Changed to Pakistani Rupees
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // Helper function to check if doctor is currently available
const isDoctorAvailable = (doctor) => {
  if (!doctor.available) return false; // Basic availability flag
  
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // Fixed line
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
  
  // Check if doctor has sitting days defined
  if (doctor.sittingDays && doctor.sittingDays.length > 0) {
    if (!doctor.sittingDays.includes(currentDay)) {
      return false; // Doctor doesn't work today
    }
  }
  
  // Check if doctor has working hours defined
  if (doctor.timings) {
    const [startHour, startMin] = doctor.timings.start.split(':').map(Number);
    const [endHour, endMin] = doctor.timings.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (currentTime < startTime || currentTime > endTime) {
      return false; // Outside working hours
    }
  }
  
  // Check if doctor is on approved leave
  if (doctor.leaveRequests && doctor.leaveRequests.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isOnLeave = doctor.leaveRequests.some(leave => {
      if (leave.status !== 'approved') return false;
      
      const fromDate = new Date(leave.fromDate);
      const toDate = new Date(leave.toDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
      
      return today >= fromDate && today <= toDate;
    });
    
    if (isOnLeave) {
      return false; // Doctor is on leave
    }
  }
  
  return true; // Doctor is available
};
const getDoctorsData = async () => {
  try {
    const { data } = await axios.get(backendUrl + "/api/doctor/list");
    
    if (data.success) {
      // Process doctors to add real-time availability status
      const processedDoctors = data.doctors.map(doctor => {
        try {
          return {
            ...doctor,
            isCurrentlyAvailable: isDoctorAvailable(doctor)
          };
        } catch (error) {
          console.error("Error processing doctor", doctor.name, ":", error);
          return {
            ...doctor,
            isCurrentlyAvailable: false
          };
        }
      });
      setDoctors(processedDoctors);
    } else {
      console.error("Backend error:", data.message);
      toast.error(data.message);
    }
  } catch (error) {
    console.error("Error fetching doctors:", error);
    toast.error("Failed to load doctors");
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
  
  // Check leave status
  if (doctor.leaveRequests && doctor.leaveRequests.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentLeave = doctor.leaveRequests.find(leave => {
      if (leave.status !== 'approved') return false;
      
      const fromDate = new Date(leave.fromDate);
      const toDate = new Date(leave.toDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
      
      return today >= fromDate && today <= toDate;
    });
    
    if (currentLeave) {
      const returnDate = new Date(currentLeave.toDate);
      returnDate.setDate(returnDate.getDate() + 1);
      return { 
        available: false, 
        reason: "On leave",
        nextAvailable: returnDate.toLocaleDateString()
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
    
    // Update availability status every minute
    const interval = setInterval(() => {
      setDoctors(prevDoctors => 
        prevDoctors.map(doctor => ({
          ...doctor,
          isCurrentlyAvailable: isDoctorAvailable(doctor)
        }))
      );
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    backendUrl,
    isDoctorAvailable,
    getDoctorAvailabilityStatus,
    formatWorkingHours,
    formatSittingDays
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;