import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { join } from "path";
import {
  COMMON_WINDOW_SETTINGS,
  INITIAL_ON_TOP_LEVEL,
  INITIAL_ON_TOP_RELATIVE_LEVEL,
} from "./constants";
import { applyCreateWindowSettings, getActiveScreenBounds } from "./helpers";
import { WindowCreateSettings } from "./types";
import { WRITE_WINDOW_CONSTANTS } from "./createWriteWindow";

export const SEARCH_WINDOW_CONSTANTS = {
  WINDOW_WIDTH: 350,
  MIN_WINDOW_WIDTH: 350,
  MIN_WINDOW_HEIGHT: 120,
} as const;

const getSearchWindowInitConfig = (): BrowserWindowConstructorOptions => {
  const screenBounds = getActiveScreenBounds();
  const { WINDOW_WIDTH, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } =
    SEARCH_WINDOW_CONSTANTS;

  const writeWindowInitialX = Math.floor(
    screenBounds.x +
      (screenBounds.width - WRITE_WINDOW_CONSTANTS.WINDOW_WIDTH) / 2
  );

  return {
    x: writeWindowInitialX - WINDOW_WIDTH - 20,
    y: Math.floor(screenBounds.y + screenBounds.height * 0.15),
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    width: WINDOW_WIDTH,
    height: Math.floor(screenBounds.height * 0.7),
    maxHeight: Math.floor(screenBounds.height * 0.7),

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: false,
      preload: join(__dirname, "renderer/search-preload.bundle.js"),
    },
    ...COMMON_WINDOW_SETTINGS,
  };
};

export async function createSearchWindow(
  cb?: (createdWindow: BrowserWindow) => void,
  createSettings?: WindowCreateSettings
) {
  const prodOptions = getSearchWindowInitConfig();
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

  // Create the search window
  const searchWindow = new BrowserWindow(constructorOptions);

  searchWindow.setAlwaysOnTop(
    true,
    INITIAL_ON_TOP_LEVEL,
    INITIAL_ON_TOP_RELATIVE_LEVEL
  );
  searchWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  searchWindow.setFullScreenable(false);

  await searchWindow.loadFile(join(__dirname, "renderer/search-index.html"));

  if (cb) cb(searchWindow);
  return searchWindow;
}
