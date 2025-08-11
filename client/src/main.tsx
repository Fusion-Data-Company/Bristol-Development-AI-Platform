// Initialize error suppression BEFORE any other imports
import "./utils/mapbox-error-suppression";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
