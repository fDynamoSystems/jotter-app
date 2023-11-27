import { WindowCreateSettings } from "@main/windows/types";
import { Coordinates, NoteEditInfo } from "@src/common/types";
import { Size } from "electron";

export enum WindowType {
  Intro,
  Settings,
  Search,
  Write,
}

type CommonWindowSettings = {
  createSettings?: WindowCreateSettings;
  immediatelyShow?: boolean;
};
export type OpenWriteWindowSettings = {
  noteEditInfo?: NoteEditInfo;
} & CommonWindowSettings;

export type OpenSearchWindowSettings = {
  query?: string;
} & CommonWindowSettings;

export type OpenSettingsWindowSettings = CommonWindowSettings;

export type WindowVisualDetails = {
  position: Coordinates;
  size: Size;
};
