import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Wait for DOM to be ready and ensure Chrome APIs are available
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
});

// Also try immediate execution in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  const rootElement = document.getElementById("root");
  if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}
