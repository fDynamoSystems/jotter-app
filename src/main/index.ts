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
const managerList: [WindowManager, TrayManager, MenuManager, ModeManager] = [
  windowManager,
  trayManager,
  menuManager,
  modeManager,
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

  const SHOW_DELAY = 50;
  setTimeout(() => {
    modeManager.switchToClosedMode();
  }, SHOW_DELAY);
}

async function registerGlobalKeyboardShortcuts() {
  // Register write entry shortcut
  let writeEntryShortcut = (await settings.get(
    APP_SETTINGS.WRITE_ENTRY_SHORTCUT
  )) as string;
  if (!writeEntryShortcut) {
    settings.set(
      APP_SETTINGS.WRITE_ENTRY_SHORTCUT,
      KeyboardShortcuts.WRITE_ENTRY
    );
    writeEntryShortcut = KeyboardShortcuts.WRITE_ENTRY;
  }

  globalShortcut.register(writeEntryShortcut, async () => {
    modeManager.switchToWriteMode();
  });

  // Register edit entry shortcut
  let editEntryShortcut = (await settings.get(
    APP_SETTINGS.EDIT_ENTRY_SHORTCUT
  )) as string;
  if (!editEntryShortcut) {
    settings.set(
      APP_SETTINGS.EDIT_ENTRY_SHORTCUT,
      KeyboardShortcuts.EDIT_ENTRY
    );
    editEntryShortcut = KeyboardShortcuts.EDIT_ENTRY;
  }

  globalShortcut.register(editEntryShortcut, async () => {
    modeManager.switchToEditMode();
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
