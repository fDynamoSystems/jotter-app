import React, { useEffect, useRef, useState } from "react";
import styles from "./SearchWindow.module.scss";
import "@renderer/common/styles/global.scss";
import ResultsList from "./ResultsList";
import WindowTitle from "@renderer/common/components/WindowTitle";
import { ResultDisplay } from "../types";
import { processQueryResults } from "../helpers";
import { NoteEditInfo } from "@src/common/types";
import { QueryResultItem } from "@main/services/SearcherService";

const INITIAL_SELECT_INDEX = -1;
export default function SearchWindow() {
  const [queryVal, _setQueryVal] = useState<string>("");
  const queryValRef = useRef<string>("");
  function setQueryVal(newVal: string) {
    queryValRef.current = newVal;
    _setQueryVal(newVal);
  }

  const [resultDisplays, setResultDisplays] = useState<ResultDisplay[]>([]);

  const [selectIndex, setSelectIndex] = useState<number>(INITIAL_SELECT_INDEX); //Select search results using keyboard

  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.commonElectronAPI.onWindowFocusChange((_event, nowFocus) => {
      setIsWindowFocused(nowFocus);
    });

    window.searchElectronAPI.onRetriggerRequest((_event) => {
      queryAndSetResults();
    });

    window.searchElectronAPI.onSetQuery((_event, query) => {
      setQueryVal(query);
    });

    // Added to remove visual bug of search input being focused on launch
    setTimeout(() => {
      searchInputRef.current?.blur();
    }, 500);
  }, []);

  useEffect(() => {
    (async () => {
      await queryAndSetResults();
      setSelectIndex(INITIAL_SELECT_INDEX);
    })();
  }, [queryVal]);

  async function queryAndSetResults() {
    const currentQueryVal = queryValRef.current;
    let queryResults: QueryResultItem[] = [];
    // Perform query
    if (currentQueryVal) {
      queryResults = await window.searchElectronAPI.queryNotes(currentQueryVal);
    } else {
      // If no query, bring up recent notes
      queryResults = await window.searchElectronAPI.getRecentNotes();
    }

    const newResultDisplays = processQueryResults(queryResults);
    setResultDisplays(newResultDisplays);
  }

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown, selectIndex, resultDisplays]);

  function handleGlobalKeyDown(e: KeyboardEvent) {
    if (e.code.startsWith("Key") || e.code.startsWith("Digit")) {
      searchInputRef.current?.focus();
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        incrementSelectIndex(1);
        break;
      case "ArrowUp":
        incrementSelectIndex(-1);
        break;
      case "Enter":
        openNoteThroughKeyboard();
        break;
      case "Backspace":
        deleteNoteThroughKeyboard();
        break;
      default:
        break;
    }
  }

  async function openNoteThroughKeyboard() {
    if (selectIndex === INITIAL_SELECT_INDEX) return;
    const selectedResultDisplay = resultDisplays[selectIndex];
    const noteEditInfo: NoteEditInfo = {
      ...selectedResultDisplay.searcherDoc,
    };
    const modifiersState =
      await window.commonElectronAPI.getKeyboardModifiersState();

    if (modifiersState.metaKey)
      window.searchElectronAPI.openWriteWindowForNote(noteEditInfo);
    else window.searchElectronAPI.sendNoteForEdit(noteEditInfo);
  }

  async function deleteNoteThroughKeyboard() {
    if (selectIndex === INITIAL_SELECT_INDEX) return;
    const selectedResultDisplay = resultDisplays[selectIndex];
    const noteEditInfo: NoteEditInfo = {
      ...selectedResultDisplay.searcherDoc,
    };

    const didDeleteNote = await window.searchElectronAPI.confirmAndDeleteNote(
      noteEditInfo
    );
    if (didDeleteNote) {
      queryAndSetResults();
    }
  }

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.addEventListener(
        "keydown",
        handleSearchInputKeyDown
      );
    }
    return () => {
      if (searchInputRef.current)
        searchInputRef.current.removeEventListener(
          "keydown",
          handleSearchInputKeyDown
        );
    };
  }, [
    handleSearchInputKeyDown,
    searchInputRef.current,
    resultDisplays,
    selectIndex,
  ]);

  function handleSearchInputKeyDown(e: KeyboardEvent) {
    if (!queryValRef.current) {
      searchInputRef.current?.blur();
      return;
    }

    e.stopPropagation();
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (resultDisplays.length) {
          searchInputRef.current?.blur();
          setSelectIndex(0);
        }
        break;
      case "ArrowDown":
        // Check if we are at the end of the cursor
        if (
          queryValRef.current.length === searchInputRef.current?.selectionEnd
        ) {
          searchInputRef.current?.blur();
          incrementSelectIndex(1);
        }
        break;
      case "ArrowUp":
        if (searchInputRef.current?.selectionStart === 0) {
          searchInputRef.current?.blur();
          incrementSelectIndex(-1);
        }
        break;
      default:
        break;
    }
  }

  function incrementSelectIndex(increment: number) {
    if (!increment) return;
    setSelectIndex((currIndex) => {
      let newSelectIndex = currIndex + increment;
      const currResultsDisplaysLength = resultDisplays.length;
      if (currResultsDisplaysLength) {
        if (newSelectIndex < INITIAL_SELECT_INDEX)
          newSelectIndex = 0; // Give users ability to remove select by clicking up arrow
        else if (newSelectIndex >= currResultsDisplaysLength)
          newSelectIndex = currResultsDisplaysLength - 1;
      } else newSelectIndex = INITIAL_SELECT_INDEX;
      return newSelectIndex;
    });
  }

  function handleSearchChange(newVal: string) {
    setQueryVal(newVal);
  }

  function handleClose() {
    window.commonElectronAPI.closeCurrentWindow();
  }

  return (
    <div className={styles.bgContainer}>
      <div className={styles.container}>
        <WindowTitle windowTitle="🔎 Search notes" onClose={handleClose} />
        <div className={styles.searchInputContainer}>
          <input
            type="text"
            className={styles.searchInput}
            value={queryVal}
            onChange={(e) => handleSearchChange(e.target.value)}
            ref={searchInputRef}
            placeholder="Search..."
          />
        </div>
        <ResultsList
          items={resultDisplays}
          selectIndex={selectIndex}
          isWindowFocused={isWindowFocused}
        />
      </div>
    </div>
  );
}
