import { Menu, MenuItem, Tray, app, nativeImage } from "electron";
import { join } from "path";
import BaseManager from "../BaseManager";

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
        label: "Show",
        click: () => this.windowManager.showAllWindows(),
      })
    );
    menu.append(
      new MenuItem({
        label: "Hide",
        click: () => this.windowManager.hideAllWindows(),
      })
    );
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(
      new MenuItem({
        label: "New note",
        click: () => {
          this.windowManager.showAllWindows();
          this.windowManager.handleNewNote();
        },
      })
    );
    menu.append(
      new MenuItem({
        label: "Search notes",
        click: () => this.windowManager.handleEditEntry(),
      })
    );
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(
      new MenuItem({
        label: "Open settings",
        click: () => {
          if (!this.windowManager.getIsAppShown()) {
            this.windowManager.showAllWindows();
          }
          this.windowManager.openSettingsWindow();
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
      if (this.windowManager.getIsAppShown()) {
        this.windowManager.hideAllWindows();
      } else {
        this.windowManager.showAllWindows();
      }
    });

    tray.on("right-click", () => {
      this.windowManager.hideAllWindows();
      tray.popUpContextMenu(menu);
    });

    return tray;
  }
}
