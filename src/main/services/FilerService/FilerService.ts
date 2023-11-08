import * as fs from "fs";
import * as path from "path";
import { NOTE_FILE_EXTENSION } from "../../common/constants";
import {
  getDuplicateSuffixForFile,
  removeDuplicateSuffixFromFilename,
} from "./helpers";
import { getNoteTitleFromContent } from "@src/common/helpers";

/*
FilerService is responsible for saving, modifying, and deleting notes in the disk.
*/

/*
NOTE: all filenames are names of a file WITHOUT extension and without full path. Just the file name.
TODO: Convert all to async
*/

export type FilerConstructorArgs = {
  notesFolderPath: string;
};
export default class FilerService {
  private notesFolderPath = "./";

  /*
  SECTION: Getters and setters
  */
  setNotesFolderPath(newPath: string) {
    this.notesFolderPath = newPath;
  }

  /*
 SECTION: Modify notes
 */
  createNote(
    content: string,
    options?: { title?: string; oldFilepath?: string }
  ) {
    const noteTitle =
      options && options.title
        ? options.title
        : getNoteTitleFromContent(content);
    const duplicateSuffix = getDuplicateSuffixForFile(
      this.notesFolderPath,
      noteTitle,
      NOTE_FILE_EXTENSION
    );

    const filename = noteTitle + duplicateSuffix + NOTE_FILE_EXTENSION;
    const filepath = path.join(this.notesFolderPath, filename);
    if (options?.oldFilepath) {
      fs.renameSync(options.oldFilepath, filepath);
    }
    fs.writeFileSync(filepath, content);

    return filepath;
  }

  editNote(oldFilepath: string, content: string) {
    // If old filepath invalid, create new note based on content
    if (!fs.existsSync(oldFilepath)) {
      return this.createNote(content);
    }

    // Get new title for content
    const newTitle = getNoteTitleFromContent(content);

    // Get old title without extension and duplicate suffix
    const oldFilename = path
      .basename(oldFilepath)
      .replace(NOTE_FILE_EXTENSION, "");
    const oldTitle = removeDuplicateSuffixFromFilename(oldFilename);

    let filepath = oldFilepath;
    // If titles are the same, we overwrite the file with content
    if (oldTitle === newTitle) {
      fs.writeFile(oldFilepath, content, () => null);
    }
    // If titles are different, the old file is renamed and rewritten
    else {
      filepath = this.createNote(content, { title: newTitle, oldFilepath });
    }

    return filepath;
  }

  deleteNote(filepath: string) {
    if (fs.existsSync(filepath)) fs.rmSync(filepath);
  }

  /*
  SECTION: Read notes
  */
  doesNoteExist(filepath: string) {
    return fs.existsSync(filepath);
  }
}
