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
    this._onModeSwitch();

    this.appMode = AppMode.CLOSED;
  }

  switchToWriteMode() {
    this._onModeSwitch();

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
    this._onModeSwitch();

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
  _onModeSwitch() {
    const oldMode = this.appMode;
    if (oldMode === AppMode.WRITE) {
      this._writeModeCleanup();
      return;
    }

    if (oldMode === AppMode.EDIT) {
      this._editModeCleanup();
      return;
    }
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
