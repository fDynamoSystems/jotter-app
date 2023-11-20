export const IPC_MESSAGE = {
  FROM_RENDERER: {
    FOCUS_SEARCH_WINDOW: "focus-search-widow",
    FOCUS_WRITE_WINDOW: "focus-write-note-widow",
    CREATE_NOTE: "create-note",
    CLOSE_OVERLAY: "close-overlay",
    QUERY_NOTES: "query-notes",
    EDIT_NOTE: "edit-note",
    DELETE_NOTE: "delete-note",
    GET_RECENT_NOTES: "get-recent-notes",
    RETRIGGER_SEARCH: "retrigger-search",
    SEND_NOTE_FOR_EDIT: "send-note-for-edit",
    OPEN_WRITE_WINDOW_FOR_NOTE: "open-write-window-for-note",
    GET_KEYBOARD_MODIFIERS_STATE: "get-keyboard-modifiers-state",
    SET_NOTES_FOLDER_PATH: "set-notes-folder-path",
    GET_NOTES_FOLDER_PATH: "get-notes-folder-path",
    OPEN_DIALOG_NOTES_FOLDER_PATH: "open-settings-dialog",
    SET_MAIN_ENTRY_SHORTCUT: "set-main-entry-shortcut",
    GET_MAIN_ENTRY_SHORTCUT: "get-main-entry-shortcut",
    INITIAL_SET_NOTES_FOLDER_PATH: "initial-set-notes-folder-path",
    CLOSE_INTRO: "close-intro",
    CONFIRM_AND_DELETE_NOTE: "confirm-and-delete-note",
    CONTEXT_MENU_RESULT_ITEM: "context-menu-result-item",
  },
  FROM_MAIN: {
    WINDOW_FOCUSED: "window-focused",
    RETRIGGER_SEARCH: "retrigger-search",
    SEND_NOTE_FOR_EDIT: "send-note-for-edit",
    RESET_WRITE_WINDOW: "reset-write-window",
  },
} as const;

export enum KeyboardShortcuts {
  MAIN_ENTRY = "Alt+CommandOrControl+N",
  SEARCH_ENTRY = "Alt+CommandOrControl+F",
  CLOSE_APP = "Escape",
  NEW_NOTE = "CommandOrControl+N",
  SEARCH_NOTES = "Shift+CommandOrControl+F",
  WRITE_NOTE = "Shift+CommandOrControl+E",
  QUIT_APP = "CommandOrControl+Q",
}

export const BG_COLOR_DARK = "#242424";
export const BG_COLOR_LIGHT = "#FFF";

export const APP_SETTINGS = {
  NOTES_FOLDER_PATH: "notebookFolderPath",
  MAIN_ENTRY_SHORTCUT: "mainEntryShortcut",
  SEARCH_ENTRY_SHORTCUT: "searchEntryShortcut",
};

export const MAX_NOTE_TITLE_LENGTH = 200;
