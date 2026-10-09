import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Doctors from "./pages/Doctors.jsx";
import Contact from "./pages/Contact.jsx";
import Navbar, { MobileActionBar } from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QueueBoard from "./pages/queue/QueueBoard.jsx";
import QueueTrack from "./pages/queue/QueueTrack.jsx";

// New page: start at the top (filter changes on the doctors page keep their place)
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const section = pathname.split("/")[1];
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);
  return null;
};

const App = () => {
  const location = useLocation();

  // Queue screens (waiting-room TV, a patient's token link): full screen,
  // without the site header and footer
  if (location.pathname === "/queue" || location.pathname.startsWith("/queue/")) {
    // These screens are bilingual already (Urdu lines carry their own dir/lang),
    // so they keep their layout whatever language the site is set to
    return (
      <div dir="ltr" lang="en" className="font-sans leading-normal">
        <Routes>
          <Route path="/queue" element={<QueueBoard />} />
          <Route path="/queue/t/:publicId" element={<QueueTrack />} />
          <Route path="*" element={<QueueBoard />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <ScrollToTop />
      <ToastContainer />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:speciality" element={<Doctors />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
      <MobileActionBar />
    </div>
  );
};

export default App;
