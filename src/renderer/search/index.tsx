import React from "react";
import { createRoot } from "react-dom/client";
import SearchWindow from "./components/SearchWindow";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);
root.render(<SearchWindow />);
