import BaseManager from "../BaseManager";
import { OpenWriteWindowSettings } from "../WindowManager/WindowManager";

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
        position: writeModeMemory.uniqueWriteWindowPosition || undefined,
        size: writeModeMemory.uniqueWriteWindowSize || undefined,
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
    this.windowManager.openSearchWindow();
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
   */
  _writeModeCleanup() {
    this.memoryManager.saveWriteModeToMemory();
    // NOTE: If we add more windows, close them here too
    this.windowManager.closeUniqueWriteWindow();
  }

  _editModeCleanup() {
    // TODO: Save to memory then close all windows for this
  }
}
