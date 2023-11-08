import { MatchIndex, QueryResultItem } from "@main/services/SearcherService";
import { ResultChunk, ResultDisplay } from "./types";

/*
processQueryResults

Takes in an array of QueryResultItem and processes them to a display ready ResultDisplay array
*/
export function processQueryResults(
  queryResults: QueryResultItem[]
): ResultDisplay[] {
  const resultDisplays: ResultDisplay[] = [];
  queryResults.forEach((resultItem) => {
    if (resultItem.notMatchQuery) {
      const resultDisplay = processNoMatchQueryResultItem(resultItem);
      resultDisplays.push(resultDisplay);
    } else {
      const chunks = chunkifyMatchedContent(
        resultItem.searcherDoc.content,
        resultItem.matchIndices
      );
      const resultDisplay = {
        searcherDoc: resultItem.searcherDoc,
        chunks,
      };
      if (chunks.length) resultDisplays.push(resultDisplay);
    }
  });
  return resultDisplays;
}

/*
chunkifyMatchedContent 

Takes in the entirety of a note and MatchedIndices and returns chunks.
Chunks are pieces of the note's contents that have been broken down for users to view easily.
Chunks are paragraphs, or pieces of a paragraph, that contain one or more matches. Paragraphs are defined as being separated by a new line.
Paragraphs are shortened depending on where the first match within the paragraph is and capped by a word limit.
*/

const MORE_MODIFIER = "...";
const FULL_NOTE_DISPLAY_STRING_MAX_LENGTH = 250;

function chunkifyMatchedContent(
  content: string,
  matchIndices: MatchIndex[]
): ResultChunk[] {
  // Split content into paragraphs
  const paragraphs = content.split(/\n+/);
  const finalChunks: ResultChunk[] = [];

  let paragraphScanIndex = 0;
  paragraphs.forEach((paragraph) => {
    if (!paragraph) return;

    // Get paragraphStart and end. Start is inclusive, end is not
    const paragraphStart = content.indexOf(paragraph, paragraphScanIndex);
    const paragraphEnd = paragraphStart + paragraph.length;
    paragraphScanIndex = paragraphEnd;

    // Find all the matches within a paragraph
    const paragraphMatches: MatchIndex[] = [];
    matchIndices.forEach((matchIndex) => {
      const [matchStart, matchEnd] = matchIndex;
      if (matchStart >= paragraphStart && matchEnd <= paragraphEnd) {
        // Normalize matches
        const newStart = matchStart - paragraphStart;
        const newEnd = matchEnd - paragraphStart;
        paragraphMatches.push([newStart, newEnd]);
      }
    });
    if (!paragraphMatches.length) return;

    /* 
    Go through matches and assign to chunks.
    We break paragraphs apart depending on their length compared to the first match within the paragraph. 
    */
    const chunks: ResultChunk[] = [];
    const chunkIndices: [number, number][] = [];
    const chunkStartModifiers: number[] = [];

    while (paragraphMatches.length) {
      const match = paragraphMatches.pop()!;
      const [matchStart, matchEnd] = match;

      const lastChunkIndices = chunkIndices.length
        ? chunkIndices[chunkIndices.length - 1]
        : [0, -1];
      const [lcStart, lcEnd] = lastChunkIndices;

      // If match cannot fit the last chunk, create new chunk
      if (matchStart < lcStart || matchEnd > lcEnd) {
        // Define the chunk window sizes
        const matchLength = matchEnd - matchStart;
        const preWindowSize = Math.ceil(
          (FULL_NOTE_DISPLAY_STRING_MAX_LENGTH - matchLength) / 2
        );
        const postWindowSize = Math.ceil(
          (FULL_NOTE_DISPLAY_STRING_MAX_LENGTH - matchLength) / 2
        );

        // Chunk indices relative to paragraph, i.e where the chunk is in the paragraph
        let chunkStart = matchStart - preWindowSize;
        // See if chunkStart will conflict with previous chunk
        if (lcEnd > chunkStart) chunkStart = lcEnd;

        let chunkEnd = matchEnd + postWindowSize;

        // Determine if there is more text in overall paragraph before or after the chunk
        let hasMoreTextBeforeStart = true;
        if (chunkStart <= 0) {
          hasMoreTextBeforeStart = false;
          chunkStart = 0;
        }

        let hasMoreTextAfterEnd = true;
        const paragraphEndIndex = paragraph.length;
        if (chunkEnd >= paragraphEndIndex) {
          hasMoreTextAfterEnd = false;
          chunkEnd = paragraphEndIndex;
        }

        // Substring out the chunk from the paragraph
        let chunkDisplayString = paragraph.substring(chunkStart, chunkEnd);
        let startModifier = 0; // In case we prepend the chunk, need to modify indices
        if (hasMoreTextBeforeStart) {
          chunkDisplayString = MORE_MODIFIER + chunkDisplayString;
          startModifier = MORE_MODIFIER.length;
        }
        if (hasMoreTextAfterEnd) chunkDisplayString += MORE_MODIFIER;

        const normalizedMatch: MatchIndex = [
          matchStart - chunkStart + startModifier,
          matchEnd - chunkStart + startModifier,
        ];
        chunks.push({
          displayString: chunkDisplayString,
          matchIndices: [normalizedMatch],
        });
        chunkIndices.push([chunkStart, chunkEnd]);
        chunkStartModifiers.push(startModifier);
      } else {
        const startModifier = chunkStartModifiers[chunks.length - 1];
        const normalizedMatch: MatchIndex = [
          matchStart - lcStart + startModifier,
          matchEnd - lcStart + startModifier,
        ];
        chunks[chunks.length - 1].matchIndices.push(normalizedMatch);
      }
    }
    chunks.forEach((chunk) => finalChunks.push(chunk));
  });

  return finalChunks;
}

function processNoMatchQueryResultItem(
  resultItem: QueryResultItem
): ResultDisplay {
  let displayString = resultItem.searcherDoc.content;
  if (displayString.length > FULL_NOTE_DISPLAY_STRING_MAX_LENGTH) {
    displayString =
      displayString
        .trimEnd()
        .substring(0, FULL_NOTE_DISPLAY_STRING_MAX_LENGTH) + MORE_MODIFIER;
  }

  return {
    searcherDoc: resultItem.searcherDoc,
    chunks: [{ displayString, matchIndices: [] }],
  };
}
