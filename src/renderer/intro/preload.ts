import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import { IntroElectronAPI } from "@src/global.declaration";
import { contextBridge, ipcRenderer } from "electron";
import { IPC_MESSAGE } from "@src/common/constants";
import getCommonPreloadFunctions from "@renderer/common/getCommonPreloadFunctions";

/* CONTEXT BRIDGE */
const INTRO_ELECTRON_API: IntroElectronAPI = {
  initialSetNotesFolderPath: (newPath: string) =>
    ipcRenderer.send(
      IPC_MESSAGE.FROM_RENDERER.INITIAL_SET_NOTES_FOLDER_PATH,
      newPath
    ),
  openDialogNotesFolderPath: () =>
    ipcRenderer.invoke(
      IPC_MESSAGE.FROM_RENDERER.OPEN_DIALOG_NOTES_FOLDER_PATH,
      "intro"
    ),
  closeIntroWindow: () =>
    ipcRenderer.send(IPC_MESSAGE.FROM_RENDERER.CLOSE_INTRO),
};

const COMMON_ELECTRON_API = getCommonPreloadFunctions();

contextBridge.exposeInMainWorld("introElectronAPI", INTRO_ELECTRON_API);
contextBridge.exposeInMainWorld("commonElectronAPI", COMMON_ELECTRON_API);
