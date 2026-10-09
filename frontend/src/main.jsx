import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./i18n.jsx";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "./config";

document.title = `${PRODUCT_NAME} · ${PRODUCT_TAGLINE}`;

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </BrowserRouter>
);