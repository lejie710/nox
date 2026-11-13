// The entry point: the fonts, the stylesheets, and the app mounted on the page.
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/500.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/nox.css";
import "./styles/chapter.css";
import "./styles/story.css";
import "./styles/devicePower.css";
import "./styles/cpuPower.css";
import "./styles/sleepWake.css";
import "./styles/underHood.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
