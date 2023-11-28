import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { SearcherDoc } from "./services/SearcherService";
import { NOTE_FILE_EXTENSION, STARTER_NOTE } from "./common/constants";

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

  // If we add folders, we need to modify this function to call itself for folders
  readFolder(folderpath);

  // Add starter note
  if (!searcherDocs.length) {
    // Write note
    if (folderpath[folderpath.length - 1] !== "/") folderpath += "/";
    const filepath = folderpath + "Jotter welcome note.md";
    writeFileSync(filepath, STARTER_NOTE);
    const modifiedAt = statSync(filepath).mtime.getTime() / 1000;
    searcherDocs.push({
      content: STARTER_NOTE,
      filepath,
      modifiedAt,
      searcherIndex: searcherDocs.length,
    });
  }

  return {
    searcherDocs,
  };
}
