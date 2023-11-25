export type ValueOf<T> = T[keyof T];
export type KeyboardModifiersState = {
  metaKey: boolean;
};
export type Coordinates = { x: number; y: number };
export type Size = { width: number; height: number };
export type NoteEditInfo = {
  content: string;
  filepath: string;
  searcherIndex: number;
};
