import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { logError } from "./lib/errorLogger";

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
  logError(
    event.reason?.message || "Erro não tratado",
    "unhandledrejection",
    { stack: event.reason?.stack }
  );
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <App />
  </ThemeProvider>
);
