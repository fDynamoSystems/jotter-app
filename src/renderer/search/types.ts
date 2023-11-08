import { MatchIndex, SearcherDoc } from "@main/services/SearcherService";

export type ResultChunk = {
  displayString: string;
  matchIndices: MatchIndex[];
};

export type ResultDisplay = {
  searcherDoc: SearcherDoc;
  chunks: ResultChunk[];
};
