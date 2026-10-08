import React, { useState, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Doctors from "./pages/Doctors.jsx";
import Contact from "./pages/Contact.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import WelcomeScreen from "./components/WelcomeScreen.jsx";
import QueueBoard from "./pages/queue/QueueBoard.jsx";
import QueueTrack from "./pages/queue/QueueTrack.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    // Check if user has already seen the welcome screen in this session
    const visited = sessionStorage.getItem('hasVisitedWelcome');
    if (visited) {
      setShowWelcome(false);
      setHasVisited(true);
    }
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    setHasVisited(true);
    // Remember that user has seen welcome screen for this session
    sessionStorage.setItem('hasVisitedWelcome', 'true');
  };

  // Queue screens (waiting-room TV, a patient's token link): full screen,
  // without the welcome animation, site header or footer
  if (location.pathname === "/queue" || location.pathname.startsWith("/queue/")) {
    return (
      <Routes>
        <Route path="/queue" element={<QueueBoard />} />
        <Route path="/queue/t/:publicId" element={<QueueTrack />} />
        <Route path="*" element={<QueueBoard />} />
      </Routes>
    );
  }

  // Show welcome screen on first visit
  if (showWelcome && !hasVisited) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  // Show main application
  return (
    <div className="mx-4 sm:mx-[10%]">
      <ToastContainer />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:speciality" element={<Doctors />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;