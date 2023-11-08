import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { SearcherDoc } from "./services/SearcherService";
import { NOTE_FILE_EXTENSION } from "./common/constants";

export type ScanAllFilesResult = {
  searcherDocs: SearcherDoc[];
};

export function scanAllNoteFiles(folderpath: string): ScanAllFilesResult {
  const searcherDocs: SearcherDoc[] = [];
  const readFolder = (folderpath: string) => {
    readdirSync(folderpath, { withFileTypes: true }).forEach((file) => {
      const filepath = join(folderpath, file.name);
      if (!file.isDirectory()) {
        if (!filepath.endsWith(NOTE_FILE_EXTENSION)) return;
        const content = readFileSync(filepath).toString();

        const modifiedAt = statSync(filepath).mtime.getTime() / 1000;

        // Create searcher docs
        searcherDocs.push({
          content,
          filepath,
          modifiedAt,
          searcherIndex: searcherDocs.length,
        });
      }
    });
  };

  readFolder(folderpath);

  return {
    searcherDocs,
  };
}
