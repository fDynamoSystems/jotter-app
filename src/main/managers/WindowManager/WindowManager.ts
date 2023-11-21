import { IPC_MESSAGE, KeyboardShortcuts } from "@src/common/constants";
import { BrowserWindow, app, Menu, shell } from "electron";
import { createSearchWindow } from "../../windows/createSearchWindow";
import {
  createWriteWindow,
  resetWriteWindow,
} from "../../windows/createWriteWindow";
import { KeyboardModifiersState } from "@src/common/types";
import { NoteEditInfo } from "@renderer/common/types";
import { createSettingsWindow } from "../../windows/createSettingsWindow";
import { createIntroWindow } from "../../windows/createIntroWindow";
import defaultMenu from "electron-default-menu";

/*
WindowManager handles most window operations. All windows are created through the main window manager object.

NOTES:
- wcId stands for webContents id
*/

export default class WindowManager {
  private searchWindow: BrowserWindow | null = null;
  private wcToSearcherIndexMap: { [wcId: number]: number | null } = [];
  private wcToBrowserWindowMap: { [wcId: number]: BrowserWindow } = [];
  private writeWindowFocusHistory: number[] = []; // Items in array are wcIds
  private keyboardModifiersState: KeyboardModifiersState = {
    metaKey: false,
  };
  private settingsWindow: BrowserWindow | null = null;
  private introWindow: BrowserWindow | null = null;
  private isAppInitialized = false;
  private isAppShown = false;
  private isAppClosable = false;
  private isWindowOpening = false;

  /*
  SECTION: Initialize
  */
  async initializeMainWindows() {
    if (this.isAppInitialized) return;
    await this.openSearchWindow();
    const firstWriteWindow = await createWriteWindow(this._onWriteWindowCreate);
    this.writeWindowFocusHistory.push(firstWriteWindow.webContents.id);
    this.isAppInitialized = true;
    this.useMenu("default");
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

  // Called when we want to quit
  allowClosureOfAllWindows() {
    const windows = this.getAllOpenWindowsList();
    windows.forEach((window) => window.setClosable(true));
    this.isAppClosable = true;
  }

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
    if (!this.searchWindow) {
      this.searchWindow = await createSearchWindow(this._onSearchWindowCreate);
    }
  }

  /*
  SECTION: Utility
  */
  handleNewNote() {
    const lastFocused = this.getLastFocusedWriteWindow();
    if (lastFocused) this.resetWriteWindow(lastFocused.webContents.id);
  }

  /*
  SECTION: On window create functions
  */
  _onCommonWindowCreate = (createdWindow: BrowserWindow) => {
    createdWindow.webContents.on(
      "before-input-event",
      (_event, electronInput) => {
        this.handleElectronInputKeyboardModifiers(electronInput);
      }
    );
  };

  _onSettingsWindowCreate = (createdWindow: BrowserWindow) => {
    createdWindow.on("focus", () => {
      this.useMenu("settings");
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
      this.useMenu("intro");
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
    createdWindow.on("focus", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        true
      );
      this.useMenu("search");
    });

    createdWindow.on("blur", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        false
      );
    });

    this._onCommonWindowCreate(createdWindow);
  };

  _onWriteWindowCreate = (createdWindow: BrowserWindow) => {
    const wcId = this.registerWriteWindow(createdWindow);

    createdWindow.on("focus", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        true
      );
      const shouldUpdateFocusHistory =
        !this.writeWindowFocusHistory.length ||
        (this.writeWindowFocusHistory.length &&
          this.writeWindowFocusHistory[
            this.writeWindowFocusHistory.length - 1
          ] !== wcId);

      if (shouldUpdateFocusHistory) this.writeWindowFocusHistory.push(wcId);

      this.useMenu("write");
    });

    createdWindow.on("blur", () => {
      createdWindow.webContents.send(
        IPC_MESSAGE.FROM_MAIN.WINDOW_FOCUSED,
        false
      );
    });

    createdWindow.on("close", (electronEvent) => {
      // Remove from focus history
      this.writeWindowFocusHistory = this.writeWindowFocusHistory.filter(
        (otherIds) => otherIds !== wcId
      );

      if (this.isAppClosable) return;

      const lastFocusedWindow = this.getLastFocusedWriteWindow();
      if (lastFocusedWindow) {
        lastFocusedWindow.focus();
        this.deregisterWriteWindow(createdWindow);
        createdWindow.destroy();
      } else {
        // If no window to focus on last, we reset
        electronEvent.preventDefault();

        // Reset representations of window and contents
        this.resetWriteWindow(wcId);

        // Reset size and position
        resetWriteWindow(createdWindow);

        // Add to focus history
        this.writeWindowFocusHistory.push(wcId);
      }
    });

    this._onCommonWindowCreate(createdWindow);
  };

  /*
  SECTION: Keyboard modifiers
  */

  handleElectronInputKeyboardModifiers = (electronInput: Electron.Input) => {
    if (electronInput.type === "keyUp") {
      if (electronInput.key === "Meta") {
        this.keyboardModifiersState.metaKey = false;
      }
    }
    if (electronInput.type === "keyDown") {
      if (electronInput.key === "Meta") {
        this.keyboardModifiersState.metaKey = true;
      }
    }
  };

  getKeyboardModifiersState() {
    return this.keyboardModifiersState;
  }

  /*
  SECTION: Entry functions
  */

  handleMainEntry() {
    if (!this.isAppShown) {
      this.showAllWindows();
      this.focusLastFocusedWriteWindow();
    } else {
      this.hideAllWindows();
    }
  }

  handleSearchEntry() {
    if (!this.isAppShown) {
      this.showAllWindows();
    }
    this.focusSearchWindow();
  }

  /*
  SECTION: Utility functions
  */

  /*
  SECTION: Menus
  */
  useMenu(windowName: "write" | "search" | "settings" | "intro" | "default") {
    let menu: Electron.MenuItemConstructorOptions[] = null!;
    switch (windowName) {
      case "write":
        menu = this.createWriteWindowMenu();
        break;
      case "search":
        menu = this.createSearchWindowMenu();
        break;
      case "settings":
        menu = this.createSettingsWindowMenu();
        break;
      case "intro":
        menu = this.createIntroWindowMenu();
        break;
      case "default":
        menu = this.createDefaultMenu();
        break;
      default:
        menu = this.createDefaultMenu();
        break;
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  }

  createDefaultMenu() {
    const menu = defaultMenu(app, shell);
    menu[0] = {
      label: "first",
      submenu: [
        {
          label: "New note",
          accelerator: KeyboardShortcuts.NEW_NOTE,
          click: () => this.handleNewNote(),
        },
        {
          label: "Write note",
          accelerator: KeyboardShortcuts.WRITE_NOTE,
          click: () => this.focusLastFocusedWriteWindow(),
        },
        { type: "separator" },
        {
          label: "Search notes",
          accelerator: KeyboardShortcuts.SEARCH_NOTES,
          click: () => this.focusSearchWindow(),
        },
        { type: "separator" },
        {
          label: "Close",
          accelerator: KeyboardShortcuts.CLOSE_APP,
          click: () => this.hideAllWindows(),
        },
        {
          label: "Quit",
          accelerator: KeyboardShortcuts.QUIT_APP,
          click: () => this.hideAllWindows(),
        },
      ],
    };

    // Remove unwanted items
    menu.splice(
      menu.findIndex((e) => e.label === "Help"),
      1
    );

    return menu;
  }

  createWriteWindowMenu() {
    const menu = this.createDefaultMenu();
    const mainSubmenu = menu[0]
      .submenu as Electron.MenuItemConstructorOptions[];
    mainSubmenu.splice(1, 1);
    return menu;
  }

  createSearchWindowMenu() {
    const menu = this.createDefaultMenu();
    const mainSubmenu = menu[0]
      .submenu as Electron.MenuItemConstructorOptions[];
    mainSubmenu.splice(2, 2);
    return menu;
  }

  createSettingsWindowMenu() {
    const menu = this.createDefaultMenu();

    return menu;
  }

  createIntroWindowMenu() {
    const menu = this.createDefaultMenu();
    const mainSubmenu = menu[0]
      .submenu as Electron.MenuItemConstructorOptions[];
    mainSubmenu.splice(0, 5);
    return menu;
  }
}
