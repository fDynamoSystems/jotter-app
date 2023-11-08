import React, { useEffect, useRef } from "react";
import styles from "./ResultsList.module.scss";
import { ResultDisplay, ResultChunk } from "@renderer/search/types";
import { NoteEditInfo } from "@renderer/common/types";

/*
Result list is the entire list
*/
type ResultsListProps = {
  items: ResultDisplay[];
  selectIndex: number;
  isWindowFocused: boolean;
};
export default function ResultsList(props: ResultsListProps) {
  const renderItems = () => {
    if (props.items.length) {
      return props.items.map((item, index) => {
        const isSelected = index === props.selectIndex;
        return (
          <ResultItem
            item={item}
            key={`res-${index}`}
            isSelected={isSelected}
            isWindowFocused={props.isWindowFocused}
          />
        );
      });
    }
  };
  return <div className={styles.container}>{renderItems()}</div>;
}

/*
Result items are groups of chunks to represent the display of one note
*/
type ResultItemProps = {
  item: ResultDisplay;
  isSelected: boolean;
  isWindowFocused: boolean;
};
const ResultItem = ({ item, isSelected, isWindowFocused }: ResultItemProps) => {
  const containerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll item into view if it is selected
    if (isSelected && containerDivRef.current) {
      // Check if item in viewport
      const rect = containerDivRef.current.getBoundingClientRect();

      const TOP_PADDING = 65; // Padding for elements above search
      const isVisible =
        rect.top >= TOP_PADDING &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight ||
            document.documentElement
              .clientHeight) /* or $(window).height() */ &&
        rect.right <=
          (window.innerWidth ||
            document.documentElement.clientWidth); /* or $(window).width() */

      if (!isVisible)
        containerDivRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isSelected]);

  const renderMatches = () => {
    if (item.chunks.length)
      return item.chunks.map((chunk, index) => {
        const itemInfo = { ...item, chunks: undefined };

        return (
          <ChunkDisplay
            key={`result-chunk-${index}`}
            itemInfo={itemInfo}
            chunk={chunk}
          />
        );
      });
  };

  return (
    <div
      className={`${styles.resultItem} ${
        isSelected ? styles.resultItemSelected : ""
      } ${isWindowFocused ? styles.resultItemWindowFocused : ""}`}
      ref={containerDivRef}
    >
      {renderMatches()}
    </div>
  );
};

/*
Chunks represent a section of a file
*/
type ChunkDisplayProps = {
  chunk: ResultChunk;
  itemInfo: Omit<ResultDisplay, "chunks">;
};

const ChunkDisplay = ({ chunk, itemInfo }: ChunkDisplayProps) => {
  const { displayString, matchIndices } = chunk;

  let lastEndIndex = 0;
  const elements: JSX.Element[] = [];

  // Sort matchedIndices by their start index for sequential traversal
  const sortedIndices = [...matchIndices].sort((a, b) => a[0] - b[0]);

  sortedIndices.forEach(([start, end], index) => {
    // Add the text before this match
    if (start > lastEndIndex) {
      elements.push(
        <span key={`unmatched-${index}`}>
          {displayString.substring(lastEndIndex, start)}
        </span>
      );
    }

    // Add the matched text
    elements.push(
      <span className={styles.chunkTextHighlight} key={`matched-${index}`}>
        {displayString.substring(start, end)}
      </span>
    );

    lastEndIndex = end;
  });

  // Add the remaining text after the last match
  elements.push(
    <span key="unmatched-last">{displayString.substring(lastEndIndex)}</span>
  );

  async function handleClick() {
    const { content, searcherIndex, filepath } = itemInfo.searcherDoc;
    const noteEditInfo: NoteEditInfo = {
      content,
      searcherIndex,
      filepath,
    };

    const modifiersState =
      await window.commonElectronAPI.getKeyboardModifiersState();

    if (modifiersState.metaKey)
      window.searchElectronAPI.openWriteWindowForNote(noteEditInfo);
    else window.searchElectronAPI.sendNoteForEdit(noteEditInfo);
  }

  function handleContextMenu() {
    const { content, searcherIndex, filepath } = itemInfo.searcherDoc;
    const noteEditInfo: NoteEditInfo = {
      content,
      searcherIndex,
      filepath,
    };
    window.searchElectronAPI.openContextMenuForResultItem(noteEditInfo);
  }

  return (
    <p
      onClick={handleClick}
      className={styles.chunkParagraph}
      onContextMenu={handleContextMenu}
    >
      {elements}
    </p>
  );
};
