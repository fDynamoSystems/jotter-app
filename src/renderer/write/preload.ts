import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import { WriteElectronAPI } from "@src/global.declaration";
import { contextBridge, ipcRenderer } from "electron";
import { IPC_MESSAGE } from "@src/common/constants";
import getCommonPreloadFunctions from "@renderer/common/getCommonPreloadFunctions";

/* CONTEXT BRIDGE */
const WRITE_ELECTRON_API: WriteElectronAPI = {
  createNote: (noteVal: string) =>
    ipcRenderer.invoke(IPC_MESSAGE.FROM_RENDERER.CREATE_NOTE, noteVal),
  editNote: (noteEditInfo) =>
    ipcRenderer.invoke(IPC_MESSAGE.FROM_RENDERER.EDIT_NOTE, noteEditInfo),
  retriggerSearch: () =>
    ipcRenderer.send(IPC_MESSAGE.FROM_RENDERER.RETRIGGER_SEARCH),
  onNoteEditRequest: (cb) =>
    ipcRenderer.on(IPC_MESSAGE.FROM_MAIN.SEND_NOTE_FOR_EDIT, cb),
  onResetWriteWindowRequest: (cb) =>
    ipcRenderer.on(IPC_MESSAGE.FROM_MAIN.RESET_WRITE_WINDOW, cb),
  removeResetWriteWindowRequestListener: () =>
    ipcRenderer.removeAllListeners(IPC_MESSAGE.FROM_MAIN.RESET_WRITE_WINDOW),
};

const COMMON_ELECTRON_API = getCommonPreloadFunctions();

contextBridge.exposeInMainWorld("writeElectronAPI", WRITE_ELECTRON_API);
contextBridge.exposeInMainWorld("commonElectronAPI", COMMON_ELECTRON_API);
