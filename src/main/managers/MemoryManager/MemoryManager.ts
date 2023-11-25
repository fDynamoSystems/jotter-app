import SearcherService from "@main/services/SearcherService";
import BaseManager from "../BaseManager";
import { WindowType } from "../WindowManager/WindowManager";
import { NoteEditInfo } from "@src/common/types";

/*
MEMORY MANAGER handles remembering window states when they get destroyed.
*/
type WriteModeMemoryInternal = {
  uniqueWriteWindowPosition: number[] | null;
  uniqueWriteWindowSize: number[] | null;
  uniqueWriteWindowSearcherIndex: number | null;
};
type WriteModeMemoryExternal = {
  uniqueWriteWindowPosition: number[] | null;
  uniqueWriteWindowSize: number[] | null;
  uniqueWriteWindowNoteEditInfo: NoteEditInfo | null;
};

export default class MemoryManager extends BaseManager {
  private writeModeMemory: WriteModeMemoryInternal | null = null;
  private searcherService: SearcherService;

  constructor(searcherService: SearcherService) {
    super();
    this.searcherService = searcherService;
  }

  saveWriteModeToMemory() {
    const currentMaps = this.windowManager.getAllMaps();

    // Get wcId
    let oldWcId: number | null = null;
    Object.entries(currentMaps.wcToWindowTypeMap).forEach((entry) => {
      const [wc, windowType] = entry;
      if (windowType === WindowType.UniqueWrite) {
        oldWcId = parseInt(wc);
      }
    });

    if (oldWcId === null) {
      return null;
    }

    const { wcToWindowPositionMap, wcToWindowSizeMap, wcToSearcherIndexMap } =
      currentMaps;
    const position = wcToWindowPositionMap[oldWcId] || null;
    const size = wcToWindowSizeMap[oldWcId] || null;
    const searcherIndex = wcToSearcherIndexMap[oldWcId] || null;

    this.writeModeMemory = {
      uniqueWriteWindowPosition: position,
      uniqueWriteWindowSize: size,
      uniqueWriteWindowSearcherIndex: searcherIndex,
    };
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
}
