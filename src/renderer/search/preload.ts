import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import { SearchElectronAPI } from "@src/global.declaration";
import { contextBridge, ipcRenderer } from "electron";
import { IPC_MESSAGE } from "@src/common/constants";
import getCommonPreloadFunctions from "@renderer/common/getCommonPreloadFunctions";

/* CONTEXT BRIDGE */
const SEARCH_ELECTRON_API: SearchElectronAPI = {
  queryNotes: (query) =>
    ipcRenderer.invoke(IPC_MESSAGE.FROM_RENDERER.QUERY_NOTES, query),
  getRecentNotes: () =>
    ipcRenderer.invoke(IPC_MESSAGE.FROM_RENDERER.GET_RECENT_NOTES),
  onRetriggerRequest: (cb) =>
    ipcRenderer.on(IPC_MESSAGE.FROM_MAIN.RETRIGGER_SEARCH, cb),
  sendNoteForEdit: (noteEditInfo) =>
    ipcRenderer.send(
      IPC_MESSAGE.FROM_RENDERER.SEND_NOTE_FOR_EDIT,
      noteEditInfo
    ),
  openWriteWindowForNote: (noteEditInfo) =>
    ipcRenderer.send(
      IPC_MESSAGE.FROM_RENDERER.OPEN_WRITE_WINDOW_FOR_NOTE,
      noteEditInfo
    ),
  confirmAndDeleteNote: (noteEditInfo) =>
    ipcRenderer.invoke(
      IPC_MESSAGE.FROM_RENDERER.CONFIRM_AND_DELETE_NOTE,
      noteEditInfo
    ),
  openContextMenuForResultItem: (noteEditInfo) =>
    ipcRenderer.send(
      IPC_MESSAGE.FROM_RENDERER.CONTEXT_MENU_RESULT_ITEM,
      noteEditInfo
    ),
  onSetQuery: (cb) =>
    ipcRenderer.on(IPC_MESSAGE.FROM_MAIN.SET_SEARCH_QUERY, cb),
};

const COMMON_ELECTRON_API = getCommonPreloadFunctions();

contextBridge.exposeInMainWorld("searchElectronAPI", SEARCH_ELECTRON_API);
contextBridge.exposeInMainWorld("commonElectronAPI", COMMON_ELECTRON_API);
