import { createRoot } from "react-dom/client";
import axios from "axios";
import App from "./App.jsx";
import AdminContextProvider from "./context/AdminContext.jsx";
import DoctorContextProvider from "./context/DoctorContext.jsx";
import AppContextProvider from "./context/AppContext.jsx";
import "./index.css";

// When the backend rejects a logged-in request (expired or invalid token),
// clear the session and return to the login page.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const headers = error.config?.headers;
    const sentToken = headers?.get?.("atoken") || headers?.get?.("dtoken");
    if (error.response?.status === 401 && sentToken) {
      localStorage.removeItem("aToken");
      localStorage.removeItem("dToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")).render(
  <AdminContextProvider>
    <DoctorContextProvider>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </DoctorContextProvider>
  </AdminContextProvider>
);
