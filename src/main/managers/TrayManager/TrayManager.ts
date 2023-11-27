import { Menu, MenuItem, Tray, app, nativeImage } from "electron";
import { join } from "path";
import BaseManager from "../BaseManager";

/*
TRAY MANAGER deals with the application tray and its menu
*/
export default class TrayManager extends BaseManager {
  private quitApp: () => void;

  constructor(quitApp: () => void) {
    super();
    this.quitApp = quitApp;
  }

  async initialize() {
    const iconPath = join(__dirname, "static/iconTemplate.png");
    const icon = nativeImage.createFromPath(iconPath).resize({
      height: 16,
      width: 16,
    });
    icon.setTemplateImage(true);

    const menu = new Menu();
    menu.append(
      new MenuItem({
        label: "New note",
        click: () => {
          this.modeManager.switchToOpenModeThenWrite();
        },
      })
    );
    menu.append(
      new MenuItem({
        label: "Search notes",
        click: () => {
          this.modeManager.switchToOpenModeThenSearch();
        },
      })
    );
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(
      new MenuItem({
        label: "Open settings",
        click: () => {
          this.modeManager.switchToSettingsMode();
        },
      })
    );
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(
      new MenuItem({
        label: "Restart",
        click: () => {
          app.relaunch();
          this.quitApp();
        },
      })
    );
    menu.append(
      new MenuItem({
        label: "Quit app completely",
        click: () => this.quitApp(),
      })
    );
    const tray = new Tray(icon);

    tray.on("click", () => {
      if (this.modeManager.isAppInCloseMode())
        this.modeManager.switchToOpenMode();
      else {
        this.modeManager.switchToClosedMode();
        tray.popUpContextMenu(menu);
      }
    });

    tray.on("right-click", () => {
      if (!this.modeManager.isAppInCloseMode())
        this.modeManager.switchToClosedMode();
      tray.popUpContextMenu(menu);
    });

    return tray;
  }
}
