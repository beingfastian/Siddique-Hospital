import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from "./context/AppContext.jsx";
import { LanguageProvider } from "./i18n.jsx";
import { HOSPITAL_NAME, PRODUCT_NAME } from "./config";

document.title = `${HOSPITAL_NAME} · Powered by ${PRODUCT_NAME}`;

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <LanguageProvider>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </LanguageProvider>
  </BrowserRouter>
);