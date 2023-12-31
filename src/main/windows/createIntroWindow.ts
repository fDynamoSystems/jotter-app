import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { join } from "path";
import {
  COMMON_WINDOW_SETTINGS,
  INITIAL_ON_TOP_LEVEL,
  INITIAL_ON_TOP_RELATIVE_LEVEL,
} from "./constants";
import { applyCreateWindowSettings, getActiveScreenBounds } from "./helpers";
import { WindowCreateSettings } from "./types";

const WINDOW_WIDTH = 460;
const WINDOW_HEIGHT = 150;
const getIntroWindowInitConfig = (): BrowserWindowConstructorOptions => {
  const screenBounds = getActiveScreenBounds();

  return {
    x: Math.floor(screenBounds.x + (screenBounds.width - WINDOW_WIDTH) / 2),
    y: Math.floor(screenBounds.y + screenBounds.height * 0.15),
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: false,
      preload: join(__dirname, "renderer/intro-preload.bundle.js"),
    },
    ...COMMON_WINDOW_SETTINGS,
  };
};

export async function createIntroWindow(
  cb?: (createdWindow: BrowserWindow) => void,
  createSettings?: WindowCreateSettings
) {
  const prodOptions = getIntroWindowInitConfig();
  const devOptions: BrowserWindowConstructorOptions = {
    ...prodOptions,
    webPreferences: {
      ...prodOptions.webPreferences,
      devTools: true,
    },
  };

  let constructorOptions =
    process.env.NODE_ENV !== "production" ? devOptions : prodOptions;

  if (createSettings)
    constructorOptions = applyCreateWindowSettings(
      createSettings,
      constructorOptions
    );

  // Create the intro window
  const introWindow = new BrowserWindow(constructorOptions);

  introWindow.setAlwaysOnTop(
    true,
    INITIAL_ON_TOP_LEVEL,
    INITIAL_ON_TOP_RELATIVE_LEVEL
  );
  introWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  introWindow.setFullScreenable(false);

  await introWindow.loadFile(join(__dirname, "renderer/intro-index.html"));

  if (cb) cb(introWindow);
  return introWindow;
}
