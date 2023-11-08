import { MAX_NOTE_TITLE_LENGTH } from "./constants";

export function getNoteTitleFromContent(content: string) {
  const firstLine = content
    .split("\n")[0]
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim();
  return firstLine.substring(0, MAX_NOTE_TITLE_LENGTH);
}
