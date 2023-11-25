import SearcherService from "@main/services/SearcherService";
import BaseManager from "../BaseManager";
import { WindowVisualDetails } from "../WindowManager/types";
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
type WriteWindowDetailsInternal = {
  searcherIndex: number | null;
  windowVisualDetails: WindowVisualDetails;
};
type EditModeMemoryInternal = {
  writeWindowDetailsList: WriteWindowDetailsInternal[];
  searchWindowVisualDetails: WindowVisualDetails;
};
type WriteWindowDetailsExternal = {
  noteEditInfo: NoteEditInfo | null;
  windowVisualDetails: WindowVisualDetails;
};
type EditModeMemoryExternal = Omit<
  EditModeMemoryInternal,
  "writeWindowDetailsList"
> & {
  searchQuery: string;
  writeWindowDetailsList: WriteWindowDetailsExternal[];
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

    const { wcToWindowPositionMap, wcToWindowSizeMap, wcToSearcherIndexMap } =
      currentMaps;

    const searchWcId: number | null =
      this.windowManager.getSearchWindow()?.webContents.id || null;

    if (!searchWcId) return null; // TODO: Better error handling
    const [x, y] = wcToWindowPositionMap[searchWcId];
    const [width, height] = wcToWindowSizeMap[searchWcId];
    const searchWindowVisualDetails = {
      position: { x, y },
      size: { width, height },
    };

    const writeWindowFocusHistory =
      this.windowManager.getWriteWindowFocusHistory();

    const writeWindowDetailsList: WriteWindowDetailsInternal[] =
      writeWindowFocusHistory.map((wcId) => {
        const searcherIndex: number | null = wcToSearcherIndexMap[wcId];
        const [x, y] = wcToWindowPositionMap[wcId];
        const [width, height] = wcToWindowSizeMap[wcId];
        const toAdd: WriteWindowDetailsInternal = {
          searcherIndex,
          windowVisualDetails: {
            position: { x, y },
            size: { width, height },
          },
        };

        return toAdd;
      });

    this.editModeMemory = {
      searchWindowVisualDetails,
      writeWindowDetailsList,
    };
    return this.editModeMemory;
  }

  loadEditModeFromMemory(): EditModeMemoryExternal | null {
    if (this.editModeMemory) {
      const writeWindowDetailsList: WriteWindowDetailsExternal[] = [];

      // Convert searcher indices to note edit infos
      this.editModeMemory.writeWindowDetailsList.forEach((internalDetails) => {
        let noteEditInfo: NoteEditInfo | null = null;
        if (internalDetails.searcherIndex) {
          const rawNote = this.searcherService.getNote(
            internalDetails.searcherIndex
          );
          if (rawNote)
            noteEditInfo =
              SearcherService.convertSearcherDocToNoteEditInfo(rawNote);
        }

        const toAdd: WriteWindowDetailsExternal = {
          windowVisualDetails: internalDetails.windowVisualDetails,
          noteEditInfo,
        };
        writeWindowDetailsList.push(toAdd);
      });

      return {
        searchQuery: this.searchQuery,
        searchWindowVisualDetails:
          this.editModeMemory.searchWindowVisualDetails,
        writeWindowDetailsList,
      };
    }
    return null;
  }
}
