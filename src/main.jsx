import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";
import "./styles.css";
import { theme } from "./theme";
import App from "./App";
import { IS_IOS } from "./films";

createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);

// Android: Chrome fires this when the app can be installed. Keep it so Settings can offer an Install button.
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window.__installPrompt = e; window.dispatchEvent(new Event("installable")); });
window.addEventListener("appinstalled", () => { window.__installPrompt = null; window.dispatchEvent(new Event("installable")); });
// iPhone: a home-screen app has its own storage and opens the manifest's start address, which would lose the invite code.
// Without a manifest, iOS saves the page's current address instead, and store.js keeps the invite code in that address.
if (IS_IOS) document.querySelector('link[rel="manifest"]')?.remove();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
