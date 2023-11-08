/*
SearcherDoc defines the objects stored within fuse.js that is indexed for search.
*/
export type SearcherDoc = {
  content: string;
  filepath: string;
  modifiedAt: number;
  searcherIndex: number;
};

/*
QueryResultItem is the processed objects retrieved after a search by fuse.js.
They are already sorted as needed.
*/
export type QueryResultItem = {
  searcherDoc: SearcherDoc;
  matchIndices: MatchIndex[]; // All the indices for matched words from query. Sorted so that the last item is the closest match to the beginning.
  notMatchQuery?: boolean; // If set to true, the query was not for word matches so matches should be ignored when displaying
};

// RecentNotesIndex is a sorted array of searcher indices, sorted by modifiedAt for searcherDocs
export type RecentNotesIndex = { searcherIndex: number }[];

/* MatchIndex is a 2 length array, the first element is the start of a match, the second an end. Using this information, we can find out where in a string a match occurs.

The start index is inclusive, while the end is exclusive.
*/
export type MatchIndex = [number, number];
