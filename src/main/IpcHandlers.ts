import SearcherService from "./services/SearcherService";
import FilerService from "./services/FilerService";
import { IPC_MESSAGE } from "@src/common/constants";
import { BrowserWindow, Menu, dialog, shell, ipcMain } from "electron";
import { NoteEditInfo } from "@src/common/types";
import { ScanAllFilesResult, scanAllNoteFiles } from "./scanAllNoteFiles";
import WindowManager from "./managers/WindowManager";
import { ManagerList } from "./managers/BaseManager";
import ModeManager from "./managers/ModeManager";
import MenuManager from "./managers/MenuManager";
import TrayManager from "./managers/TrayManager";
import ElectronKeyboardManager from "./managers/ElectronKeyboardManager";
import SettingsManager from "./managers/SettingsManager";

export default class IpcHandlers {
  private searcherService: SearcherService;
  private filerService: FilerService;
  private windowManager: WindowManager;
  private trayManager: TrayManager;
  private menuManager: MenuManager;
  private modeManager: ModeManager;
  private electronKeyboardManager: ElectronKeyboardManager;
  private settingsManager: SettingsManager;

  constructor(
    searcher: SearcherService,
    filer: FilerService,
    managerList: ManagerList
  ) {
    this.searcherService = searcher;
    this.filerService = filer;
    this.windowManager = managerList[0];
    this.trayManager = managerList[1];
    this.menuManager = managerList[2];
    this.modeManager = managerList[3];
    this.electronKeyboardManager = managerList[4];
    this.settingsManager = managerList[5];

    // Two way handlers
    ipcMain.handle(IPC_MESSAGE.FROM_RENDERER.CREATE_NOTE, this.createNote);
    ipcMain.handle(IPC_MESSAGE.FROM_RENDERER.EDIT_NOTE, this.editNote);
    ipcMain.handle(IPC_MESSAGE.FROM_RENDERER.DELETE_NOTE, this.deleteNote);
    ipcMain.handle(IPC_MESSAGE.FROM_RENDERER.QUERY_NOTES, this.queryNotes);
    ipcMain.handle(
      IPC_MESSAGE.FROM_RENDERER.GET_RECENT_NOTES,
      this.getRecentNotes
    );
    ipcMain.handle(
      IPC_MESSAGE.FROM_RENDERER.GET_KEYBOARD_MODIFIERS_STATE,
      this.getKeyboardModifiersState
    );
    ipcMain.handle(
      IPC_MESSAGE.FROM_RENDERER.GET_NOTES_FOLDER_PATH,
      this.getNotesFolderPath
    );
    ipcMain.handle(
      IPC_MESSAGE.FROM_RENDERER.OPEN_DIALOG_NOTES_FOLDER_PATH,
      this.openDialogNotesFolderPath
    );
    ipcMain.handle(
      IPC_MESSAGE.FROM_RENDERER.CONFIRM_AND_DELETE_NOTE,
      this.confirmAndDeleteNote
    );
    ipcMain.handle(
      IPC_MESSAGE.FROM_RENDERER.OPEN_NOTES_FOLDER_PATH,
      this.openNotesFolderPath
    );

    // One way handlers
    ipcMain.on(IPC_MESSAGE.FROM_RENDERER.CLOSE_OVERLAY, this.closeOverlay);
    ipcMain.on(
      IPC_MESSAGE.FROM_RENDERER.FOCUS_SEARCH_WINDOW,
      this.focusSearchWindow
    );
    ipcMain.on(
      IPC_MESSAGE.FROM_RENDERER.FOCUS_WRITE_WINDOW,
      this.focusWriteWindow
    );
    ipcMain.on(
      IPC_MESSAGE.FROM_RENDERER.RETRIGGER_SEARCH,
      this.retriggerSearch
    );
    ipcMain.on(
      IPC_MESSAGE.FROM_RENDERER.SEND_NOTE_FOR_EDIT,
      this.sendNoteForEdit
    );
    ipcMain.on(
      IPC_MESSAGE.FROM_RENDERER.OPEN_WRITE_WINDOW_FOR_NOTE,
      this.openWriteWindowForNote
    );
    ipcMain.on(
      IPC_MESSAGE.FROM_RENDERER.INITIAL_SET_NOTES_FOLDER_PATH,
      this.initialSetNotesFolderPath
    );
    ipcMain.on(
      IPC_MESSAGE.FROM_RENDERER.SET_NOTES_FOLDER_PATH,
      this.setNotesFolderPath
    );
    ipcMain.on(IPC_MESSAGE.FROM_RENDERER.CLOSE_INTRO, this.closeIntroWindow);
    ipcMain.on(
      IPC_MESSAGE.FROM_RENDERER.CONTEXT_MENU_RESULT_ITEM,
      this.contextMenuResultItem
    );
    ipcMain.on(
      IPC_MESSAGE.FROM_RENDERER.CLOSE_CURRENT_WINDOW,
      this.closeCurrentWindow
    );
    ipcMain.on(IPC_MESSAGE.FROM_RENDERER.OPEN_SETTINGS, this.openSettings);
  }

  private createNote = (
    mainEvent: Electron.IpcMainInvokeEvent,
    noteVal: string
  ): NoteEditInfo => {
    // Add to disk
    const filepath = this.filerService.createNote(noteVal);

    // Add to searcher
    const searcherIndex = this.searcherService.createNote(noteVal, filepath)!;

    // Need to assign note windows
    const wcId = mainEvent.sender.id;
    this.windowManager.assignWriteWindowSearcherIndex(wcId, searcherIndex);

    // Trigger search results
    this.retriggerSearch();

    // TODO: Add a check if searcher index failed?

    return {
      content: noteVal,
      filepath,
      searcherIndex,
    };
  };

  private editNote = (
    _event: Electron.IpcMainInvokeEvent,
    noteEditInfo: NoteEditInfo
  ): NoteEditInfo | null => {
    const isNoContent = !noteEditInfo.content;

    // Delete if no content
    let toReturn: NoteEditInfo | null = null;
    if (isNoContent) {
      toReturn = this.deleteNote(_event, noteEditInfo);
    } else {
      // Edit in disk
      const newFilepath = this.filerService.editNote(
        noteEditInfo.filepath,
        noteEditInfo.content
      );

      // Edit in searcher
      this.searcherService.editNote({
        filepath: newFilepath,
        content: noteEditInfo.content,
        searcherIndex: noteEditInfo.searcherIndex,
      });

      toReturn = { ...noteEditInfo, filepath: newFilepath };
    }

    this.retriggerSearch();
    return toReturn;
  };

  /**
   * deleteNote is never called directly from renderer, maybe indirectly from an empty edit.
   * When that happens, the wcId gets disassociated but we don't need to close the window or
   * reset it since we can assume the window will be empty.
   *
   * If we want to implement some deleteNote feature straight from write window, will need
   * to keep the above in mind.
   *
   * @param mainEvent
   * @param noteEditInfo
   * @returns
   */
  private deleteNote = (
    mainEvent: Electron.IpcMainInvokeEvent,
    noteEditInfo: NoteEditInfo
  ) => {
    this.filerService.deleteNote(noteEditInfo.filepath);
    this.searcherService.deleteNote(noteEditInfo.searcherIndex);
    const wcId = mainEvent.sender.id;
    this.windowManager.revertWriteWindowSearcherIndexUsingWcId(wcId);

    return null;
  };

  private queryNotes = (_event: Electron.IpcMainInvokeEvent, query: string) => {
    return this.searcherService.search(query);
  };

  private closeOverlay = () => {
    this.modeManager.switchToClosedMode();
  };

  private getRecentNotes = () => {
    return this.searcherService.getRecentNotes();
  };

  private focusSearchWindow = (_event: Electron.IpcMainInvokeEvent) => {
    this.windowManager.focusSearchWindow();
  };
  private focusWriteWindow = (
    _event: Electron.IpcMainInvokeEvent,
    searcherIndex: number
  ) => {
    this.windowManager.focusWriteWindow(searcherIndex);
  };

  private retriggerSearch = () => {
    this.windowManager
      .getSearchWindow()
      ?.webContents.send(IPC_MESSAGE.FROM_MAIN.RETRIGGER_SEARCH);
  };

  private sendNoteForEdit = (
    _event: Electron.IpcMainInvokeEvent,
    noteEditInfo: NoteEditInfo
  ) => {
    // Check if a write window is already open
    const currWindow = this.windowManager.getWriteWindowFromSearcherIndex(
      noteEditInfo.searcherIndex
    );
    if (currWindow) {
      currWindow.focus();
      return;
    }

    const windowToSend = this.windowManager.getLastFocusedWriteWindow();
    if (windowToSend) {
      this.windowManager.assignWriteWindowSearcherIndex(
        windowToSend.webContents.id,
        noteEditInfo.searcherIndex
      );
      windowToSend.webContents.send(
        IPC_MESSAGE.FROM_MAIN.SEND_NOTE_FOR_EDIT,
        noteEditInfo
      );
      windowToSend.focus();
    } else {
      this.openWriteWindowForNote(_event, noteEditInfo);
    }
  };

  private openWriteWindowForNote = async (
    _event: Electron.IpcMainInvokeEvent,
    noteEditInfo: NoteEditInfo
  ) => {
    // Check if a write window is already open
    const currWindow = this.windowManager.getWriteWindowFromSearcherIndex(
      noteEditInfo.searcherIndex
    );
    if (currWindow) {
      currWindow.focus();
      return;
    }

    await this.windowManager.openWriteWindow({
      noteEditInfo,
      immediatelyShow: true,
    });
  };

  private getKeyboardModifiersState = (_event: Electron.IpcMainInvokeEvent) => {
    return this.electronKeyboardManager.getKeyboardModifiersState();
  };

  /**
   * initialSetNotesFolderPath is called by intro window.
   */
  private initialSetNotesFolderPath = async (
    _event: Electron.IpcMainInvokeEvent,
    newPath: string
  ) => {
    await this.setNotesFolderPath(_event, newPath);
  };

  /**
   * setNotesFolderPath is called by setting window in settings mode
   */
  private setNotesFolderPath = async (
    _event: Electron.IpcMainInvokeEvent,
    newPath: string
  ) => {
    const scanRes: ScanAllFilesResult = scanAllNoteFiles(newPath);
    const { searcherDocs } = scanRes;
    this.searcherService.setSearcherDocs(searcherDocs);
    this.filerService.setNotesFolderPath(newPath);

    await this.settingsManager.setNotesFolderPath(newPath);

    // Reset open mode
    this.windowManager.closeAllWindows();

    this.modeManager.switchToOpenMode();
  };

  private getNotesFolderPath = async (_event: Electron.IpcMainInvokeEvent) => {
    return await this.settingsManager.getNotesFolderPath();
  };

  private openDialogNotesFolderPath = async (
    _event: Electron.IpcMainInvokeEvent,
    windowName?: string
  ) => {
    let parentWindow = null;
    if (windowName == "settings") {
      parentWindow = this.windowManager.getSettingsWindow();
    } else if (windowName == "intro") {
      parentWindow = this.windowManager.getIntroWindow();
    }

    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ["openDirectory", "createDirectory"],
    };
    let dialogRes: Electron.OpenDialogReturnValue | null = null;
    if (parentWindow)
      dialogRes = await dialog.showOpenDialog(parentWindow, dialogOptions);
    else dialogRes = await dialog.showOpenDialog(dialogOptions);
    if (!dialogRes || dialogRes.canceled || !dialogRes.filePaths[0]) {
      return null;
    }
    return dialogRes.filePaths[0];
  };

  private closeIntroWindow = async () => {
    this.windowManager.getIntroWindow()?.close();
  };

  private confirmAndDeleteNote = async (
    _event: Electron.IpcMainInvokeEvent,
    noteEditInfo: NoteEditInfo
  ) => {
    const searchWindow = this.windowManager.getSearchWindow()!;
    const confirmRes = await dialog.showMessageBox(searchWindow, {
      message: "Are you sure you want to delete this note?",
      type: "warning",
      buttons: ["Yes", "No"],
    });
    const shouldDelete = confirmRes.response === 0;
    if (shouldDelete) {
      this.filerService.deleteNote(noteEditInfo.filepath);
      this.searcherService.deleteNote(noteEditInfo.searcherIndex);
      this.windowManager.closeAllWriteWindowsBySearcherIndex(
        noteEditInfo.searcherIndex
      );
    }

    this.windowManager.focusSearchWindow(); //Added to ensure app focuses on search window again
    return shouldDelete;
  };

  private contextMenuResultItem = (
    event: Electron.IpcMainInvokeEvent,
    noteEditInfo: NoteEditInfo
  ) => {
    this.windowManager.focusSearchWindow();
    const template = [
      {
        label: "Edit",
        click: () => {
          this.sendNoteForEdit(event, noteEditInfo);
        },
      },
      {
        label: "Delete",
        click: async () => {
          const didDelete = await this.confirmAndDeleteNote(
            event,
            noteEditInfo
          );
          if (didDelete)
            event.sender.send(IPC_MESSAGE.FROM_MAIN.RETRIGGER_SEARCH);
        },
      },
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender)! });
  };

  private closeCurrentWindow = () => {
    this.windowManager.closeCurrentWindow();
  };

  private openSettings = () => {
    this.modeManager.switchToSettingsMode();
  };

  private openNotesFolderPath = async () => {
    const pathToOpen = await this.settingsManager.getNotesFolderPath();
    let errorMsg = "";

    if (pathToOpen) {
      errorMsg = await shell.openPath(pathToOpen);
    } else {
      errorMsg = "Notes folder path is not set!";
    }

    return { isError: !!errorMsg, errorMsg };
  };
}
