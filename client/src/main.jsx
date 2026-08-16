import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import App from "./App.jsx";
import { ThemeProvider } from "./components/theme-provider.jsx";

// When the client is deployed separately from the backend (e.g. frontend on
// Vercel, backend on Render), every relative "/api/..." call needs a real
// origin to hit instead of resolving against Vercel's own domain. Leaving
// VITE_API_URL unset keeps everything relative, which is correct when the
// backend serves the built frontend itself (the current Render setup).
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);