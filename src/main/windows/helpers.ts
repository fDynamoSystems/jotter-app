import { screen } from "electron";

export function getActiveScreenBounds() {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).bounds;
}
