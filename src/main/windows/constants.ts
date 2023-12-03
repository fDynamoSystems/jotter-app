import { BG_COLOR_DARK, BG_COLOR_LIGHT } from "@src/common/constants";
import { BrowserWindowConstructorOptions, nativeTheme } from "electron";

export const INITIAL_ON_TOP_LEVEL = "pop-up-menu";
export const INITIAL_ON_TOP_RELATIVE_LEVEL = 1;
export const COMMON_WINDOW_SETTINGS: BrowserWindowConstructorOptions = {
  frame: false,
  resizable: true,
  transparent: false,
  movable: true,
  show: false,
  skipTaskbar: true,
  focusable: true,
  closable: true,
  maximizable: false,
  minimizable: false,
  hasShadow: true,
  backgroundColor: nativeTheme.shouldUseDarkColors
    ? BG_COLOR_DARK
    : BG_COLOR_LIGHT,
};
