import { app, globalShortcut, powerMonitor } from "electron";
import IpcHandlers from "./IpcHandlers";
import FilerService from "./services/FilerService";
import SearcherService from "./services/SearcherService";
import { ScanAllFilesResult, scanAllNoteFiles } from "./scanAllNoteFiles";
import settings from "electron-settings";
import { APP_SETTINGS, KeyboardShortcuts } from "@src/common/constants";
import WindowManager from "./managers/WindowManager";
import TrayManager from "./managers/TrayManager";
import AutoLaunch from "auto-launch";

const autoLauncher = new AutoLaunch({
  name: "Jotter",
});

// Checking if autoLaunch is enabled, if not then enabling it.
autoLauncher
  .isEnabled()
  .then(function (isEnabled) {
    if (isEnabled) return;
    autoLauncher.enable();
  })
  .catch(function (err) {
    throw err;
  });

// Initialize settings
settings.configure({
  atomicSave: true,
  fileName: "jotter_settings.json",
  prettify: true,
  numSpaces: 2,
});

/* Constants */
const SHOW_DELAY = 50;

/* Window states */
const searcherService: SearcherService = new SearcherService();
const filerService: FilerService = new FilerService();
const windowManager: WindowManager = new WindowManager();
const trayManager: TrayManager = new TrayManager(windowManager, quitApp);

let enableQuit = false;

function quitApp() {
  enableQuit = true;
  windowManager.allowClosureOfAllWindows();
  app.quit();
}

/* APP LISTENERS */
powerMonitor.on("shutdown", () => {
  quitApp();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", (event) => {
  if (!enableQuit) {
    event.preventDefault();
    windowManager.hideAllWindows();
  }
});

/**
 * Initialize notes
 */

async function initializeNotes(notesFolderPath: string) {
  // Scan all files
  const scanRes: ScanAllFilesResult = scanAllNoteFiles(notesFolderPath);
  const { searcherDocs } = scanRes;

  // Start services
  searcherService.setSearcherDocs(searcherDocs);
  filerService.setNotesFolderPath(notesFolderPath);

  // Initialize windows
  await windowManager.initializeMainWindows();

  setTimeout(() => {
    windowManager.showAllWindows();
  }, SHOW_DELAY);
}

async function registerGlobalKeyboardShortcuts() {
  // Get settings
  let mainEntryShortcut = (await settings.get(
    APP_SETTINGS.MAIN_ENTRY_SHORTCUT
  )) as string;
  if (!mainEntryShortcut) {
    settings.set(
      APP_SETTINGS.MAIN_ENTRY_SHORTCUT,
      KeyboardShortcuts.MAIN_ENTRY
    );
    mainEntryShortcut = KeyboardShortcuts.MAIN_ENTRY;
  }

  globalShortcut.register(mainEntryShortcut, async () => {
    windowManager.handleMainEntry();
  });

  let searchEntryShortcut = (await settings.get(
    APP_SETTINGS.SEARCH_ENTRY_SHORTCUT
  )) as string;
  if (!searchEntryShortcut) {
    settings.set(
      APP_SETTINGS.SEARCH_ENTRY_SHORTCUT,
      KeyboardShortcuts.SEARCH_ENTRY
    );
    searchEntryShortcut = KeyboardShortcuts.SEARCH_ENTRY;
  }

  globalShortcut.register(searchEntryShortcut, async () => {
    windowManager.handleSearchEntry();
  });
}

app.whenReady().then(async () => {
  // Uncomment to test beginner CX
  // await settings.unset(APP_SETTINGS.NOTES_FOLDER_PATH);

  app.setName("Jotter");

  // Set up IPC Handlers
  new IpcHandlers(searcherService, filerService, windowManager);

  // Build tray
  await trayManager.initialize();

  const notesFolderPath = (await settings.get(
    APP_SETTINGS.NOTES_FOLDER_PATH
  )) as string;
  if (!notesFolderPath) {
    await windowManager.openIntroWindow();
  } else {
    initializeNotes(notesFolderPath);
  }

  registerGlobalKeyboardShortcuts();
});
