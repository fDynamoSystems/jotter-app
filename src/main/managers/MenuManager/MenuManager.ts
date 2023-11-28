import { KeyboardShortcuts } from "@src/common/constants";
import { app, Menu, shell } from "electron";
import defaultMenu from "electron-default-menu";
import BaseManager from "../BaseManager";

/*
MENU MANAGER handles app menus. Context menus are note in scope.
*/
export enum MenuName {
  "write",
  "search",
  "settings",
  "intro",
  "default",
}
export default class MenuManager extends BaseManager {
  private currentMenu: MenuName = MenuName.write;

  useMenu(menuName: MenuName) {
    let menu: Electron.MenuItemConstructorOptions[] = null!;
    switch (menuName) {
      case MenuName.write:
        menu = this.createWriteWindowMenu();
        break;
      case MenuName.search:
        menu = this.createSearchWindowMenu();
        break;
      case MenuName.settings:
        menu = this.createSettingsWindowMenu();
        break;
      case MenuName.intro:
        menu = this.createIntroWindowMenu();
        break;
      case MenuName.default:
        menu = this.createDefaultMenu();
        break;
      default:
        menu = this.createDefaultMenu();
        break;
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
    this.currentMenu = menuName;
  }

  getCurrentMenu() {
    return this.currentMenu;
  }

  createDefaultMenu() {
    const menu = defaultMenu(app, shell);
    menu[0] = {
      label: "first",
      submenu: [
        {
          label: "Write",
          accelerator: KeyboardShortcuts.WRITE_NOTE,
          click: () => this.windowManager.focusOrCreateLastFocusedWriteWindow(),
        },
        {
          label: "New note",
          accelerator: KeyboardShortcuts.NEW_NOTE,
          click: () => {
            this.windowManager.handleNewNote();
          },
        },
        {
          label: "New note window",
          accelerator: KeyboardShortcuts.NEW_NOTE_WINDOW,
          click: () => {
            this.windowManager.openWriteWindow({ immediatelyShow: true });
          },
        },
        { type: "separator" },
        {
          label: "Search notes",
          accelerator: KeyboardShortcuts.SEARCH_NOTES,
          click: () => this.windowManager.focusOrCreateSearchWindow(),
        },
        { type: "separator" },
        {
          label: "Close",
          accelerator: KeyboardShortcuts.CLOSE_APP,
          click: () => this.modeManager.switchToClosedMode(),
        },
        {
          label: "Quit",
          accelerator: KeyboardShortcuts.QUIT_APP,
          click: () => this.modeManager.switchToClosedMode(),
        },
      ],
    };

    // Remove unwanted items
    menu.splice(
      menu.findIndex((e) => e.label === "Help"),
      1
    );

    return menu;
  }

  createWriteWindowMenu() {
    const menu = this.createDefaultMenu();
    return menu;
  }

  createSearchWindowMenu() {
    const menu = this.createDefaultMenu();
    return menu;
  }

  createSettingsWindowMenu() {
    const menu = this.createDefaultMenu();
    return menu;
  }

  createIntroWindowMenu() {
    const menu = this.createDefaultMenu();
    const mainSubmenu = menu[0]
      .submenu as Electron.MenuItemConstructorOptions[];
    mainSubmenu.splice(0, 5);
    return menu;
  }
}
