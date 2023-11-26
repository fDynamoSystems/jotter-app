import React, { useEffect, useRef, useState } from "react";
import styles from "./WriteWindow.module.scss";
import "@renderer/common/styles/global.scss";
import { SAVE_CHANGES_DELAY } from "../constants";
import WindowTitle from "@renderer/common/components/WindowTitle";
import { NoteEditInfo } from "@src/common/types";

const TAB_CHARACTER = "\t";
export default function WriteWindow() {
  const [writeVal, setWriteVal] = useState<string>("");
  const [textData, setTextData] = useState<{
    caret: number;
    target: (EventTarget & HTMLTextAreaElement) | null;
  }>({ caret: -1, target: null }); // Store states for manipulations;

  const [noteEditInfo, setNoteEditInfo] = useState<NoteEditInfo | null>(null);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const saveChangesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    window.writeElectronAPI.onNoteEditRequest((_event, noteToEdit) => {
      setNoteEditInfo(noteToEdit);
      setWriteVal(noteToEdit.content);
    });
    window.commonElectronAPI.onWindowFocusChange((_event, newFocus) => {
      if (newFocus) {
        textAreaRef.current?.focus();
      }
    });
    textAreaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (textData.caret >= 0) {
      textData.target?.setSelectionRange(
        textData.caret + TAB_CHARACTER.length,
        textData.caret + TAB_CHARACTER.length
      );
    }
  }, [textData, writeVal]);

  useEffect(() => {
    window.writeElectronAPI.onResetWriteWindowRequest(() => {
      if (saveChangesTimerRef.current) {
        clearTimeout(saveChangesTimerRef.current);
        saveChanges(noteEditInfo, writeVal, false);
      }
      setNoteEditInfo(null);
      setWriteVal("");
    });

    return () => {
      window.writeElectronAPI.removeResetWriteWindowRequestListener();
    };
  }, [writeVal, noteEditInfo]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newVal = e.target.value;
    setWriteVal(newVal);
    setTextData({ caret: -1, target: e.target });

    // Don't save if new note and only whitespace
    if (!noteEditInfo && !newVal.trim().length) {
      return;
    }

    // Reset save changes timer
    if (saveChangesTimerRef.current) {
      clearTimeout(saveChangesTimerRef.current);
    }
    saveChangesTimerRef.current = setTimeout(
      () => saveChanges(noteEditInfo, newVal),
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const content = e.target.value;
    const caret = e.target.selectionStart;

    if (e.key === "Tab") {
      e.preventDefault();
      const newText =
        content.substring(0, caret) + TAB_CHARACTER + content.substring(caret);
      setWriteVal(newText);
      setTextData({ caret: caret, target: e.target });
    }
  }

  return (
    <div className={styles.bgContainer}>
      <div className={styles.container}>
        <WindowTitle windowTitle={"✏️ Jotter"} onClose={handleClose} />
        <textarea
          className={styles.textArea}
          value={writeVal}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          placeholder={"New note..."}
          ref={textAreaRef}
        />
      </div>
    </div>
  );
}
