import BaseManager from "../BaseManager";

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
    this.appMode = AppMode.CLOSED;
    this.windowManager.closeAllWindows();
  }

  switchToWriteMode() {
    if (this.appMode === AppMode.WRITE) return;

    this.appMode = AppMode.WRITE;
    this.windowManager.closeAllWindows();
    this.windowManager.openUniqueWriteWindow();
  }

  switchToEditMode() {
    if (this.appMode === AppMode.EDIT) return;
    this.appMode = AppMode.EDIT;
    this.windowManager.closeAllWindows();
    this.windowManager.openSearchWindow();
  }
}
