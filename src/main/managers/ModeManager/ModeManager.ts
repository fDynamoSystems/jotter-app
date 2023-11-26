import BaseManager from "../BaseManager";
import {
  OpenSearchWindowSettings,
  OpenWriteWindowSettings,
  WindowType,
} from "../WindowManager/types";

/*
MODE MANAGER deals with the app's modes and works with other managers to show what is needed when modes change.
A mode is a configuration of windows. This idea was created when writing and editing / searching were separate modes.
*/
export enum AppMode {
  CLOSED,
  OPEN,
}

export default class ModeManager extends BaseManager {
  private appMode: AppMode = AppMode.CLOSED;
  private isSwitching: boolean = false;

  constructor() {
    super();
  }

  /*
  SECTION: Getters
  */
  getAppMode() {
    return this.appMode;
  }

  isAppInCloseMode() {
    return this.appMode === AppMode.CLOSED;
  }

  isAppInOpenMode() {
    return this.appMode === AppMode.OPEN;
  }

  /*
  Mode switching functions
  */
  switchToClosedMode() {
    const shouldContinue = this._onModeSwitch(AppMode.CLOSED);
    if (!shouldContinue) return;

    this.appMode = AppMode.CLOSED;
  }

  async switchToOpenMode() {
    const shouldContinue = this._onModeSwitch(AppMode.OPEN);
    if (!shouldContinue) return;

    if (this.appMode === AppMode.OPEN) return;
    this.appMode = AppMode.OPEN;

    // Call memory load
    const openModeMemory = this.memoryManager.loadOpenModeFromMemory();

    // Transform memory load to inputs for opening search window
    const newFocusHistory: number[] = [];

    if (openModeMemory) {
      await Promise.all(
        openModeMemory.windowDetailsList.map(async (windowDetails) => {
          if (windowDetails.windowType === WindowType.Write) {
            const writeWindowSettings: OpenWriteWindowSettings = {
              noteEditInfo: windowDetails.noteEditInfo || undefined,
              createSettings: { ...windowDetails.windowVisualDetails },
            };
            const window = await this.windowManager.openWriteWindow(
              writeWindowSettings
            );
            newFocusHistory.push(window.webContents.id);
          } else if (windowDetails.windowType === WindowType.Search) {
            const searchWindowSettings: OpenSearchWindowSettings = {
              query: "",
            };
            searchWindowSettings.query = openModeMemory.searchQuery;
            searchWindowSettings.createSettings = {
              ...windowDetails.windowVisualDetails,
            };
            const window = await this.windowManager.openSearchWindow(
              searchWindowSettings
            );
            newFocusHistory.push(window.webContents.id);
          }
        })
      );
    } else {
      await (async () => {
        const searchWindow = await this.windowManager.openSearchWindow();
        const writeWindow = await this.windowManager.openWriteWindow();

        newFocusHistory.push(searchWindow.webContents.id);
        newFocusHistory.push(writeWindow.webContents.id);
      })();
    }

    this.windowManager.setFocusHistory(newFocusHistory);
  }

  async switchToOpenModeThenWrite() {
    await this.switchToOpenMode();
    this.windowManager.focusOrCreateLastFocusedWriteWindow();
  }

  async switchToOpenModeThenSearch() {
    await this.switchToOpenMode();
    this.windowManager.focusOrCreateSearchWindow();
  }

  // Called before any other logic in switch functions
  _onModeSwitch(newMode: AppMode) {
    if (this.isSwitching) return false;
    this.isSwitching = true;

    const oldMode = this.appMode;
    const isSameMode = oldMode === newMode;

    if (oldMode === AppMode.OPEN) {
      if (!isSameMode) {
        this._openModeCleanup();
      }
    }
    this.isSwitching = false;
    return true;
  }

  /**
   * SECTION: Clean up functions are called when the app leaves a certain mode
   *
   * OPPORTUNITIES:
   * - Instead of individual closing functions, use closeAllWindows instead
   */

  _openModeCleanup() {
    // Save to memory
    this.memoryManager.saveOpenModeToMemory();

    // Close windows
    this.windowManager.closeAllWindows();
  }
}
