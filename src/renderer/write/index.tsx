import React from "react";
import { createRoot } from "react-dom/client";
import WriteWindow from "./components/WriteWindow";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);
root.render(<WriteWindow />);
