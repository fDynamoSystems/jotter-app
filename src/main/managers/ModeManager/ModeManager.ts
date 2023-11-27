import { SHOW_DELAY } from "@main/common/constants";
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
  SETTINGS,
}

export type SwitchToOpenModeOptions = {
  searchAfterwards?: boolean;
  writeAfterwards?: boolean;
};
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

  isAppInSettingsMode() {
    return this.appMode === AppMode.SETTINGS;
  }

  /*
  Mode switching functions
  */
  switchToClosedMode() {
    const shouldContinue = this._onModeSwitch(AppMode.CLOSED);
    if (!shouldContinue) return;
  }

  async switchToOpenMode(options?: SwitchToOpenModeOptions) {
    const shouldContinue = this._onModeSwitch(AppMode.OPEN);
    if (!shouldContinue) return;

    // Call memory load
    const openModeMemory = this.memoryManager.loadOpenModeFromMemory();

    // Transform memory load to inputs for opening search window
    const oldWcToNewWcMap: { [oldWcId: number]: number } = {}; // Relates all wcIds to new ones
    let rawNewFocusHistory: (number | null)[] = []; // Will replace focus history with new window references

    // Track these states incase we want to focus on one later
    let searchWindowWc: number | null = null;
    let lastFocusedWriteWindowWc: number | null = null;

    if (openModeMemory) {
      // Get focus order by creating all windows in order
      await Promise.all(
        openModeMemory.windowDetailsList.map(async (windowDetails) => {
          let oldWcId = null;
          let newWcId = null;

          if (windowDetails.windowType === WindowType.Write) {
            const writeWindowSettings: OpenWriteWindowSettings = {
              noteEditInfo: windowDetails.noteEditInfo || undefined,
              createSettings: { ...windowDetails.windowVisualDetails },
            };
            const window = await this.windowManager.openWriteWindow(
              writeWindowSettings
            );

            oldWcId = windowDetails.wcId;
            newWcId = window.webContents.id;
            lastFocusedWriteWindowWc = newWcId;
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

            oldWcId = windowDetails.wcId;
            newWcId = window.webContents.id;
            searchWindowWc = newWcId;
          }

          if (oldWcId !== null && newWcId !== null)
            oldWcToNewWcMap[oldWcId] = newWcId;
          return newWcId;
        })
      );

      // Get newFocusHistory using maps
      rawNewFocusHistory = openModeMemory.focusHistory.map(
        (oldWcId) => oldWcToNewWcMap[oldWcId] || null
      );
    } else {
      // When no memory, we open search and write windows only
      const searchWindowPromise = this.windowManager.openSearchWindow();
      const writeWindowPromise = this.windowManager.openWriteWindow();

      const parallelRes = {
        searchWindow: await searchWindowPromise,
        writeWindow: await writeWindowPromise,
      };

      const newIds = [
        parallelRes.searchWindow.webContents.id,
        parallelRes.writeWindow.webContents.id,
      ];
      searchWindowWc = newIds[0];
      lastFocusedWriteWindowWc = newIds[1];

      newIds.forEach((wcId) => {
        rawNewFocusHistory.push(wcId);
      });
    }

    // Handle options
    if (options) {
      if (options.searchAfterwards) {
        if (!searchWindowWc) {
          const newSearchWindow = await this.windowManager.openSearchWindow();
          searchWindowWc = newSearchWindow.webContents.id;
        }
        rawNewFocusHistory.push(searchWindowWc);
      } else if (options.writeAfterwards) {
        if (!lastFocusedWriteWindowWc) {
          const newWriteWindow = await this.windowManager.openWriteWindow();
          lastFocusedWriteWindowWc = newWriteWindow.webContents.id;
        }
        rawNewFocusHistory.push(lastFocusedWriteWindowWc);
      }
    }

    const finalNewFocusHistory: number[] = rawNewFocusHistory.filter(
      (wcId) => wcId !== null
    ) as number[];

    // Remove duplicates biasing later shows for show order
    const showOrder: number[] = [];
    for (let i = finalNewFocusHistory.length - 1; i >= 0; i--) {
      const wcId = finalNewFocusHistory[i];
      if (!showOrder.includes(wcId)) {
        showOrder.unshift(wcId);
      }
    }

    await new Promise((resolve) =>
      setTimeout(async () => {
        await Promise.all(
          showOrder.map(async (wcId) => {
            this.windowManager.showWindowByWc(wcId);
          })
        );
        resolve(true);
      }, SHOW_DELAY)
    );

    // Set focus history after all the shows to override focus history
    this.windowManager.setFocusHistory(finalNewFocusHistory);
  }

  async switchToOpenModeThenWrite() {
    await this.switchToOpenMode({ writeAfterwards: true });
  }

  async switchToOpenModeThenSearch() {
    await this.switchToOpenMode({ searchAfterwards: true });
  }

  async switchToSettingsMode() {
    const shouldContinue = this._onModeSwitch(AppMode.SETTINGS);
    if (!shouldContinue) return;

    // Get position based on tray
    const trayBounds = this.trayManager.getTrayBounds();
    const { x, y } = trayBounds;
    await this.windowManager.openSettingsWindow({
      immediatelyShow: true,
      createSettings: { position: { x, y } },
    });
  }

  // Called before any other logic in switch functions, returns boolean that denotes if logic should continue
  _onModeSwitch(newMode: AppMode) {
    if (this.isSwitching) return false;
    let shouldContinue = true;
    this.isSwitching = true;

    const oldMode = this.appMode;
    const isSameMode = oldMode === newMode;

    if (oldMode === AppMode.OPEN) {
      if (!isSameMode) {
        this._openModeCleanup();
      } else {
        shouldContinue = false;
      }
    } else if (oldMode === AppMode.SETTINGS) {
      if (!isSameMode) {
        this._closeWindowsCleanup();
      } else {
        shouldContinue = false;
      }
    }
    this.isSwitching = false;
    this.appMode = newMode;
    return shouldContinue;
  }

  /**
   * SECTION: Clean up functions are called when the app leaves a certain mode
   *
   */

  _openModeCleanup() {
    this.memoryManager.saveOpenModeToMemory();
    this.windowManager.closeAllWindows();
  }

  _closeWindowsCleanup() {
    this.windowManager.closeAllWindows();
  }

  /**
   * SECTION: Ensure mode functions which sets app modes without calling other switching functionality.
   * These functions are DANGEROUS so use them sparingly
   */
  ensureOpenMode() {
    this.appMode = AppMode.OPEN;
  }
}
