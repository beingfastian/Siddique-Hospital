import { createRoot } from "react-dom/client";
import axios from "axios";
import App from "./App.jsx";
import AdminContextProvider from "./context/AdminContext.jsx";
import DoctorContextProvider from "./context/DoctorContext.jsx";
import AppContextProvider from "./context/AppContext.jsx";
import LabContextProvider from "./context/LabContext.jsx";
import "./index.css";
import { DialogProvider } from "./components/ui/Dialog.jsx";

// When the backend rejects a logged-in request (expired or invalid token),
// clear the session and return to the login page.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const headers = error.config?.headers;
    const sentToken = headers?.get?.("atoken") || headers?.get?.("dtoken") || headers?.get?.("ltoken");
    if (error.response?.status === 401 && sentToken) {
      localStorage.removeItem("aToken");
      localStorage.removeItem("dToken");
      localStorage.removeItem("lToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")).render(
  <AdminContextProvider>
    <DoctorContextProvider>
      <LabContextProvider>
        <AppContextProvider>
          <DialogProvider>
            <App />
          </DialogProvider>
        </AppContextProvider>
      </LabContextProvider>
    </DoctorContextProvider>
  </AdminContextProvider>
);
