import { Coordinates } from "@src/common/types";
import { Size } from "electron";

export type WindowCreateSettings = {
  position?: Coordinates;
  size?: Size;
};
