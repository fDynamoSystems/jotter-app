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
import MenuManager from "./managers/MenuManager";
import ModeManager from "./managers/ModeManager";
import ElectronKeyboardManager from "./managers/ElectronKeyboardManager";
import { ManagerList } from "./managers/BaseManager";
import MemoryManager from "./managers/MemoryManager";
import SettingsManager from "./managers/SettingsManager";

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

/* Initialize services */
const searcherService: SearcherService = new SearcherService();
const filerService: FilerService = new FilerService();

/* Initialize managers */
const windowManager: WindowManager = new WindowManager();
const trayManager: TrayManager = new TrayManager(quitApp);
const menuManager: MenuManager = new MenuManager();
const modeManager: ModeManager = new ModeManager();
const electronKeyboardManager: ElectronKeyboardManager =
  new ElectronKeyboardManager();
const memoryManager: MemoryManager = new MemoryManager(searcherService);
const settingsManager: SettingsManager = new SettingsManager();
const managerList: ManagerList = [
  windowManager,
  trayManager,
  menuManager,
  modeManager,
  electronKeyboardManager,
  memoryManager,
  settingsManager,
];

managerList.forEach((manager) => {
  manager.injectManagers(managerList);
});

/* App states */
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
}

async function registerGlobalKeyboardShortcuts() {
  // Register write entry shortcut
  let openEntryShortcut = (await settings.get(
    APP_SETTINGS.OPEN_ENTRY_SHORTCUT
  )) as string;
  if (!openEntryShortcut) {
    settings.set(
      APP_SETTINGS.OPEN_ENTRY_SHORTCUT,
      KeyboardShortcuts.OPEN_ENTRY
    );
    openEntryShortcut = KeyboardShortcuts.OPEN_ENTRY;
  }

  globalShortcut.register(openEntryShortcut, async () => {
    if (modeManager.isAppInCloseMode()) modeManager.switchToOpenModeThenWrite();
    else windowManager.focusOrCreateLastFocusedWriteWindow();
  });

  // Register search entry shortcut
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
    if (modeManager.isAppInCloseMode())
      modeManager.switchToOpenModeThenSearch();
    else windowManager.focusOrCreateSearchWindow();
  });
}

app.whenReady().then(async () => {
  // Uncomment to test beginner CX
  // await settings.unset(APP_SETTINGS.NOTES_FOLDER_PATH);

  app.setName("Jotter");

  // Set up IPC Handlers
  new IpcHandlers(searcherService, filerService, managerList);

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
