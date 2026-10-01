import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { HOSPITAL_PHONE } from "../config";

const WelcomeScreen = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 500);
    const timer2 = setTimeout(() => setCurrentStep(2), 2000);
    const timer3 = setTimeout(() => setCurrentStep(3), 4000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => onComplete(), 500);
  };

  const handleContinue = () => {
    setIsVisible(false);
    setTimeout(() => onComplete(), 500);
  };

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-primary via-blue-600 to-blue-800 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors duration-300 z-10"
      >
        <span className="text-sm font-medium">Skip →</span>
      </button>

      {/* Progress Dots */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3].map((step) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              currentStep >= step ? 'bg-white' : 'bg-white bg-opacity-30'
            }`}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - CEO Image */}
          <div className="flex justify-center lg:justify-end">
            <div className={`relative transform transition-all duration-1000 ${currentStep >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="relative">
                <img
                  src={assets.ceo_image}
                  alt="Dr. Muhammad Siddique - CEO"
                  className="w-80 h-80 lg:w-96 lg:h-96 object-cover rounded-3xl shadow-2xl border-4 border-white border-opacity-20"
                />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-8 py-3 rounded-full shadow-xl">
                  <p className="text-primary font-bold text-lg">Chief Executive Officer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Welcome Content */}
          <div className="text-white space-y-6">
            
            {/* Hospital Logo/Name */}
            <div className={`transform transition-all duration-1000 delay-300 ${currentStep >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <img src={assets.logo} alt="Siddique Hospital" className="h-16 mb-4 brightness-0 invert" />
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">Welcome to</h1>
              <h2 className="text-3xl lg:text-4xl font-bold text-blue-200">Siddique Hospital</h2>
            </div>

            {/* CEO Introduction */}
            <div className={`transform transition-all duration-1000 delay-500 ${currentStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <h3 className="text-2xl font-bold mb-3">Dr. Muhammad Siddique</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">MBBS</span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">MCPS</span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">DCH</span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">Child Specialist</span>
                </div>
                <p className="text-lg leading-relaxed opacity-90">
                  "This hospital represents my lifelong dedication to medicine and my unwavering belief 
                  that every patient deserves the highest quality care, delivered with empathy and respect."
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className={`transform transition-all duration-1000 delay-700 ${currentStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="space-y-4">
                <p className="text-xl font-medium">
                  Experience healthcare excellence under visionary leadership
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleContinue}
                    className="bg-white text-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
                  >
                    Enter Siddique Hospital
                  </button>
                  
                  <button
                    onClick={() => {
                      const whatsappNumber = HOSPITAL_PHONE;
                      const message = "Hello! I would like to schedule an appointment at Siddique Hospital. Please provide me with available times.";
                      const encodedMessage = encodeURIComponent(message);
                      const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382"/>
                    </svg>
                    Quick WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-progress indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white text-center">
        <p className="text-sm opacity-75 mb-2">
          {currentStep < 3 ? 'Loading...' : 'Welcome Complete'}
        </p>
        {currentStep < 3 && (
          <div className="w-48 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-1000 ease-out"
              style={{ width: `${(currentStep + 1) * 25}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;