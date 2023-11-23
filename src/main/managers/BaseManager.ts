import MenuManager from "./MenuManager";
import ModeManager from "./ModeManager";
import TrayManager from "./TrayManager";
import WindowManager from "./WindowManager";

export type ManagerList = [
  WindowManager,
  TrayManager,
  MenuManager,
  ModeManager
];
export default class BaseManager {
  protected isManagersInjected: boolean = false;
  protected windowManager!: WindowManager;
  protected trayManager!: TrayManager;
  protected menuManager!: MenuManager;
  protected modeManager!: ModeManager;

  injectManagers(managerList: ManagerList) {
    this.windowManager = managerList[0];
    this.trayManager = managerList[1];
    this.menuManager = managerList[2];
    this.modeManager = managerList[3];
    this.isManagersInjected = true;
  }
}
