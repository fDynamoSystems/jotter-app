import Fuse from "@custom_dependencies/fuse.js";
import { QueryResultItem, RecentNotesIndex, SearcherDoc } from "./types";
import { createExtendedQueryFromString, findAllMatches } from "./helpers";

/*
SearcherService is responsible for all querying / search related functionality in the app.
It is currently implemented mainly using fuse.js and this service acts as a wrapper for the app's purposes.
*/

export default class SearcherService {
  private searcherDocs: SearcherDoc[] = [];
  private fuseObj: Fuse<SearcherDoc> = new Fuse([]);
  private recentNotesIndex: RecentNotesIndex = [];

  /*
  SECTION: Getters and setters
  */
  setSearcherDocs(searcherDocs: SearcherDoc[]) {
    this.searcherDocs = searcherDocs;

    // Options
    const fuseOptions: Fuse.IFuseOptions<SearcherDoc> = {
      isCaseSensitive: false,
      includeScore: true,
      shouldSort: true,
      includeMatches: false,
      findAllMatches: true,
      // minMatchCharLength: 1,
      // location: 0,
      threshold: 0,
      distance: 0,
      useExtendedSearch: true,
      ignoreLocation: true,
      ignoreFieldNorm: true,
      // fieldNormWeight: 1,
      keys: ["content"],
    };

    // Initialize without index
    this.fuseObj = new Fuse(this.searcherDocs, fuseOptions);

    // Populate recent notes index
    this.recentNotesIndex = this.searcherDocs
      .map((doc) => {
        return { modifiedAt: doc.modifiedAt, searcherIndex: doc.searcherIndex };
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
      .map((item) => {
        return { searcherIndex: item.searcherIndex };
      });
  }

  /*
  SECTION: Modify notes
  */
  createNote(noteVal: string, filepath: string) {
    const timeCreated = Math.floor(new Date().getTime() / 1000);
    const newIndex = this.fuseObj.getDocsSize();
    this.fuseObj.add({
      content: noteVal,
      filepath,
      modifiedAt: timeCreated,
      searcherIndex: newIndex,
    });
    this.recentNotesIndex.unshift({
      searcherIndex: newIndex,
    });
    return newIndex;
  }

  editNote(
    newDoc: Pick<SearcherDoc, "searcherIndex" | "filepath" | "content">
  ) {
    const searcherIndex = newDoc.searcherIndex;
    const oldDoc = this.searcherDocs[searcherIndex];

    const newModifiedAt = Math.floor(new Date().getTime() / 1000);
    this.fuseObj.editAt(searcherIndex, {
      ...oldDoc,
      ...newDoc,
      modifiedAt: newModifiedAt,
    });

    this.recentNotesIndex.splice(
      this.recentNotesIndex.findIndex((e) => e.searcherIndex === searcherIndex),
      1
    );
    this.recentNotesIndex.unshift({ searcherIndex });
  }

  deleteNote(searcherIndex: number) {
    this.fuseObj.pseudoRemoveAt(searcherIndex);
    const idx = this.recentNotesIndex.findIndex(
      (e) => e.searcherIndex === searcherIndex
    );
    if (idx > -1) this.recentNotesIndex.splice(idx, 1);
  }

  /*
  SECTION: Search and retrieve notes
  */
  getRecentNotes(): QueryResultItem[] {
    return this.recentNotesIndex.map((item) => {
      const searcherDoc = this.searcherDocs[item.searcherIndex];
      return {
        searcherDoc,
        matchIndices: [],
        notMatchQuery: true,
      };
    });
  }

  search(query: string): QueryResultItem[] {
    const [queryComponents, extendedQuery] =
      createExtendedQueryFromString(query);
    const searchRes = this.fuseObj.search(extendedQuery);

    const results: QueryResultItem[] = searchRes
      .map((searchItem) => {
        const searcherDoc = searchItem.item;
        const { matchIndices, numUniqueMatches } = findAllMatches(
          searcherDoc.content,
          queryComponents
        );

        return {
          searcherDoc: searchItem.item,
          matchIndices,
          numUniqueMatches,
        };
      })
      .sort((a, b) => {
        // Current sorting algorithm relies on number of matches
        // If a has more matches than b, show a first
        if (a.numUniqueMatches > b.numUniqueMatches) {
          return -1;
        } else if (b.numUniqueMatches > a.numUniqueMatches) {
          return 1;
        }

        if (a.matchIndices.length > b.matchIndices.length) {
          return -1;
        } else if (b.matchIndices.length > a.matchIndices.length) {
          return 1;
        }

        // If they are equal, show the more recent doc
        if (a.searcherDoc.modifiedAt > b.searcherDoc.modifiedAt) {
          return -1;
        } else {
          return 1;
        }
      })
      .map((processedItem) => {
        return {
          searcherDoc: processedItem.searcherDoc,
          matchIndices: processedItem.matchIndices,
        };
      });

    return results;
  }
}
