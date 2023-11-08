import React, { useEffect, useRef, useState } from "react";
import styles from "./WriteWindow.module.scss";
import "@renderer/common/styles/global.scss";
import { COMMAND_PREFIXES, SAVE_CHANGES_DELAY } from "../constants";
import NoteTakingForm from "@renderer/write/components/NoteTakingForm";
import WindowTitle from "@renderer/common/components/WindowTitle";
import { NoteEditInfo } from "@renderer/common/types";
import type { Editor } from "codemirror";
import { KeyboardShortcuts } from "@src/common/constants";
import { getNoteTitleFromContent } from "@src/common/helpers";

const DEFAULT_WINDOW_NAME = "✏️ Jotter";
export default function WriteWindow() {
  const [writeVal, setWriteVal] = useState<string>("");
  const noteEditInfoRef = useRef<NoteEditInfo | null>(null);
  function setNoteEditInfo(newVal: NoteEditInfo | null) {
    noteEditInfoRef.current = newVal;
  }

  const [noteTakingFormInstance, setNoteTakingFormInstance] =
    useState<Editor | null>(null);
  const saveChangesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    window.writeElectronAPI.onNoteEditRequest((_event, noteToEdit) => {
      if (noteToEdit) {
        setNoteEditInfo(noteToEdit);
        setWriteVal(noteToEdit.content);
      } else {
        setNoteEditInfo(null);
        setWriteVal("");
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown, noteTakingFormInstance]);

  function handleGlobalKeyDown(e: KeyboardEvent) {
    if (e.code.startsWith("Key") || e.code.startsWith("Digit")) {
      noteTakingFormInstance?.focus();
      return;
    }
    if (e.key === KeyboardShortcuts.CLOSE_APP) {
      window.commonElectronAPI.closeOverlay();
    }
  }

  function handleChange(newVal: string) {
    if (newVal.startsWith(COMMAND_PREFIXES.COMMAND_START)) {
      if (newVal.startsWith(COMMAND_PREFIXES.QUERYING)) {
        window.commonElectronAPI.focusSearchWindow();
        setWriteVal("");
        return;
      }
      setWriteVal(newVal);
      return;
    }

    setWriteVal(newVal);

    // Don't save if new note and only whitespace
    if (!noteEditInfoRef.current && !newVal.trim().length) {
      return;
    }

    // Reset save changes timer
    if (saveChangesTimerRef.current) {
      clearTimeout(saveChangesTimerRef.current);
    }
    saveChangesTimerRef.current = setTimeout(
      () => saveChanges(noteEditInfoRef.current, newVal),
      SAVE_CHANGES_DELAY
    );
  }

  async function saveChanges(
    noteEditInfo: NoteEditInfo | null,
    writeVal: string
  ) {
    let newNoteEditInfo: NoteEditInfo | null = null;
    if (!noteEditInfo) {
      newNoteEditInfo = await window.writeElectronAPI.createNote(writeVal);
    } else {
      newNoteEditInfo = await window.writeElectronAPI.editNote({
        ...noteEditInfo,
        content: writeVal,
      });
    }

    setNoteEditInfo(newNoteEditInfo);
  }

  const getWindowTitle = () => {
    if (writeVal.trim().length) {
      const MAX_NOTE_TITLE_LENGTH = 40;
      let title = getNoteTitleFromContent(writeVal);
      if (title.length > MAX_NOTE_TITLE_LENGTH) {
        title = title.substring(0, MAX_NOTE_TITLE_LENGTH) + "...";
      }
      return title;
    }

    return DEFAULT_WINDOW_NAME;
  };

  return (
    <div className={styles.bgContainer}>
      <div className={styles.container}>
        <WindowTitle windowTitle={getWindowTitle()} />
        <NoteTakingForm
          writeVal={writeVal}
          onChange={handleChange}
          setNoteTakingInstance={setNoteTakingFormInstance}
          placeholder="New note..."
        />
      </div>
    </div>
  );
}
