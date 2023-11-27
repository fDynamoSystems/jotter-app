import { BrowserWindowConstructorOptions, screen } from "electron";
import { WindowCreateSettings } from "./types";

export function getActiveScreenBounds() {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).bounds;
}

export function applyCreateWindowSettings(
  createSettings: WindowCreateSettings,
  constructorOptions: BrowserWindowConstructorOptions
): BrowserWindowConstructorOptions {
  const convertedSettings: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } = {};
  if (createSettings.position) {
    (convertedSettings.x = createSettings.position.x),
      (convertedSettings.y = createSettings.position.y);
  }

  if (createSettings.size) {
    (convertedSettings.width = createSettings.size.width),
      (convertedSettings.height = createSettings.size.height);
  }

  return { ...constructorOptions, ...convertedSettings };
}
