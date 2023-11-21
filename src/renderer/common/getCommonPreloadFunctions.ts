import { IPC_MESSAGE } from "@src/common/constants";
import { CommonElectronAPI } from "@src/global.declaration";
import { ipcRenderer } from "electron";

const getCommonPreloadFunctions = (): CommonElectronAPI => {
  return {
    onWindowFocusChange: (callback) =>
      ipcRenderer.on(IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED, callback),
    focusSearchWindow: () =>
      ipcRenderer.send(IPC_MESSAGE.FROM_RENDERER.FOCUS_SEARCH_WINDOW),
    focusWriteWindow: (searchIndex) =>
      ipcRenderer.send(
        IPC_MESSAGE.FROM_RENDERER.FOCUS_SEARCH_WINDOW,
        searchIndex
      ),
    closeOverlay: () =>
      ipcRenderer.send(IPC_MESSAGE.FROM_RENDERER.CLOSE_OVERLAY),
    getKeyboardModifiersState: () =>
      ipcRenderer.invoke(
        IPC_MESSAGE.FROM_RENDERER.GET_KEYBOARD_MODIFIERS_STATE
      ),
    closeCurrentWindow: () =>
      ipcRenderer.send(IPC_MESSAGE.FROM_RENDERER.CLOSE_CURRENT_WINDOW),
  };
};

export default getCommonPreloadFunctions;
