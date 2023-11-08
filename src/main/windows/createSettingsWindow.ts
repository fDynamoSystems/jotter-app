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

const WINDOW_WIDTH = 460;
const WINDOW_HEIGHT = 320;
const getSettingsWindowInitConfig = (): BrowserWindowConstructorOptions => {
  const screenBounds = getActiveScreenBounds();
  return {
    x: Math.floor(screenBounds.x + (screenBounds.width - WINDOW_WIDTH) - 20),
    y: Math.floor(screenBounds.y),
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    frame: false,
    resizable: false,
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
      preload: join(__dirname, "renderer/settings-preload.bundle.js"),
    },
    maximizable: false,
    minimizable: false,
  };
};

export async function createSettingsWindow(
  cb?: (createdWindow: BrowserWindow) => void
) {
  const prodOptions = getSettingsWindowInitConfig();
  const devOptions: BrowserWindowConstructorOptions = {
    ...prodOptions,
    webPreferences: {
      ...prodOptions.webPreferences,
      devTools: true,
    },
  };

  const constructorOptions =
    process.env.NODE_ENV !== "production" ? devOptions : prodOptions;

  // Create the settings window
  const settingsWindow = new BrowserWindow(constructorOptions);

  settingsWindow.setAlwaysOnTop(
    true,
    INITIAL_ON_TOP_LEVEL,
    INITIAL_ON_TOP_RELATIVE_LEVEL
  );
  settingsWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  settingsWindow.setFullScreenable(false);

  await settingsWindow.loadFile(
    join(__dirname, "renderer/settings-index.html")
  );

  if (cb) cb(settingsWindow);
  return settingsWindow;
}
