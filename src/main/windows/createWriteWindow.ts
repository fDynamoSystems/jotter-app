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

const MIN_WINDOW_WIDTH = 420;
const MIN_WINDOW_HEIGHT = 280;
const getWriteWindowInitConfig = (): BrowserWindowConstructorOptions => {
  const screenBounds = getActiveScreenBounds();

  return {
    x: Math.floor(screenBounds.x + (screenBounds.width - MIN_WINDOW_WIDTH) / 2),
    y: Math.floor(screenBounds.y + screenBounds.height * 0.15),
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    maxHeight: Math.floor(0.8 * screenBounds.height),
    width: MIN_WINDOW_WIDTH,
    height: MIN_WINDOW_HEIGHT,
    frame: false,
    resizable: true,
    transparent: false,
    movable: true,
    show: false,
    skipTaskbar: true,
    focusable: true,
    closable: true,
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? BG_COLOR_DARK
      : BG_COLOR_LIGHT,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: false,
      preload: join(__dirname, "renderer/write-preload.bundle.js"),
    },
    maximizable: false,
    minimizable: false,
  };
};

export async function createWriteWindow(
  cb?: (createdWindow: BrowserWindow) => void
) {
  const prodOptions = getWriteWindowInitConfig();
  const devOptions: BrowserWindowConstructorOptions = {
    ...prodOptions,
    webPreferences: {
      ...prodOptions.webPreferences,
      devTools: true,
    },
  };

  const constructorOptions =
    process.env.NODE_ENV !== "production" ? devOptions : prodOptions;

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
