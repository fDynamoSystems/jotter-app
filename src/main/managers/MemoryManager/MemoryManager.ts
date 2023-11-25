import SearcherService from "@main/services/SearcherService";
import BaseManager from "../BaseManager";
import { WindowType, WindowVisualDetails } from "../WindowManager/types";
import { NoteEditInfo } from "@src/common/types";

/*
MEMORY MANAGER handles remembering window states when they get destroyed.
*/
// Write mode types
type WriteModeMemoryInternal = {
  uniqueWriteWindowSearcherIndex: number | null;
  uniqueWriteWindowVisualDetails: WindowVisualDetails;
};
type WriteModeMemoryExternal = Omit<
  WriteModeMemoryInternal,
  "uniqueWriteWindowSearcherIndex"
> & {
  uniqueWriteWindowNoteEditInfo: NoteEditInfo | null;
};

// Edit Mode types
type WindowDetailsInternal = {
  windowType: WindowType;
  windowVisualDetails: WindowVisualDetails;
  searcherIndex: number | null;
};
type WindowDetailsExternal = {
  windowType: WindowType;
  windowVisualDetails: WindowVisualDetails;
  noteEditInfo: NoteEditInfo | null;
};

type EditModeMemoryInternal = {
  windowDetailsList: WindowDetailsInternal[];
};

type EditModeMemoryExternal = Omit<
  EditModeMemoryInternal,
  "windowDetailsList"
> & {
  searchQuery: string;
  windowDetailsList: WindowDetailsExternal[];
};

export default class MemoryManager extends BaseManager {
  private searcherService: SearcherService;
  private writeModeMemory: WriteModeMemoryInternal | null = null;
  private editModeMemory: EditModeMemoryInternal | null = null;
  private searchQuery: string = "";

  constructor(searcherService: SearcherService) {
    super();
    this.searcherService = searcherService;
  }

  /**
   * SECTION: Write mode memory
   */
  saveWriteModeToMemory(): WriteModeMemoryInternal | null {
    const currentMaps = this.windowManager.getAllMaps();

    // Get wcId of unique window
    const wcId: number | null =
      this.windowManager.getUniqueWriteWindow()?.webContents.id || null;

    if (wcId === null) {
      // TODO: Better error handling
      return null;
    }

    // Create write window memory
    const { wcToWindowPositionMap, wcToWindowSizeMap, wcToSearcherIndexMap } =
      currentMaps;
    const [x, y] = wcToWindowPositionMap[wcId];
    const position = { x, y };

    const [width, height] = wcToWindowSizeMap[wcId];
    const size = { width, height };

    const searcherIndex = wcToSearcherIndexMap[wcId] || null;

    this.writeModeMemory = {
      uniqueWriteWindowVisualDetails: { position, size },
      uniqueWriteWindowSearcherIndex: searcherIndex,
    };

    return this.writeModeMemory;
  }

  loadWriteModeFromMemory(): WriteModeMemoryExternal | null {
    if (this.writeModeMemory) {
      let noteEditInfo: NoteEditInfo | null = null;
      if (this.writeModeMemory.uniqueWriteWindowSearcherIndex) {
        const rawNote = this.searcherService.getNote(
          this.writeModeMemory.uniqueWriteWindowSearcherIndex
        );
        if (rawNote)
          noteEditInfo =
            SearcherService.convertSearcherDocToNoteEditInfo(rawNote);
      }
      return {
        ...this.writeModeMemory,
        uniqueWriteWindowNoteEditInfo: noteEditInfo,
      };
    }
    return null;
  }

  /**
   * SECTION: Edit mode memory
   */

  saveSearchQuery(searchQuery: string) {
    this.searchQuery = searchQuery;
  }

  saveEditModeToMemory(): EditModeMemoryInternal | null {
    const currentMaps = this.windowManager.getAllMaps();

    const {
      wcToWindowPositionMap,
      wcToWindowSizeMap,
      wcToSearcherIndexMap,
      wcToWindowTypeMap,
    } = currentMaps;

    const focusHistory = this.windowManager.getCleanFocusHistory();

    const windowDetailsList: WindowDetailsInternal[] = focusHistory.map(
      (wcId) => {
        const windowType = wcToWindowTypeMap[wcId];
        const searcherIndex: number | null = wcToSearcherIndexMap[wcId] || null;
        const [x, y] = wcToWindowPositionMap[wcId];
        const [width, height] = wcToWindowSizeMap[wcId];
        const toAdd: WindowDetailsInternal = {
          windowType,
          searcherIndex,
          windowVisualDetails: {
            position: { x, y },
            size: { width, height },
          },
        };

        return toAdd;
      }
    );

    this.editModeMemory = {
      windowDetailsList,
    };
    return this.editModeMemory;
  }

  loadEditModeFromMemory(): EditModeMemoryExternal | null {
    if (this.editModeMemory) {
      const windowDetailsList: WindowDetailsExternal[] =
        this.editModeMemory.windowDetailsList.map((internalDetails) => {
          let noteEditInfo: NoteEditInfo | null = null;
          if (internalDetails.searcherIndex) {
            const rawNote = this.searcherService.getNote(
              internalDetails.searcherIndex
            );
            if (rawNote)
              noteEditInfo =
                SearcherService.convertSearcherDocToNoteEditInfo(rawNote);
          }

          const toAdd: WindowDetailsExternal = {
            windowType: internalDetails.windowType,
            windowVisualDetails: internalDetails.windowVisualDetails,
            noteEditInfo,
          };
          return toAdd;
        });

      return {
        searchQuery: this.searchQuery,
        windowDetailsList,
      };
    }
    return null;
  }
}
