import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import { SettingsElectronAPI } from "@src/global.declaration";
import { contextBridge, ipcRenderer } from "electron";
import { IPC_MESSAGE } from "@src/common/constants";
import getCommonPreloadFunctions from "@renderer/common/getCommonPreloadFunctions";

/* CONTEXT BRIDGE */
const SETTINGS_ELECTRON_API: SettingsElectronAPI = {
  getNotesFolderPath: () =>
    ipcRenderer.invoke(IPC_MESSAGE.FROM_RENDERER.GET_NOTES_FOLDER_PATH),
  setNotesFolderPath: (newPath: string) =>
    ipcRenderer.send(IPC_MESSAGE.FROM_RENDERER.SET_NOTES_FOLDER_PATH, newPath),
  openDialogNotesFolderPath: () =>
    ipcRenderer.invoke(
      IPC_MESSAGE.FROM_RENDERER.OPEN_DIALOG_NOTES_FOLDER_PATH,
      "settings"
    ),
};

const COMMON_ELECTRON_API = getCommonPreloadFunctions();

contextBridge.exposeInMainWorld("settingsElectronAPI", SETTINGS_ELECTRON_API);
contextBridge.exposeInMainWorld("commonElectronAPI", COMMON_ELECTRON_API);
