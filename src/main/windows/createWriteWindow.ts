import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { join } from "path";
import {
  COMMON_WINDOW_SETTINGS,
  INITIAL_ON_TOP_LEVEL,
  INITIAL_ON_TOP_RELATIVE_LEVEL,
} from "./constants";
import { applyCreateWindowSettings, getActiveScreenBounds } from "./helpers";
import { WindowCreateSettings } from "./types";

export const WRITE_WINDOW_CONSTANTS = {
  WINDOW_WIDTH: 420,
  WINDOW_HEIGHT: 300,
  MIN_WINDOW_WIDTH: 420,
  MIN_WINDOW_HEIGHT: 300,
} as const;

const getWriteWindowInitConfig = (): BrowserWindowConstructorOptions => {
  const screenBounds = getActiveScreenBounds();
  const { WINDOW_WIDTH, WINDOW_HEIGHT, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } =
    WRITE_WINDOW_CONSTANTS;

  return {
    x: Math.floor(screenBounds.x + (screenBounds.width - WINDOW_WIDTH) / 2),
    y: Math.floor(screenBounds.y + screenBounds.height * 0.15),
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    maxHeight: Math.floor(0.8 * screenBounds.height),
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: false,
      preload: join(__dirname, "renderer/write-preload.bundle.js"),
    },
    ...COMMON_WINDOW_SETTINGS,
  };
};

export async function createWriteWindow(
  cb?: (createdWindow: BrowserWindow) => void,
  createSettings?: WindowCreateSettings
) {
  const prodOptions = getWriteWindowInitConfig();
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

  // Create the write window
  const writeWindow = new BrowserWindow(constructorOptions);

  writeWindow.setAlwaysOnTop(
    true,
    INITIAL_ON_TOP_LEVEL,
    INITIAL_ON_TOP_RELATIVE_LEVEL
  );
  writeWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  writeWindow.setFullScreenable(false); // Done to allow full screen

  await writeWindow.loadFile(join(__dirname, "renderer/write-index.html"));
  if (cb) cb(writeWindow);

  return writeWindow;
}

export function resetWriteWindow(writeWindow: BrowserWindow) {
  if (!writeWindow) return;
  const initConfig = getWriteWindowInitConfig();
  writeWindow.setSize(initConfig.width!, initConfig.height!, false);
  writeWindow.setPosition(initConfig.x!, initConfig.y!, false);
}
