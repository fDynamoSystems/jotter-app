/*
Note edit info is both sent by search window to edit window to begin editing, and edit window to main process to finalize editing.
*/
export type NoteEditInfo = {
  content: string;
  filepath: string;
  searcherIndex: number;
};
