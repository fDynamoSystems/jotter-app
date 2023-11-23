import { BG_COLOR_DARK, BG_COLOR_LIGHT } from "@src/common/constants";
import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  nativeTheme,
} from "electron";
import { join } from "path";
import {
  INITIAL_ON_TOP_LEVEL,
  INITIAL_ON_TOP_RELATIVE_LEVEL,
} from "./constants";
import { getActiveScreenBounds } from "./helpers";

const WINDOW_WIDTH = 350;
const WINDOW_HEIGHT = 120;
const getSearchWindowInitConfig = (): BrowserWindowConstructorOptions => {
  const screenBounds = getActiveScreenBounds();
  return {
    x: Math.floor(screenBounds.x + 20),
    y: Math.floor(screenBounds.y + screenBounds.height * 0.15),
    minWidth: WINDOW_WIDTH,
    minHeight: WINDOW_HEIGHT,
    width: WINDOW_WIDTH,
    height: Math.floor(screenBounds.height * 0.7),
    maxHeight: Math.floor(screenBounds.height * 0.7),
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    transparent: false,
    movable: true,
    show: false,
    skipTaskbar: false,
    focusable: true,
    closable: true,
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? BG_COLOR_DARK
      : BG_COLOR_LIGHT,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: false,
      preload: join(__dirname, "renderer/search-preload.bundle.js"),
    },
    maximizable: false,
    minimizable: false,
  };
};

export async function createSearchWindow(
  cb?: (createdWindow: BrowserWindow) => void
) {
  const prodOptions = getSearchWindowInitConfig();
  const devOptions: BrowserWindowConstructorOptions = {
    ...prodOptions,
    webPreferences: {
      ...prodOptions.webPreferences,
      devTools: true,
    },
  };

  const constructorOptions =
    process.env.NODE_ENV !== "production" ? devOptions : prodOptions;

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
