import ElectronKeyboardManager from "./ElectronKeyboardManager";
import MenuManager from "./MenuManager";
import ModeManager from "./ModeManager";
import SettingsManager from "./SettingsManager";
import TrayManager from "./TrayManager";
import WindowManager from "./WindowManager";

export type ManagerList = [
  WindowManager,
  TrayManager,
  MenuManager,
  ModeManager,
  ElectronKeyboardManager,
  SettingsManager
];
export default class BaseManager {
  protected isManagersInjected: boolean = false;
  protected windowManager!: WindowManager;
  protected trayManager!: TrayManager;
  protected menuManager!: MenuManager;
  protected modeManager!: ModeManager;
  protected electronKeyboardManager!: ElectronKeyboardManager;
  protected settingsManager!: SettingsManager;

  injectManagers(managerList: ManagerList) {
    this.windowManager = managerList[0];
    this.trayManager = managerList[1];
    this.menuManager = managerList[2];
    this.modeManager = managerList[3];
    this.electronKeyboardManager = managerList[4];
    this.settingsManager = managerList[5];
    this.isManagersInjected = true;
  }
}
