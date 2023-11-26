import { WindowCreateSettings } from "@main/windows/types";
import { Coordinates, NoteEditInfo } from "@src/common/types";
import { Size } from "electron";

export enum WindowType {
  Intro,
  Settings,
  Search,
  Write,
}

export type OpenWriteWindowSettings = {
  noteEditInfo?: NoteEditInfo;
  createSettings?: WindowCreateSettings;
};

export type OpenSearchWindowSettings = {
  query: string;
  createSettings?: WindowCreateSettings;
};

export type WindowVisualDetails = {
  position: Coordinates;
  size: Size;
};
