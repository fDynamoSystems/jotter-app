import BaseManager from "../BaseManager";
import SearcherService from "@main/services/SearcherService";
import { WindowType } from "../WindowManager/types";
import { SHOW_DELAY } from "@main/common/constants";
import { NoteEditInfo } from "@src/common/types";

/*
MODE MANAGER deals with the app's modes and works with other managers to show what is needed when modes change.
A mode is a configuration of windows. This idea was created when writing and editing / searching were separate modes.
*/
export enum AppMode {
  CLOSED,
  OPEN,
  SETTINGS,
  INTRO,
}

export type SwitchToOpenModeOptions = {
  searchAfterwards?: boolean;
  writeAfterwards?: boolean;
  newNoteAfterwards?: boolean;
};
export default class ModeManager extends BaseManager {
  private appMode: AppMode = AppMode.CLOSED;
  private modeHistory: AppMode[] = []; // Contains history of appModes up until current appMode (exclusive)
  private isSwitching: boolean = false;
  private searcherService: SearcherService;

  constructor(searcherService: SearcherService) {
    super();
    this.searcherService = searcherService;
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

    const showOrder: number[] = [];
    let lastFocusedWriteWindowWc: number | null = null;
    let searchWindowWc: number | null = null;
    const focusHistory = this.windowManager.getFocusHistoryWithoutDuplicates();

    focusHistory.forEach((wcId) => {
      const windowType = this.windowManager.getWcIdWindowType(wcId);
      if (windowType === WindowType.Search) {
        showOrder.push(wcId);
        searchWindowWc = wcId;
      } else if (windowType === WindowType.Write) {
        showOrder.push(wcId);
        lastFocusedWriteWindowWc = wcId;
      }
    });

    if (lastFocusedWriteWindowWc === null && searchWindowWc === null) {
      // Send most recent note to write window
      let noteEditInfo: NoteEditInfo | undefined = undefined;
      const mostRecentNote = this.searcherService.getMostRecentNote();
      if (mostRecentNote) {
        noteEditInfo =
          SearcherService.convertSearcherDocToNoteEditInfo(mostRecentNote);
      }

      // Open search and write windows
      const searchWindowPromise = this.windowManager.openSearchWindow();
      const writeWindowPromise = this.windowManager.openWriteWindow({
        noteEditInfo: noteEditInfo,
      });

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
        showOrder.push(wcId);
      });
    }

    // Handle options
    if (options) {
      if (options.newNoteAfterwards) {
        if (lastFocusedWriteWindowWc !== null) {
          const window = this.windowManager.getWindowByWc(
            lastFocusedWriteWindowWc
          );
          this.windowManager.resetWriteWindowContents(window);
        } else {
          const newWindow = await this.windowManager.openWriteWindow();
          lastFocusedWriteWindowWc = newWindow.webContents.id;
        }

        // Add to showOrder
        if (
          !showOrder.length ||
          (showOrder.length &&
            showOrder[showOrder.length - 1] !== lastFocusedWriteWindowWc)
        )
          showOrder.push(lastFocusedWriteWindowWc);
      } else if (options.writeAfterwards) {
        if (lastFocusedWriteWindowWc === null) {
          const newWriteWindow = await this.windowManager.openWriteWindow();
          lastFocusedWriteWindowWc = newWriteWindow.webContents.id;
        }

        // Add to showOrder
        if (
          !showOrder.length ||
          (showOrder.length &&
            showOrder[showOrder.length - 1] !== lastFocusedWriteWindowWc)
        )
          showOrder.push(lastFocusedWriteWindowWc);
      } else if (options.searchAfterwards) {
        if (searchWindowWc === null) {
          const newSearchWindow = await this.windowManager.openSearchWindow();
          searchWindowWc = newSearchWindow.webContents.id;
        }

        // Add to showOrder
        if (
          !showOrder.length ||
          (showOrder.length &&
            showOrder[showOrder.length - 1] !== searchWindowWc)
        )
          showOrder.push(searchWindowWc);
      }
    }

    // Show all windows
    await new Promise((resolve) =>
      setTimeout(() => {
        showOrder.forEach((wcId) => {
          this.windowManager.showWindowByWc(wcId, true);
        });
        resolve(true);
      }, SHOW_DELAY)
    );

    this.windowManager.setFocusHistory(showOrder);
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

  async switchToIntroMode() {
    const shouldContinue = this._onModeSwitch(AppMode.INTRO);
    if (!shouldContinue) return;

    await this.windowManager.openIntroWindow({ immediatelyShow: true });
  }

  // Called before any other logic in switch functions, returns boolean that denotes if logic should continue
  _onModeSwitch(newMode: AppMode) {
    if (this.isSwitching) return false;
    let shouldContinue = true;
    this.isSwitching = true;

    const oldMode = this.appMode;
    const isSameMode = oldMode === newMode;

    switch (oldMode) {
      case AppMode.OPEN:
        if (!isSameMode) {
          this._openModeCleanup();
        } else {
          shouldContinue = false;
        }
        break;
      case AppMode.SETTINGS:
        if (!isSameMode) {
          this._settingsModeCleanup();
        } else {
          shouldContinue = false;
        }
        break;
      case AppMode.INTRO:
        if (!isSameMode) {
          this._introModeCleanup();
        } else {
          shouldContinue = false;
        }
        break;
    }

    this.isSwitching = false;

    if (shouldContinue) {
      this.modeHistory.push(this.appMode);
      this.appMode = newMode;
    }
    return shouldContinue;
  }

  /**
   * SECTION: Clean up functions are called when the app leaves a certain mode
   *
   */

  _openModeCleanup() {
    this.windowManager.hideAllWindows();
  }

  _settingsModeCleanup() {
    this.windowManager.closeSettingsWindow();
  }
  _introModeCleanup() {
    this.windowManager.closeIntroWindow();
  }

  /**
   * SECTION: Ensure mode functions which sets app modes without calling other switching functionality.
   * These functions are DANGEROUS so use them sparingly
   */
  ensureOpenMode() {
    this.appMode = AppMode.OPEN;
  }

  /**
   * SECTION: Misc functions
   */
  // OPPORTUNITY: There must be a more elegant way to do this
  async shouldKeepInIntroMode(): Promise<boolean> {
    const notesFolderPath = await this.settingsManager.getNotesFolderPath();
    return !notesFolderPath;
  }

  getModeHistory() {
    return this.modeHistory;
  }
}
