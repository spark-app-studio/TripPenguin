import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupStaleSessionDetection } from "./lib/cacheUtils";

// Setup automatic stale session detection
setupStaleSessionDetection();

createRoot(document.getElementById("root")!).render(<App />);
