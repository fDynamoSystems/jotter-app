import BaseManager from "../BaseManager";
import {
  OpenSearchWindowSettings,
  OpenWriteWindowSettings,
  WindowType,
} from "../WindowManager/types";

/*
MODE MANAGER deals with the app's modes and works with other managers to show what is needed when modes change.
*/
export enum AppMode {
  CLOSED,
  WRITE,
  EDIT,
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

  isAppInWriteMode() {
    return this.appMode === AppMode.WRITE;
  }

  isAppInEditMode() {
    return this.appMode === AppMode.EDIT;
  }

  /*
  Mode switching functions
  */
  switchToClosedMode() {
    const shouldContinue = this._onModeSwitch(AppMode.CLOSED);
    if (!shouldContinue) return;

    this.appMode = AppMode.CLOSED;
  }

  switchToWriteMode() {
    const shouldContinue = this._onModeSwitch(AppMode.WRITE);
    if (!shouldContinue) return;

    if (this.appMode === AppMode.WRITE) return;
    this.appMode = AppMode.WRITE;

    // Call memory and construct open window settings
    const writeModeMemory = this.memoryManager.loadWriteModeFromMemory();
    const openWriteWindowSettings: OpenWriteWindowSettings = {};
    if (writeModeMemory) {
      openWriteWindowSettings.createSettings = {
        ...writeModeMemory.uniqueWriteWindowVisualDetails,
      };
      openWriteWindowSettings.noteEditInfo =
        writeModeMemory.uniqueWriteWindowNoteEditInfo || undefined;
    }

    this.windowManager.openUniqueWriteWindow(openWriteWindowSettings);
  }

  switchToEditMode() {
    const shouldContinue = this._onModeSwitch(AppMode.EDIT);
    if (!shouldContinue) return;

    if (this.appMode === AppMode.EDIT) return;
    this.appMode = AppMode.EDIT;

    // Call memory load
    const editModeMemory = this.memoryManager.loadEditModeFromMemory();

    // Transform memory load to inputs for opening search window
    if (editModeMemory) {
      editModeMemory.windowDetailsList.forEach((windowDetails) => {
        if (windowDetails.windowType === WindowType.Write) {
          const writeWindowSettings: OpenWriteWindowSettings = {
            noteEditInfo: windowDetails.noteEditInfo || undefined,
            createSettings: { ...windowDetails.windowVisualDetails },
          };
          this.windowManager.openWriteWindowForNote(writeWindowSettings);
        } else if (windowDetails.windowType === WindowType.Search) {
          const searchWindowSettings: OpenSearchWindowSettings = {
            query: "",
          };
          searchWindowSettings.query = editModeMemory.searchQuery;
          searchWindowSettings.createSettings = {
            ...windowDetails.windowVisualDetails,
          };
          this.windowManager.openSearchWindow(searchWindowSettings);
        }
      });
    } else this.windowManager.openSearchWindow();
    // TODO: Show all at same time!
  }

  // Called before any other logic in switch functions
  _onModeSwitch(newMode: AppMode) {
    if (this.isSwitching) return false;
    this.isSwitching = true;

    const oldMode = this.appMode;
    const isSameMode = oldMode === newMode;

    if (oldMode === AppMode.WRITE) {
      if (!isSameMode) {
        this._writeModeCleanup();
      } else {
        this.windowManager.focusLastFocusedWindow();
      }
    } else if (oldMode === AppMode.EDIT) {
      if (!isSameMode) {
        this._editModeCleanup();
      } else {
        this.windowManager.focusLastFocusedWindow();
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
  _writeModeCleanup() {
    this.memoryManager.saveWriteModeToMemory();
    // NOTE: If we add more windows, close them here too
    this.windowManager.closeUniqueWriteWindow();
  }

  _editModeCleanup() {
    // Save to memory
    this.memoryManager.saveEditModeToMemory();

    // Close search window
    this.windowManager.closeSearchWindow();

    // Close other write windows
    this.windowManager.closeAllWriteWindows();
  }
}
