import React from "react";
import { createRoot } from "react-dom/client";
import IntroWindow from "./components/IntroWindow";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);
root.render(<IntroWindow />);
