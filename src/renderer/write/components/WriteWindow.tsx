import React, { useEffect, useRef, useState } from "react";
import styles from "./WriteWindow.module.scss";
import "@renderer/common/styles/global.scss";
import { COMMAND_PREFIXES, SAVE_CHANGES_DELAY } from "../constants";
import WindowTitle from "@renderer/common/components/WindowTitle";
import { NoteEditInfo } from "@renderer/common/types";

export default function WriteWindow() {
  const [writeVal, setWriteVal] = useState<string>("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const noteEditInfoRef = useRef<NoteEditInfo | null>(null);
  function setNoteEditInfo(newVal: NoteEditInfo | null) {
    noteEditInfoRef.current = newVal;
  }

  const saveChangesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    window.writeElectronAPI.onNoteEditRequest((_event, noteToEdit) => {
      setNoteEditInfo(noteToEdit);
      setWriteVal(noteToEdit.content);
    });
    textAreaRef.current?.focus();
  }, []);

  useEffect(() => {
    window.writeElectronAPI.onResetWriteWindowRequest(() => {
      if (saveChangesTimerRef.current) {
        clearTimeout(saveChangesTimerRef.current);
        saveChanges(noteEditInfoRef.current, writeVal, false);
      }
      setNoteEditInfo(null);
      setWriteVal("");
    });

    return () => {
      window.writeElectronAPI.removeResetWriteWindowRequestListener();
    };
  }, [writeVal]);

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
    writeVal: string,
    shouldUpdateCurrentNote: boolean = true
  ) {
    let newNoteEditInfo: NoteEditInfo | null = null;
    if (!noteEditInfo) {
      if (!writeVal) return;
      newNoteEditInfo = await window.writeElectronAPI.createNote(writeVal);
    } else {
      newNoteEditInfo = await window.writeElectronAPI.editNote({
        ...noteEditInfo,
        content: writeVal,
      });
    }

    if (shouldUpdateCurrentNote) setNoteEditInfo(newNoteEditInfo);
  }

  function handleClose() {
    window.commonElectronAPI.closeCurrentWindow();
  }

  return (
    <div className={styles.bgContainer}>
      <div className={styles.container}>
        <WindowTitle windowTitle={"✏️ Jotter"} onClose={handleClose} />
        <textarea
          className={styles.textArea}
          value={writeVal}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={"New note..."}
          ref={textAreaRef}
        />
      </div>
    </div>
  );
}
