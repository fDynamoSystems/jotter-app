import { MatchIndex } from "./types";

export function createExtendedQueryFromString(
  rawQueryString: string
): [string[], string] {
  const queryComponents = rawQueryString.split(" ").filter((word) => !!word);
  const formattedSplit = queryComponents.map((word) => `'"${word}"`);
  const extendedQuery = formattedSplit.join(" | ");
  return [queryComponents, extendedQuery];
}

export function findAllMatches(
  fullString: string,
  components: string[]
): { numUniqueMatches: number; matchIndices: MatchIndex[] } {
  let matchIndices: MatchIndex[] = [];
  fullString = fullString.toLowerCase();

  let numUniqueMatches = 0;
  components.forEach((component) => {
    component = component.toLowerCase();
    let currentIndex: number = fullString.indexOf(component);

    if (currentIndex !== -1) numUniqueMatches += 1;
    while (currentIndex !== -1) {
      matchIndices.push([currentIndex, currentIndex + component.length]);
      currentIndex = fullString.indexOf(
        component,
        currentIndex + component.length
      );
    }
  });

  if (matchIndices.length > 1) {
    matchIndices.sort((a, b) => a[0] - b[0]);

    // Remove conflicting matchIndices
    const mergedMatchIndices: MatchIndex[] = [matchIndices[0]];

    for (let i = 1; i < matchIndices.length; i++) {
      const currentMatch = matchIndices[i];
      const lastMergedMatch = mergedMatchIndices[0];

      if (currentMatch[0] <= lastMergedMatch[1]) {
        // Matches overlap, merge them
        lastMergedMatch[1] = Math.max(lastMergedMatch[1], currentMatch[1]);
      } else {
        // Matches don't overlap, add the current match to the merged list
        mergedMatchIndices.unshift(currentMatch);
      }
    }

    matchIndices = mergedMatchIndices;
  }

  return {
    matchIndices,
    numUniqueMatches,
  };
}
