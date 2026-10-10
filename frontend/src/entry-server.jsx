// Build-time rendering of the marketing pages to HTML (used by scripts/prerender.mjs),
// so search engines and link previews see the real content without running JavaScript.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App.jsx";

export { STRINGS, LANGUAGES } from "./i18n.jsx";
export { PRODUCT_NAME, PRODUCT_TAGLINE, SALES_EMAIL, SALES_PHONE } from "./config.js";

export const render = (url) =>
  renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>
  );
