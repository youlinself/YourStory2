import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import iconUrl from "./assets/icon.ico";

const favicon = document.getElementById("favicon-link") as HTMLLinkElement | null;
if (favicon) favicon.href = iconUrl;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
