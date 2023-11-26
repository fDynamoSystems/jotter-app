import { KeyboardShortcuts } from "@src/common/constants";
import BaseManager from "../BaseManager";
import settings from "electron-settings";

/*
SETTINGS MANAGER handles getting and setting app settings.
*/

const SETTINGS_PROPS = {
  NOTES_FOLDER_PATH: "notebookFolderPath",
  OPEN_ENTRY_SHORTCUT: "openEntryShortcut",
  SEARCH_ENTRY_SHORTCUT: "searchEntryShortcut",
};
export default class SettingsManager extends BaseManager {
  // Notes folder path
  async getNotesFolderPath(): Promise<string> {
    return (await settings.get(SETTINGS_PROPS.NOTES_FOLDER_PATH)) as string;
  }

  async setNotesFolderPath(newVal: string) {
    return await settings.set(SETTINGS_PROPS.NOTES_FOLDER_PATH, newVal);
  }

  // open entry shortcut
  async getOpenEntryShortcut(): Promise<string> {
    return (await settings.get(SETTINGS_PROPS.OPEN_ENTRY_SHORTCUT)) as string;
  }

  async setOpenEntryShortcut(newVal: string) {
    return await settings.set(SETTINGS_PROPS.OPEN_ENTRY_SHORTCUT, newVal);
  }

  async ensureOpenEntryShortcutIsInitialized() {
    const currVal = await this.getOpenEntryShortcut();
    if (!currVal) {
      const initialVal = KeyboardShortcuts.OPEN_ENTRY;
      await this.setOpenEntryShortcut(initialVal);
      return initialVal;
    }
    return currVal;
  }

  // search entry shortcut
  async getSearchEntryShortcut(): Promise<string> {
    return (await settings.get(SETTINGS_PROPS.SEARCH_ENTRY_SHORTCUT)) as string;
  }

  async setSearchEntryShortcut(newVal: string) {
    return await settings.set(SETTINGS_PROPS.SEARCH_ENTRY_SHORTCUT, newVal);
  }

  async ensureSearchEntryShortcutIsInitialized() {
    const currVal = await this.getSearchEntryShortcut();
    if (!currVal) {
      const initialVal = KeyboardShortcuts.SEARCH_ENTRY;
      await this.setSearchEntryShortcut(initialVal);
      return initialVal;
    }
    return currVal;
  }
}
