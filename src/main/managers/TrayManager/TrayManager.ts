import { Menu, MenuItem, Tray, app, nativeImage, shell } from "electron";
import { join } from "path";
import BaseManager from "../BaseManager";

/*
TRAY MANAGER deals with the application tray and its menu
*/
export default class TrayManager extends BaseManager {
  private quitApp: () => void;
  private tray!: Tray;

  constructor(quitApp: () => void) {
    super();
    this.quitApp = quitApp;
  }

  initialize() {
    // Initialize tray with icon
    const iconPath = join(__dirname, "static/iconTemplate.png");
    const icon = nativeImage.createFromPath(iconPath).resize({
      height: 16,
      width: 16,
    });
    icon.setTemplateImage(true);
    this.tray = new Tray(icon);

    // Define menu for tray
    const menu = new Menu();
    menu.append(
      new MenuItem({
        label: "Write",
        click: () => {
          this.modeManager.switchToOpenMode({ writeAfterwards: true });
        },
      })
    );
    menu.append(
      new MenuItem({
        label: "New note",
        click: () => {
          this.modeManager.switchToOpenMode({ newNoteAfterwards: true });
        },
      })
    );
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(
      new MenuItem({
        label: "Search notes",
        click: () => {
          this.modeManager.switchToOpenMode({ searchAfterwards: true });
        },
      })
    );
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(
      new MenuItem({
        label: "Settings",
        click: () => {
          this.modeManager.switchToSettingsMode();
        },
      })
    );
    menu.append(
      new MenuItem({
        label: "Open notes folder",
        click: async () => {
          const pathToOpen = await this.settingsManager.getNotesFolderPath();
          let errorMsg = "";

          if (pathToOpen) {
            errorMsg = await shell.openPath(pathToOpen);
          }

          if (errorMsg) {
            // TODO: Handle errors
          }
        },
      })
    );
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(
      new MenuItem({
        label: "Quit app completely",
        click: () => this.quitApp(),
      })
    );
    menu.append(
      new MenuItem({
        label: "Restart",
        click: () => {
          app.relaunch();
          this.quitApp();
        },
      })
    );
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(new MenuItem({ label: "Development", enabled: false }));
    menu.append(
      new MenuItem({
        label: "Open intro window",
        click: () => {
          this.modeManager.switchToIntroMode();
        },
      })
    );

    // Define listeners
    this.tray.on("click", async () => {
      // Intro behavior
      if (await this.modeManager.shouldKeepInIntroMode()) {
        if (this.modeManager.isAppInCloseMode())
          this.modeManager.switchToIntroMode();
        else {
          this.modeManager.switchToClosedMode();
        }

        return;
      }

      // Default behavior
      if (this.modeManager.isAppInCloseMode())
        this.modeManager.switchToOpenMode();
      else {
        this.modeManager.switchToClosedMode();
        this.tray.popUpContextMenu(menu);
      }
    });

    this.tray.on("right-click", async () => {
      // Intro behavior
      if (await this.modeManager.shouldKeepInIntroMode()) {
        return;
      }

      // Default behavior
      if (!this.modeManager.isAppInCloseMode())
        this.modeManager.switchToClosedMode();
      this.tray.popUpContextMenu(menu);
    });
  }

  getTrayBounds() {
    return this.tray.getBounds();
  }
}
