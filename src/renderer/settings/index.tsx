import React from "react";
import { createRoot } from "react-dom/client";
import SettingsWindow from "./components/SettingsWindow";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);
root.render(<SettingsWindow />);
