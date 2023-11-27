import { IPC_MESSAGE } from "@src/common/constants";
import { BrowserWindow } from "electron";
import { createSearchWindow } from "../../windows/createSearchWindow";
import { createWriteWindow } from "../../windows/createWriteWindow";
import { NoteEditInfo } from "@src/common/types";
import { createSettingsWindow } from "../../windows/createSettingsWindow";
import { createIntroWindow } from "../../windows/createIntroWindow";
import BaseManager from "../BaseManager";
import { MenuName } from "../MenuManager/MenuManager";
import {
  OpenSearchWindowSettings,
  OpenSettingsWindowSettings,
  OpenWriteWindowSettings,
  WindowType,
} from "./types";
import { SHOW_DELAY } from "@main/common/constants";

/*
WINDOW MANAGER handles most window operations, e.g opening, closing, and tracking windows.

NOTES:
- wcId stands for webContents id
*/

export default class WindowManager extends BaseManager {
  // wc Maps
  private wcToSearcherIndexMap: { [wcId: number]: number } = {};
  private wcToBrowserWindowMap: { [wcId: number]: BrowserWindow } = {};
  private wcToWindowTypeMap: { [wcId: number]: WindowType } = {};
  private wcToWindowPositionMap: { [wcId: number]: number[] } = {};
  private wcToWindowSizeMap: { [wcId: number]: number[] } = {};

  // unique windows represented by their wc id
  private searchWindow: number | null = null;
  private settingsWindow: number | null = null;
  private introWindow: number | null = null;

  // other states
  private focusHistory: number[] = []; // Items in array are wcIds

  /*
  SECTION: Open new windows
  */
  async openIntroWindow() {
    return await createIntroWindow(this._onIntroWindowCreate);
  }

  async openSettingsWindow(openSettings?: OpenSettingsWindowSettings) {
    const window = await createSettingsWindow(
      (createdWindow) => this._onSettingsWindowCreate(createdWindow),
      openSettings?.createSettings
    );

    if (openSettings?.immediatelyShow) {
      setTimeout(() => {
        this.showWindowByWc(window.webContents.id);
      }, SHOW_DELAY);
    }
    return window;
  }

  async openSearchWindow(openSettings?: OpenSearchWindowSettings) {
    const window = await createSearchWindow(
      (createdWindow) =>
        this._onSearchWindowCreate(createdWindow, openSettings?.query),
      openSettings?.createSettings
    );

    if (openSettings?.immediatelyShow) {
      setTimeout(() => {
        this.showWindowByWc(window.webContents.id);
      }, SHOW_DELAY);
    }
    return window;
  }

  async openWriteWindow(openSettings?: OpenWriteWindowSettings) {
    const prevWindow = this.getLastFocusedWriteWindow();

    const window = await createWriteWindow((createdWindow) => {
      this._onWriteWindowCreate(
        createdWindow,
        openSettings?.noteEditInfo || null,
        prevWindow
      );
    }, openSettings?.createSettings);

    if (openSettings?.immediatelyShow) {
      setTimeout(() => {
        this.showWindowByWc(window.webContents.id);
      }, SHOW_DELAY);
    }

    return window;
  }

  /*
  SECTION: On window create functions
  */
  /**
   * SUB-SECTION: Common window functions on create
   */
  _onCommonWindowCreate = (
    createdWindow: BrowserWindow,
    windowType: WindowType
  ) => {
    const wcId = this.registerWindow(createdWindow, windowType);

    createdWindow.webContents.on(
      "before-input-event",
      (_event, electronInput) => {
        this.electronKeyboardManager.handleElectronInputKeyboardModifiers(
          electronInput
        );
      }
    );

    createdWindow.on("moved", () => {
      this.wcToWindowPositionMap[wcId] = createdWindow.getPosition();
      this.wcToWindowSizeMap[wcId] = createdWindow.getSize();
    });

    createdWindow.on("resized", () => {
      this.wcToWindowPositionMap[wcId] = createdWindow.getPosition();
      this.wcToWindowSizeMap[wcId] = createdWindow.getSize();
    });
  };

  _onCommonWindowClose = (createdWindow: BrowserWindow) => {
    this.deregisterWindow(createdWindow);
    if (this.focusHistory.length === 0) {
      this.modeManager.switchToClosedMode();
    }
  };

  _onCommonWindowFocus = (createdWindow: BrowserWindow) => {
    const wcId = createdWindow.webContents.id;

    createdWindow.webContents.send(IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED, true);

    // Add to focus history
    const shouldUpdateFocusHistory =
      !this.focusHistory.length ||
      (this.focusHistory.length &&
        this.focusHistory[this.focusHistory.length - 1] !== wcId);

    if (shouldUpdateFocusHistory) this.focusHistory.push(wcId);
  };

  _onCommonWindowBlur = (createdWindow: BrowserWindow) => {
    createdWindow.webContents.send(IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED, false);
  };

  /**
   * SUB-SECTION: Specific window create functions
   */
  _onIntroWindowCreate = (createdWindow: BrowserWindow) => {
    const wcId = createdWindow.webContents.id;
    this.introWindow = wcId;

    createdWindow.on("focus", () => {
      this.menuManager.useMenu(MenuName.intro);
      this._onCommonWindowFocus(createdWindow);
    });

    createdWindow.on("blur", () => {
      this._onCommonWindowBlur(createdWindow);
    });

    createdWindow.on("close", () => {
      this.introWindow = null;
      this._onCommonWindowClose(createdWindow);
    });

    this._onCommonWindowCreate(createdWindow, WindowType.Intro);
  };

  _onSettingsWindowCreate = (createdWindow: BrowserWindow) => {
    const wcId = createdWindow.webContents.id;
    this.settingsWindow = wcId;

    createdWindow.on("focus", () => {
      this.menuManager.useMenu(MenuName.settings);
      this._onCommonWindowFocus(createdWindow);
    });

    createdWindow.on("blur", () => {
      createdWindow.close();
    });

    createdWindow.on("close", () => {
      this.settingsWindow = null;
      this._onCommonWindowClose(createdWindow);
    });

    this._onCommonWindowCreate(createdWindow, WindowType.Settings);
  };

  _onSearchWindowCreate = (createdWindow: BrowserWindow, query?: string) => {
    const wcId = createdWindow.webContents.id;
    this.searchWindow = wcId;

    createdWindow.on("focus", () => {
      this.menuManager.useMenu(MenuName.search);
      this._onCommonWindowFocus(createdWindow);
    });

    createdWindow.on("blur", () => {
      this._onCommonWindowBlur(createdWindow);
    });

    createdWindow.on("close", () => {
      this.searchWindow = null;
      this._onCommonWindowClose(createdWindow);
    });

    if (query) {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.SET_SEARCH_QUERY,
        query
      );
    }

    this._onCommonWindowCreate(createdWindow, WindowType.Search);
    this.modeManager.ensureOpenMode();
  };

  _onWriteWindowCreate = (
    createdWindow: BrowserWindow,
    noteEditInfo: NoteEditInfo | null,
    prevWindow: BrowserWindow | null
  ) => {
    const wcId = createdWindow.webContents.id;

    createdWindow.on("focus", () => {
      this.menuManager.useMenu(MenuName.write);
      this._onCommonWindowFocus(createdWindow);
    });

    createdWindow.on("blur", () => {
      this._onCommonWindowBlur(createdWindow);
    });

    createdWindow.on("close", () => {
      this._onCommonWindowClose(createdWindow);
      if (this.getLastFocusedWriteWindow()) {
        this.focusLastFocusedWriteWindow();
      } else {
        this.focusLastFocusedWindow();
      }
    });

    if (noteEditInfo) {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.SEND_NOTE_FOR_EDIT,
        noteEditInfo
      );

      this.assignWriteWindowSearcherIndex(wcId, noteEditInfo.searcherIndex);
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

    this._onCommonWindowCreate(createdWindow, WindowType.Write);
    this.modeManager.ensureOpenMode();
  };

  /*
  SECTION: Get specific windows
  */
  getIntroWindow(): BrowserWindow | null {
    if (this.introWindow === null) return null;
    return this.wcToBrowserWindowMap[this.introWindow];
  }

  getSettingsWindow(): BrowserWindow | null {
    if (this.settingsWindow === null) return null;
    return this.wcToBrowserWindowMap[this.settingsWindow];
  }

  getSearchWindow(): BrowserWindow | null {
    if (this.searchWindow === null) return null;
    return this.wcToBrowserWindowMap[this.searchWindow];
  }

  getAllOpenWindowsList(): BrowserWindow[] {
    const toReturn = Object.values(this.wcToBrowserWindowMap).map((window) => {
      return window;
    });
    return toReturn;
  }

  getAllWindowsByType(windowType: WindowType): BrowserWindow[] {
    const toReturn: BrowserWindow[] = [];
    Object.entries(this.wcToWindowTypeMap).forEach((entry) => {
      const wcId = parseInt(entry[0]);
      const currType = entry[1];
      if (currType === windowType) {
        const windowToAdd = this.wcToBrowserWindowMap[wcId];
        if (windowToAdd) toReturn.push(windowToAdd);
      }
    });

    return toReturn;
  }

  getLastFocusedWindow(): BrowserWindow | null {
    if (!this.focusHistory.length) return null;
    const wcId = this.focusHistory[this.focusHistory.length - 1];
    return this.wcToBrowserWindowMap[wcId] || null;
  }

  getLastFocusedWriteWindow(): BrowserWindow | null {
    if (!this.focusHistory.length) return null;
    for (let i = this.focusHistory.length - 1; i >= 0; i--) {
      const wcId = this.focusHistory[i];
      if (this.wcToWindowTypeMap[wcId] === WindowType.Write) {
        return this.wcToBrowserWindowMap[wcId];
      }
    }
    return null;
  }

  getBrowserWindowFromSearcherIndex(
    searcherIndex: number
  ): BrowserWindow | null {
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

  getWindowByWc(wcId: number) {
    return this.wcToBrowserWindowMap[wcId] || null;
  }

  /*
  SECTION: Close windows
  */
  closeAllWriteWindows() {
    this.getAllWindowsByType(WindowType.Write).forEach((window) =>
      window.close()
    );
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

  closeSearchWindow() {
    const searchWindow = this.getSearchWindow();
    if (searchWindow) searchWindow.close();
  }

  /*
  SECTION: Window assignment and registration
  */
  registerWindow(newWindow: BrowserWindow, windowType: WindowType) {
    const wcId = newWindow.webContents.id;
    this.wcToBrowserWindowMap[wcId] = newWindow;
    this.wcToWindowTypeMap[wcId] = windowType;
    this.wcToWindowPositionMap[wcId] = newWindow.getPosition();
    this.wcToWindowSizeMap[wcId] = newWindow.getSize();
    return wcId;
  }

  deregisterWindow(writeWindow: BrowserWindow) {
    const wcId = writeWindow.webContents.id;
    delete this.wcToBrowserWindowMap[wcId];
    delete this.wcToWindowTypeMap[wcId];
    delete this.wcToWindowPositionMap[wcId];
    delete this.wcToWindowSizeMap[wcId];
    if (this.wcToSearcherIndexMap[wcId]) delete this.wcToSearcherIndexMap[wcId];

    // Remove from focus history
    this.focusHistory = this.focusHistory.filter(
      (otherIds) => otherIds !== wcId
    );
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
  revertWriteWindowSearcherIndexUsingWcId(wcId: number) {
    if (this.wcToSearcherIndexMap[wcId]) delete this.wcToSearcherIndexMap[wcId];
  }

  /*
  Resets a write window's contents for new notes or general resets
  */
  resetWriteWindowContents(writeWindow: BrowserWindow) {
    const wcId = writeWindow.webContents.id;
    this.revertWriteWindowSearcherIndexUsingWcId(wcId);
    writeWindow.webContents.send(IPC_MESSAGE.FROM_MAIN.RESET_WRITE_WINDOW);
  }

  /*
  SECTION: Focus on windows
  */
  focusSearchWindow() {
    this.getSearchWindow()?.focus();
  }

  focusOrCreateSearchWindow() {
    const currWindow = this.getSearchWindow();
    if (currWindow) currWindow.focus();
    else this.openSearchWindow({ immediatelyShow: true });
  }

  focusWriteWindow(wcId: number) {
    if (this.wcToBrowserWindowMap[wcId])
      this.wcToBrowserWindowMap[wcId].focus();
  }

  focusLastFocusedWriteWindow() {
    this.getLastFocusedWriteWindow()?.focus();
  }

  focusOrCreateLastFocusedWriteWindow() {
    const currWindow = this.getLastFocusedWriteWindow();
    if (currWindow) currWindow.focus();
    else this.openWriteWindow({ immediatelyShow: true });
  }

  focusLastFocusedWindow() {
    this.getLastFocusedWindow()?.focus();
  }

  /**
   * SECTION: Show windows
   */
  showWindowByWc(wcId: number) {
    this.getWindowByWc(wcId)?.show();
  }

  /*
  SECTION: Utility
  */
  handleNewNote() {
    if (this.modeManager.isAppInOpenMode()) {
      const lastFocused = this.getLastFocusedWriteWindow();
      if (lastFocused) this.resetWriteWindowContents(lastFocused);
      else {
        this.openWriteWindow({ immediatelyShow: true });
      }
    }
  }

  // Called when we want to quit
  allowClosureOfAllWindows() {
    const windows = this.getAllOpenWindowsList();
    windows.forEach((window) => window.setClosable(true));
  }

  getFocusHistory() {
    return this.focusHistory;
  }

  /**
   * Clean focus history removes any duplicates for rendering purposes, biasing later entries of duplicates
   */
  getCleanFocusHistory() {
    if (!this.focusHistory.length) return [];
    const toReturn: number[] = [];
    const duplicateSet = new Set<number>();
    for (let i = this.focusHistory.length - 1; i >= 0; i--) {
      const wcId = this.focusHistory[i];
      if (!duplicateSet.has(wcId)) {
        toReturn.unshift(wcId);
        duplicateSet.add(wcId);
      }
    }
    return toReturn;
  }

  setFocusHistory(newHistory: number[]) {
    this.focusHistory = newHistory;
  }

  getAllMaps() {
    return {
      wcToSearcherIndexMap: this.wcToSearcherIndexMap,
      wcToBrowserWindowMap: this.wcToBrowserWindowMap,
      wcToWindowTypeMap: this.wcToWindowTypeMap,
      wcToWindowPositionMap: this.wcToWindowPositionMap,
      wcToWindowSizeMap: this.wcToWindowSizeMap,
    };
  }
}
