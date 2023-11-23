import { KeyboardShortcuts } from "@src/common/constants";
import { app, Menu, shell } from "electron";
import defaultMenu from "electron-default-menu";
import BaseManager from "../BaseManager";

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
          label: "New note",
          accelerator: KeyboardShortcuts.NEW_NOTE,
          click: () => this.windowManager.handleNewNote(),
        },
        {
          label: "Write note",
          accelerator: KeyboardShortcuts.WRITE_NOTE,
          click: () => this.windowManager.focusLastFocusedWriteWindow(),
        },
        { type: "separator" },
        {
          label: "Search notes",
          accelerator: KeyboardShortcuts.SEARCH_NOTES,
          click: () => this.windowManager.focusSearchWindow(),
        },
        { type: "separator" },
        {
          label: "Close",
          accelerator: KeyboardShortcuts.CLOSE_APP,
          click: () => this.windowManager.hideAllWindows(),
        },
        {
          label: "Quit",
          accelerator: KeyboardShortcuts.QUIT_APP,
          click: () => this.windowManager.hideAllWindows(),
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
    const mainSubmenu = menu[0]
      .submenu as Electron.MenuItemConstructorOptions[];
    mainSubmenu.splice(1, 1);
    return menu;
  }

  createSearchWindowMenu() {
    const menu = this.createDefaultMenu();
    const mainSubmenu = menu[0]
      .submenu as Electron.MenuItemConstructorOptions[];
    mainSubmenu.splice(2, 2);
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
