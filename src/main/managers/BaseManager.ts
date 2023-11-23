import MenuManager from "./MenuManager";
import TrayManager from "./TrayManager";
import WindowManager from "./WindowManager";

export default class BaseManager {
  protected isManagersInjected: boolean = false;
  protected windowManager!: WindowManager;
  protected trayManager!: TrayManager;
  protected menuManager!: MenuManager;

  injectManagers(
    windowManager: WindowManager,
    trayManager: TrayManager,
    menuManager: MenuManager
  ) {
    this.windowManager = windowManager;
    this.trayManager = trayManager;
    this.menuManager = menuManager;
    this.isManagersInjected = true;
  }
}
