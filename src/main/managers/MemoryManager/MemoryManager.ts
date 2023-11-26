import SearcherService from "@main/services/SearcherService";
import BaseManager from "../BaseManager";
import { WindowType, WindowVisualDetails } from "../WindowManager/types";
import { NoteEditInfo } from "@src/common/types";

/*
MEMORY MANAGER handles remembering window states when they get destroyed.
*/

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

type OpenModeMemoryInternal = {
  windowDetailsList: WindowDetailsInternal[];
};

type OpenModeMemoryExternal = Omit<
  OpenModeMemoryInternal,
  "windowDetailsList"
> & {
  searchQuery: string;
  windowDetailsList: WindowDetailsExternal[];
};

export default class MemoryManager extends BaseManager {
  private searcherService: SearcherService;
  private openModeMemory: OpenModeMemoryInternal | null = null;
  private searchQuery: string = "";

  constructor(searcherService: SearcherService) {
    super();
    this.searcherService = searcherService;
  }

  /**
   * SECTION: Open mode memory
   */

  saveSearchQuery(searchQuery: string) {
    this.searchQuery = searchQuery;
  }

  saveOpenModeToMemory(): OpenModeMemoryInternal | null {
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

    this.openModeMemory = {
      windowDetailsList,
    };
    return this.openModeMemory;
  }

  loadOpenModeFromMemory(): OpenModeMemoryExternal | null {
    if (this.openModeMemory) {
      const windowDetailsList: WindowDetailsExternal[] =
        this.openModeMemory.windowDetailsList.map((internalDetails) => {
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
