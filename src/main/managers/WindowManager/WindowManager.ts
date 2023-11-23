import { IPC_MESSAGE } from "@src/common/constants";
import { BrowserWindow, app } from "electron";
import { createSearchWindow } from "../../windows/createSearchWindow";
import { createWriteWindow } from "../../windows/createWriteWindow";
import { NoteEditInfo } from "@renderer/common/types";
import { createSettingsWindow } from "../../windows/createSettingsWindow";
import { createIntroWindow } from "../../windows/createIntroWindow";
import BaseManager from "../BaseManager";
import { MenuName } from "../MenuManager/MenuManager";

/*
WINDOW MANAFER handles most window operations, e.g opening, closing, and tracking windows.

NOTES:
- wcId stands for webContents id
*/

export default class WindowManager extends BaseManager {
  private searchWindow: BrowserWindow | null = null;
  private wcToSearcherIndexMap: { [wcId: number]: number | null } = [];
  private wcToBrowserWindowMap: { [wcId: number]: BrowserWindow } = [];
  private writeWindowFocusHistory: number[] = []; // Items in array are wcIds
  private settingsWindow: BrowserWindow | null = null;
  private introWindow: BrowserWindow | null = null;
  private isAppShown = false;
  private isWindowOpening = false;
  private uniqueWriteWindow: BrowserWindow | null = null;

  /*
  SECTION: Open new windows
  */
  async openSettingsWindow() {
    if (!this.settingsWindow) {
      this.settingsWindow = await createSettingsWindow(
        this._onSettingsWindowCreate
      );
    }

    // Focus immediately on open
    this.settingsWindow.show();
    this.settingsWindow.focus();
  }

  async openWriteWindowForNote(noteEditInfo?: NoteEditInfo) {
    if (this.isWindowOpening) return;
    this.isWindowOpening = true;

    const searcherIndex = noteEditInfo ? noteEditInfo.searcherIndex : null;

    const prevWindow = this.getLastFocusedWriteWindow();

    const newWindow = await createWriteWindow((createdWindow) => {
      this._onWriteWindowCreate(createdWindow);

      if (noteEditInfo) {
        createdWindow.webContents.send(
          IPC_MESSAGE.FROM_MAIN.SEND_NOTE_FOR_EDIT,
          noteEditInfo
        );
      }

      if (prevWindow) {
        const { x, y } = prevWindow.getBounds();
        const X__PREVIOUS_PADDING = 5;
        const Y__PREVIOUS_PADDING = 5;

        createdWindow.setPosition(
          x + X__PREVIOUS_PADDING,
          y + Y__PREVIOUS_PADDING,
          false
        );
      }

      createdWindow.show();
      createdWindow.focus();
    });

    if (searcherIndex !== null)
      this.registerWriteWindow(newWindow, searcherIndex);

    this.isWindowOpening = false;

    return newWindow;
  }

  async openIntroWindow() {
    if (!this.introWindow) {
      this.introWindow = await createIntroWindow(this._onIntroWindowCreate);
    }

    // Focus immediately on open
    this.introWindow.show();
    this.introWindow.focus();
  }

  async openSearchWindow() {
    if (this.isWindowOpening) return;
    this.isWindowOpening = true;

    const newWindow = await createSearchWindow(this._onSearchWindowCreate);

    this.isWindowOpening = false;

    return newWindow;
  }

  async openUniqueWriteWindow() {
    if (this.isWindowOpening) return;
    this.isWindowOpening = true;

    const newWindow = await createWriteWindow(this._onUniqueWriteWindowCreate);

    this.isWindowOpening = false;

    return newWindow;
  }

  /*
  SECTION: On window create functions
  */
  _onCommonWindowCreate = (createdWindow: BrowserWindow) => {
    createdWindow.webContents.on(
      "before-input-event",
      (_event, electronInput) => {
        this.electronKeyboardManager.handleElectronInputKeyboardModifiers(
          electronInput
        );
      }
    );
  };

  _onSettingsWindowCreate = (createdWindow: BrowserWindow) => {
    createdWindow.on("focus", () => {
      this.menuManager.useMenu(MenuName.settings);
    });

    createdWindow.on("blur", () => {
      createdWindow.close();
      createdWindow.destroy();
    });

    createdWindow.on("close", () => {
      this.settingsWindow = null;
    });

    this._onCommonWindowCreate(createdWindow);
  };

  _onIntroWindowCreate = (createdWindow: BrowserWindow) => {
    createdWindow.on("focus", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        true
      );
      this.menuManager.useMenu(MenuName.intro);
    });

    createdWindow.on("blur", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        false
      );
    });

    createdWindow.on("close", () => {
      this.introWindow = null;
    });

    this._onCommonWindowCreate(createdWindow);
  };

  _onSearchWindowCreate = (createdWindow: BrowserWindow) => {
    this.searchWindow = createdWindow;

    createdWindow.on("focus", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        true
      );
      this.menuManager.useMenu(MenuName.search);
    });

    createdWindow.on("blur", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        false
      );
    });

    createdWindow.on("close", () => {
      this.searchWindow = null;
      createdWindow.destroy();

      if (this.modeManager.isAppInEditMode()) {
        this.modeManager.switchToClosedMode();
      }
    });

    createdWindow.show();
    createdWindow.focus();

    this._onCommonWindowCreate(createdWindow);
  };

  _onUniqueWriteWindowCreate = (createdWindow: BrowserWindow) => {
    this.uniqueWriteWindow = createdWindow;
    this.registerWriteWindow(createdWindow);

    createdWindow.on("focus", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        true
      );

      this.menuManager.useMenu(MenuName.write);
    });

    createdWindow.on("blur", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        false
      );
    });

    createdWindow.on("close", () => {
      this.deregisterWriteWindow(createdWindow);
      this.uniqueWriteWindow = null;
      createdWindow.destroy();

      if (this.modeManager.isAppInWriteMode()) {
        this.modeManager.switchToClosedMode();
      }
    });

    createdWindow.show();
    createdWindow.focus();

    this._onCommonWindowCreate(createdWindow);
  };

  _onWriteWindowCreate = (createdWindow: BrowserWindow) => {
    const wcId = this.registerWriteWindow(createdWindow);

    createdWindow.on("focus", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        true
      );

      // Add to focus history
      const shouldUpdateFocusHistory =
        !this.writeWindowFocusHistory.length ||
        (this.writeWindowFocusHistory.length &&
          this.writeWindowFocusHistory[
            this.writeWindowFocusHistory.length - 1
          ] !== wcId);

      if (shouldUpdateFocusHistory) this.writeWindowFocusHistory.push(wcId);

      this.menuManager.useMenu(MenuName.write);
    });

    createdWindow.on("blur", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        false
      );
    });

    createdWindow.on("close", () => {
      // Remove from focus history
      this.writeWindowFocusHistory = this.writeWindowFocusHistory.filter(
        (otherIds) => otherIds !== wcId
      );

      this.deregisterWriteWindow(createdWindow);
      createdWindow.destroy();
    });

    this._onCommonWindowCreate(createdWindow);
  };

  /*
  SECTION: Get specific windows
  */
  getLastFocusedWriteWindow() {
    if (!this.writeWindowFocusHistory.length) return null;
    const wcId =
      this.writeWindowFocusHistory[this.writeWindowFocusHistory.length - 1];
    return this.wcToBrowserWindowMap[wcId];
  }

  getBrowserViewFromSearcherIndex(searcherIndex: number) {
    let existingWcId: number | null = null;
    Object.entries(this.wcToSearcherIndexMap).forEach((item) => {
      const [key, val] = item;
      if (val === searcherIndex) {
        existingWcId = parseInt(key);
        return;
      }
    });
    if (existingWcId === null) {
      return null;
    }
    return this.wcToBrowserWindowMap[existingWcId] || null;
  }

  getSearchWindow() {
    return this.searchWindow;
  }

  getSettingsWindow() {
    return this.settingsWindow;
  }

  getIntroWindow() {
    return this.introWindow;
  }

  getAllOpenWindowsList() {
    const toReturn = [];
    if (this.searchWindow) {
      toReturn.push(this.searchWindow);
    }
    if (this.settingsWindow) {
      toReturn.push(this.settingsWindow);
    }
    if (this.introWindow) {
      toReturn.push(this.introWindow);
    }
    Object.values(this.wcToBrowserWindowMap).forEach((window) => {
      toReturn.push(window);
    });
    return toReturn;
  }

  /*
  SECTION: Close windows
  */
  closeAllWriteWindows() {
    Object.values(this.wcToBrowserWindowMap).forEach((window) => {
      window.close();
    });
  }

  closeWriteWindowBySearcherIndex(searcherIndex: number) {
    const wcId = Object.keys(this.wcToSearcherIndexMap).find(
      (key: string) =>
        this.wcToSearcherIndexMap[parseInt(key)] === searcherIndex
    );

    if (wcId !== undefined) {
      const browserWindow = this.wcToBrowserWindowMap[parseInt(wcId)];
      browserWindow.close();
    }
  }

  closeCurrentWindow() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (currentWindow && currentWindow.isClosable()) {
      currentWindow.close();
    }
  }

  closeAllWindows() {
    this.getAllOpenWindowsList().forEach((window) => {
      window.setClosable(true);
      window.close();
    });
  }

  /*
  SECTION: Write window assignment and registration
  */
  registerWriteWindow(newWindow: BrowserWindow, searcherIndex?: number) {
    const wcId = newWindow.webContents.id;
    this.wcToBrowserWindowMap[wcId] = newWindow;
    this.wcToSearcherIndexMap[wcId] = searcherIndex || null;
    return wcId;
  }

  deregisterWriteWindow(writeWindow: BrowserWindow) {
    const wcId = writeWindow.webContents.id;
    delete this.wcToBrowserWindowMap[wcId];
    delete this.wcToSearcherIndexMap[wcId];
  }

  /*
  Assigns a searcher index to a write window
  */
  assignWriteWindowSearcherIndex(wcId: number, searcherIndex: number) {
    this.wcToSearcherIndexMap[wcId] = searcherIndex;
  }

  /*
  Removes searcher index assignment from write window, denoting that it is now a new note window
  */
  revertWriteWindowSearcherIndex(wcId: number) {
    this.wcToSearcherIndexMap[wcId] = null;
  }

  /*
  Resets a write window's contents for new notes or general resets
  */
  resetWriteWindow(wcId: number) {
    const currWindow = this.wcToBrowserWindowMap[wcId];
    this.revertWriteWindowSearcherIndex(wcId);
    currWindow.webContents.send(IPC_MESSAGE.FROM_MAIN.RESET_WRITE_WINDOW);
  }

  /*
  SECTION: Focus on windows
  */
  focusSearchWindow() {
    this.searchWindow?.focus();
  }

  focusWriteWindow(wcId: number) {
    if (this.wcToBrowserWindowMap[wcId])
      this.wcToBrowserWindowMap[wcId].focus();
  }

  focusLastFocusedWriteWindow() {
    this.getLastFocusedWriteWindow()?.focus();
  }

  /* 
  SECTION: Show and hide windows
  */
  showAllWindows() {
    const windows = this.getAllOpenWindowsList();
    windows.forEach((window) => {
      window.show();
    });

    app.show();
    app.dock.hide();

    this.isAppShown = true;
  }

  hideAllWindows() {
    const windows = this.getAllOpenWindowsList();
    windows.forEach((window) => window.hide());

    app.hide();
    app.dock.hide();

    this.isAppShown = false;
  }

  getIsAppShown() {
    return this.isAppShown;
  }

  /*
  SECTION: Utility
  */
  handleNewNote() {
    const lastFocused = this.getLastFocusedWriteWindow();
    if (lastFocused) this.resetWriteWindow(lastFocused.webContents.id);
  }

  // Called when we want to quit
  allowClosureOfAllWindows() {
    const windows = this.getAllOpenWindowsList();
    windows.forEach((window) => window.setClosable(true));
  }
}
