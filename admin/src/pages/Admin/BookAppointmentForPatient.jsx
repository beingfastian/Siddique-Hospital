import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext.jsx";
import { AppContext } from "../../context/AppContext.jsx";
import { toast } from "react-toastify";
import { FaWhatsapp, FaEnvelope, FaUser, FaCalendarAlt, FaSpinner, FaPlus, FaSearch, FaClock, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";

const BookAppointmentForPatient = () => {
  const { aToken, doctors, getAllDoctors, backendUrl, patients, getAllPatients } = useContext(AdminContext);
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);
  
  // Patient selection state
  const [patientSelectionMode, setPatientSelectionMode] = useState("existing");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  // New patient form state
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    email: "",
    phone: "",
    cnic: "",
    dob: "",
    gender: "Male",
    address: { line1: "", line2: "" },
    whatsappEnabled: false,
    whatsappNumber: ""
  });
  // Appointment booking state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [step, setStep] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
      getAllPatients();
    }
  }, [aToken]);

  useEffect(() => {
    if (patientSearchTerm) {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        (patient.email || "").toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        (patient.phone || "").toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        (patient.cnic && patient.cnic.includes(patientSearchTerm))
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patients, patientSearchTerm]);

  const getAvailableSlots = (doctor, month, year) => {
    setSlotsLoading(true);
    setDocSlots([]);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const today = new Date();
    
    // Never offer days before today
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let currentDate = startDate < startOfToday ? startOfToday : startDate;
    const slots = [];
    
    for (let date = new Date(currentDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const dayName = daysOfWeek[dayOfWeek];
      
      if (doctor.sittingDays && !doctor.sittingDays.includes(dayName)) {
        continue;
      }
      
      let startTime = new Date(date);
      let endTime = new Date(date);
      
      if (doctor.timings) {
        const [startHour, startMin] = doctor.timings.start.split(':');
        const [endHour, endMin] = doctor.timings.end.split(':');
        startTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
        endTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
      } else {
        startTime.setHours(10, 0, 0, 0);
        endTime.setHours(21, 0, 0, 0);
      }
      
      if (date.toDateString() === today.toDateString() && today.getHours() >= startTime.getHours()) {
        startTime.setHours(today.getHours() + 1, today.getMinutes() > 30 ? 30 : 0, 0, 0);
      }
      
      let timeSlots = [];
      let tempTime = new Date(startTime);
      
      while (tempTime < endTime) {
        let formattedTime = tempTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        
        const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
        const isSlotAvailable = 
          doctor.slots_booked[slotDate] && 
          doctor.slots_booked[slotDate].includes(formattedTime) ? false : true;
          
        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(tempTime),
            time: formattedTime,
          });
        }
        tempTime.setMinutes(tempTime.getMinutes() + 30);
      }
      
      if (timeSlots.length > 0) {
        slots.push(timeSlots);
      }
    }
    
    setDocSlots(slots);
    setSlotsLoading(false);
  };

  const validateCNIC = (cnic) => {
    const cleanCNIC = cnic.replace(/[-\s]/g, '');
    return /^\d{13}$/.test(cleanCNIC);
  };

  const handleNewPatientDataChange = (field, value) => {
    if (field === 'cnic') {
      const cleanValue = value.replace(/[-\s]/g, '').replace(/\D/g, '');
      if (cleanValue.length <= 13) {
        setNewPatientData(prev => ({ ...prev, [field]: cleanValue }));
      }
      return;
    }
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewPatientData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setNewPatientData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validatePatientSelection = () => {
    if (patientSelectionMode === "existing") {
      if (!selectedPatient) {
        toast.error("Please select a patient");
        return false;
      }
    } else {
      const { name, email, phone, cnic, dob, address } = newPatientData;
      if (!name || !email || !phone || !cnic || !dob || !address.line1) {
        toast.error("Please fill all required patient fields");
        return false;
      }
      
      if (!validateCNIC(cnic)) {
        toast.error("CNIC must be exactly 13 digits without dashes");
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
      
      if (newPatientData.whatsappEnabled && !newPatientData.whatsappNumber) {
        toast.error("Please enter WhatsApp number when WhatsApp is enabled");
        return false;
      }
    }
    return true;
  };

  const handleDoctorSelection = (doctor) => {
    setSelectedDoctor(doctor);
    getAvailableSlots(doctor, selectedMonth, selectedYear);
    setStep(3);
    setSlotIndex(0);
    setSlotTime("");
  };

  const handleMonthChange = (monthIndex) => {
    setSelectedMonth(monthIndex);
    if (selectedDoctor) {
      getAvailableSlots(selectedDoctor, monthIndex, selectedYear);
    }
    setSlotIndex(0);
    setSlotTime("");
  };

  const calculateDiscountedFee = () => {
    if (!selectedDoctor || !discountPercent) return selectedDoctor?.fee || 0;
    const discount = (selectedDoctor.fee * discountPercent) / 100;
    return selectedDoctor.fee - discount;
  };

  const bookAppointment = async () => {
    try {
      if (!selectedDoctor || !slotTime) {
        toast.error("Please select a doctor and time slot");
        return;
      }
      
      setIsBooking(true);
      const date = docSlots[slotIndex][0].datetime;
      const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
      const finalFee = calculateDiscountedFee();
      
      const bookingData = {
        patientSelectionMode,
        selectedPatientId: selectedPatient?._id || null,
        newPatientData: patientSelectionMode === "new" ? newPatientData : null,
        docId: selectedDoctor._id,
        slotDate,
        slotTime,
        discountPercent: discountPercent || 0,
        finalFee: finalFee
      };
      
      const { data } = await axios.post(
        backendUrl + "/api/admin/book-appointment-for-patient",
        bookingData,
        { headers: { aToken } }
      );
      
      if (data.success) {
        toast.success(data.message);
        
        const patientData = selectedPatient || newPatientData;
        if (patientData.whatsappEnabled) {
          toast.info("WhatsApp confirmation will be sent to patient!");
        } else {
          toast.info("Email confirmation will be sent to patient!");
        }
        
        // Reset form
        setSelectedPatient(null);
        setNewPatientData({
          name: "", email: "", phone: "", cnic: "", dob: "", gender: "Male",
          address: { line1: "", line2: "" }, whatsappEnabled: false, whatsappNumber: ""
        });
        setSelectedDoctor(null);
        setStep(1);
        setSlotTime("");
        setDiscountPercent(0);
        setPatientSelectionMode("existing");
        getAllDoctors();
        getAllPatients();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setNewPatientData({
      name: "", email: "", phone: "", cnic: "", dob: "", gender: "Male",
      address: { line1: "", line2: "" }, whatsappEnabled: false, whatsappNumber: ""
    });
    setSelectedDoctor(null);
    setStep(1);
    setSlotTime("");
    setDiscountPercent(0);
    setPatientSelectionMode("existing");
  };

  const getSelectedPatientData = () => {
    return patientSelectionMode === "existing" ? selectedPatient : newPatientData;
  };

  return (
    <div className="w-full p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-blue-600">Book Appointment for Patient</h1>
            <p className="text-gray-600 mt-1">Schedule appointments for patients with available doctors</p>
          </div>
          {step > 1 && (
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-8">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'} transition-all`}>
                <FaUser />
              </div>
              <span className="ml-3 font-medium">Select Patient</span>
            </div>
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'} transition-all`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'} transition-all`}>
                <FaUser />
              </div>
              <span className="ml-3 font-medium">Select Doctor</span>
            </div>
            <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'} transition-all`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'} transition-all`}>
                <FaCalendarAlt />
              </div>
              <span className="ml-3 font-medium">Select Time</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Step 1: Patient Selection */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">1. Select Patient</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setPatientSelectionMode("existing")}
              className={`px-6 py-3 rounded-xl border transition-all ${
                patientSelectionMode === "existing" 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "border-gray-300 hover:border-gray-400 text-gray-700"
              }`}
            >
              Select Existing Patient
            </button>
            <button
              onClick={() => setPatientSelectionMode("new")}
              className={`px-6 py-3 rounded-xl border transition-all flex items-center gap-2 ${
                patientSelectionMode === "new" 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "border-gray-300 hover:border-gray-400 text-gray-700"
              }`}
            >
              <FaPlus className="text-sm" /> Add New Patient
            </button>
          </div>
          
          {patientSelectionMode === "existing" && (
            <div>
              <div className="relative mb-4">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients by name, email, phone, or CNIC..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient._id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedPatient?._id === patient._id 
                        ? "border-blue-600 bg-blue-50 shadow-md" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={patient.image}
                        alt={patient.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                        <p className="text-sm text-gray-500">{patient.phone}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {calculateAge(patient.dob)} years, {patient.gender}
                          </span>
                          {patient.whatsappEnabled && (
                            <FaWhatsapp className="text-green-500 text-sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredPatients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {patientSearchTerm ? "No patients found matching your search." : "No patients available."}
                </div>
              )}
            </div>
          )}
          
          {patientSelectionMode === "new" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={newPatientData.name}
                  onChange={(e) => handleNewPatientDataChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newPatientData.email}
                  onChange={(e) => handleNewPatientDataChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={newPatientData.phone}
                  onChange={(e) => handleNewPatientDataChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNIC (13 digits) *</label>
                <input
                  type="text"
                  value={newPatientData.cnic}
                  onChange={(e) => handleNewPatientDataChange('cnic', e.target.value)}
                  placeholder="1234567890123"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  maxLength="13"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter 13 digits without dashes ({newPatientData.cnic.length}/13)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={newPatientData.dob}
                  onChange={(e) => handleNewPatientDataChange('dob', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={newPatientData.gender}
                  onChange={(e) => handleNewPatientDataChange('gender', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                <input
                  type="text"
                  value={newPatientData.address.line1}
                  onChange={(e) => handleNewPatientDataChange('address.line1', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                <input
                  type="text"
                  value={newPatientData.address.line2}
                  onChange={(e) => handleNewPatientDataChange('address.line2', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              {/* WhatsApp Settings for New Patient */}
              <div className="md:col-span-2 mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FaWhatsapp className="text-green-500 text-xl" />
                    <div>
                      <p className="font-medium text-gray-700">WhatsApp Notifications</p>
                      <p className="text-sm text-gray-500">Send appointment confirmations via WhatsApp</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPatientData.whatsappEnabled}
                      onChange={(e) => handleNewPatientDataChange('whatsappEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                
                {newPatientData.whatsappEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={newPatientData.whatsappNumber}
                      onChange={(e) => handleNewPatientDataChange('whatsappNumber', e.target.value)}
                      placeholder="e.g., +923001234567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md outline-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +92 for Pakistan)</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <button
              onClick={() => {
                if (validatePatientSelection()) {
                  setStep(2);
                }
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Select Doctor
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2: Doctor Selection */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">2. Select Doctor</h2>
          
          {getSelectedPatientData() && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Selected Patient: {getSelectedPatientData().name}</h4>
              <div className="text-sm text-blue-700 grid grid-cols-2 gap-2">
                <span>Email: {getSelectedPatientData().email}</span>
                <span>Phone: {getSelectedPatientData().phone}</span>
                <span>Age: {calculateAge(getSelectedPatientData().dob)} years</span>
                <span className="flex items-center gap-1">
                  {getSelectedPatientData().whatsappEnabled ? (
                    <>
                      <FaWhatsapp className="text-green-500" />
                      WhatsApp Enabled
                    </>
                  ) : (
                    <>
                      <FaEnvelope className="text-blue-500" />
                      Email Only
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.filter(doc => doc.available).map((doctor) => (
              <div
                key={doctor._id}
                onClick={() => handleDoctorSelection(doctor)}
                className="border border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-300"
              >
                <img
                  className="w-full h-48 object-cover rounded-xl bg-gray-50 mb-4"
                  src={doctor.image}
                  alt={doctor.name}
                />
                <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Available</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{doctor.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{doctor.speciality}</p>
                <p className="text-sm text-blue-600 font-semibold">Rs. {doctor.fee}</p>
                {doctor.timings && (
                  <p className="text-xs text-gray-500 mt-2">
                    {doctor.timings.start} - {doctor.timings.end}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Time Slot Selection */}
      {step === 3 && selectedDoctor && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">3. Select Appointment Time</h2>
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
          
          {/* Selected Doctor Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
            <img
              className="w-16 h-16 rounded-xl object-cover border-2 border-blue-600"
              src={selectedDoctor.image}
              alt={selectedDoctor.name}
            />
            <div>
              <h3 className="font-semibold text-gray-900">{selectedDoctor.name}</h3>
              <p className="text-sm text-gray-600">{selectedDoctor.speciality}</p>
              <p className="text-sm text-blue-600 font-semibold">Fee: Rs. {selectedDoctor.fee}</p>
            </div>
          </div>
          
          {/* Patient Summary */}
          <div className="p-4 bg-blue-50 rounded-xl mb-6 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Patient: {getSelectedPatientData().name}</h4>
            <div className="text-sm text-blue-700 grid grid-cols-2 gap-2">
              <span>Age: {calculateAge(getSelectedPatientData().dob)} years</span>
              <span>Gender: {getSelectedPatientData().gender}</span>
              <span>Phone: {getSelectedPatientData().phone}</span>
              <span className="flex items-center gap-1">
                {getSelectedPatientData().whatsappEnabled ? (
                  <>
                    <FaWhatsapp className="text-green-500" />
                    WhatsApp Enabled
                  </>
                ) : (
                  <>
                    <FaEnvelope className="text-blue-500" />
                    Email Only
                  </>
                )}
              </span>
            </div>
          </div>
          
          {/* Month Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Select Month</h4>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => {
                  const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
                  const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
                  setSelectedYear(newYear);
                  handleMonthChange(newMonth);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaChevronLeft />
              </button>
              
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 flex-1">
                {months.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => handleMonthChange(index)}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                      selectedMonth === index
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
                  const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
                  setSelectedYear(newYear);
                  handleMonthChange(newMonth);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaChevronRight />
              </button>
            </div>
            <p className="text-center text-gray-600 font-semibold">{months[selectedMonth]} {selectedYear}</p>
          </div>
          
          {/* Date Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Select Date</h4>
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-blue-600">
                <FaSpinner className="animate-spin" /> Loading available dates...
              </div>
            ) : docSlots.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {docSlots.map((item, index) => (
                  <button
                    key={index}
                    className={`flex flex-col items-center justify-center min-w-[90px] px-6 py-5 rounded-xl border-2 transition-all duration-200 shadow-md
                      ${slotIndex === index
                        ? "bg-blue-600 text-white border-blue-600 scale-105 font-bold"
                        : "bg-white text-gray-800 border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                      }`}
                    onClick={() => {
                      setSlotIndex(index);
                      setSlotTime("");
                    }}
                  >
                    {item.length > 0 && (
                      <>
                        <span className="uppercase text-sm font-semibold tracking-wide mb-2">
                          {daysOfWeek[item[0].datetime.getDay()]}
                        </span>
                        <span className="text-3xl font-extrabold leading-none mb-1">
                          {item[0].datetime.getDate()}
                        </span>
                        <span className="text-sm font-medium">
                          {item[0].datetime.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-red-500 py-4">No available dates for this doctor.</div>
            )}
          </div>
          
          {/* Time Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Select Time</h4>
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-blue-600">
                <FaSpinner className="animate-spin" /> Loading time slots...
              </div>
            ) : docSlots.length > 0 && docSlots[slotIndex]?.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {docSlots[slotIndex].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSlotTime(item.time)}
                    className={`px-4 py-2 rounded-lg border transition-all shadow-sm ${
                      item.time === slotTime
                        ? "bg-blue-600 text-white border-blue-600 scale-105"
                        : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    {item.time.toLowerCase()}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-red-500 py-4">No available time slots for this date.</div>
            )}
          </div>
          
          {/* Discount Section */}
          <div className="p-4 bg-yellow-50 rounded-xl mb-6 border border-yellow-200">
            <h4 className="font-medium text-gray-900 mb-3">Apply Discount (Optional)</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-primary"
                  placeholder="Enter discount %"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Fee
                </label>
                <div className="px-3 py-2 bg-white border border-gray-300 rounded-md">
                  <span className="text-lg font-medium text-green-600">
                    Rs. {calculateDiscountedFee()}
                  </span>
                  {discountPercent > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Rs. {(selectedDoctor.fee * discountPercent / 100).toFixed(0)} off)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Booking Summary & Confirm Button */}
          {slotTime && (
            <div className="border-t pt-6">
              <div className="bg-yellow-50 p-4 rounded-xl mb-4 border border-yellow-200">
                <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Patient:</strong> {getSelectedPatientData().name}</p>
                  <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
                  <p><strong>Date & Time:</strong> {docSlots[slotIndex][0] && slotDateFormat(
                    `${docSlots[slotIndex][0].datetime.getDate()}_${docSlots[slotIndex][0].datetime.getMonth() + 1}_${docSlots[slotIndex][0].datetime.getFullYear()}`
                  )} at {slotTime}</p>
                  <p><strong>Original Fee:</strong> Rs. {selectedDoctor.fee}</p>
                  {discountPercent > 0 && (
                    <p><strong>Discount:</strong> {discountPercent}% (Rs. {(selectedDoctor.fee * discountPercent / 100).toFixed(0)})</p>
                  )}
                  <p><strong>Final Fee:</strong> Rs. {calculateDiscountedFee()}</p>
                  <p className="flex items-center gap-1">
                    <strong>Notification:</strong>
                    {getSelectedPatientData().whatsappEnabled ? (
                      <>
                        <FaWhatsapp className="text-green-500" />
                        WhatsApp & Email
                      </>
                    ) : (
                      <>
                        <FaEnvelope className="text-blue-500" />
                        Email Only
                      </>
                    )}
                  </p>
                  {patientSelectionMode === "new" && (
                    <p className="text-blue-600"><strong>Note:</strong> New patient account will be created</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={bookAppointment}
                disabled={isBooking}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg"
              >
                {isBooking ? (
                  <>
                    <FaSpinner className="w-5 h-5 animate-spin" />
                    Booking Appointment...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookAppointmentForPatient;