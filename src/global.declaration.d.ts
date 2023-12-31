import { KeyboardModifiersState, NoteEditInfo } from "./common/types";
import { QueryResultItem } from "@main/services/SearcherService";

export type CommonElectronAPI = {
  onWindowFocusChange: (cb: (_event: any, nowFocus: boolean) => void) => void;
  focusSearchWindow: () => void;
  focusWriteWindow: (searcherIndex: number) => void;
  closeOverlay: () => void;
  getKeyboardModifiersState: () => Promise<KeyboardModifiersState>;
  closeCurrentWindow: () => void;
  openSettings: () => void;
  openNotesFolderPath: () => Promise<{ isError: boolean; errorMsg: string }>;
  removeWindowFocusChangeListener: () => void;
};

export type WriteElectronAPI = {
  createNote: (noteVal: string) => Promise<NoteEditInfo>;
  editNote: (noteEditInfo: NoteEditInfo) => Promise<NoteEditInfo | null>;
  retriggerSearch: () => void;
  onNoteEditRequest: (
    cb: (_event: any, noteEditInfo: NoteEditInfo) => void
  ) => void;
  onResetWriteWindowRequest: (cb: (_event: any) => void) => void;
  removeNoteEditRequestListener: () => void;
  removeResetWriteWindowRequestListener: () => void;
};

export type SearchElectronAPI = {
  queryNotes: (query: string) => Promise<QueryResultItem[]>;
  getRecentNotes: () => Promise<QueryResultItem[]>;
  onRetriggerRequest: (cb: (_event: any) => void) => void;
  sendNoteForEdit: (noteEditInfo: NoteEditInfo) => void;
  openWriteWindowForNote: (noteEditInfo: NoteEditInfo) => void;
  confirmAndDeleteNote: (noteEditInfo: NoteEditInfo) => Promise<boolean>; // Returns true if note is deleted
  openContextMenuForResultItem: (noteEditInfo: NoteEditInfo) => void;
  onSetQuery: (cb: (_event: any, query: string) => void) => void;
};

export type SettingsElectronAPI = {
  getNotesFolderPath: () => Promise<string | undefined>;
  setNotesFolderPath: (newPath: string) => void;
  openDialogNotesFolderPath: () => Promise<string | undefined>;
};

export type IntroElectronAPI = {
  initialSetNotesFolderPath: (newPath: string) => void;
  openDialogNotesFolderPath: () => Promise<string | undefined>;
  closeIntroWindow: () => void;
};

declare global {
  interface Window {
    writeElectronAPI: WriteElectronAPI;
    searchElectronAPI: SearchElectronAPI;
    settingsElectronAPI: SettingsElectronAPI;
    commonElectronAPI: CommonElectronAPI;
    introElectronAPI: IntroElectronAPI;
  }
}
