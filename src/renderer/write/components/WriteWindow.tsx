import React, { useEffect, useRef, useState } from "react";
import styles from "./WriteWindow.module.scss";
import "@renderer/common/styles/global.scss";
import { SAVE_CHANGES_DELAY } from "../constants";
import WindowTitle from "@renderer/common/components/WindowTitle";
import { NoteEditInfo } from "@src/common/types";
import type { Editor } from "codemirror";
import NoteTakingForm from "./NoteTakingForm";

export default function WriteWindow() {
  const [writeVal, setWriteVal] = useState<string>("");
  const [noteEditInfo, setNoteEditInfo] = useState<NoteEditInfo | null>(null);

  const saveChangesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [shouldResetUndoHistory, setShouldResetUndoHistory] = useState(false);

  const [noteTakingFormInstance, setNoteTakingFormInstance] =
    useState<Editor | null>(null);

  useEffect(() => {
    window.writeElectronAPI.onNoteEditRequest((_event, noteToEdit) => {
      setNoteEditInfo(noteToEdit);
      setWriteVal(noteToEdit.content);
      setShouldResetUndoHistory(true);
    });
    return () => {
      window.writeElectronAPI.removeNoteEditRequestListener();
    };
  }, []);

  useEffect(() => {
    window.commonElectronAPI.onWindowFocusChange((_event, newFocus) => {
      if (newFocus) {
        noteTakingFormInstance?.focus();
      }
    });
    return () => {
      window.commonElectronAPI.removeWindowFocusChangeListener();
    };
  }, [noteTakingFormInstance]);

  useEffect(() => {
    window.writeElectronAPI.onResetWriteWindowRequest(() => {
      if (saveChangesTimerRef.current) {
        clearTimeout(saveChangesTimerRef.current);
        saveChanges(noteEditInfo, writeVal, false);
      }
      setNoteEditInfo(null);
      setWriteVal("");
      setShouldResetUndoHistory(true);
    });

    return () => {
      window.writeElectronAPI.removeResetWriteWindowRequestListener();
    };
  }, [writeVal, noteEditInfo]);

  useEffect(() => {
    if (shouldResetUndoHistory) {
      noteTakingFormInstance?.clearHistory();
      setShouldResetUndoHistory(false);
    }
  }, [shouldResetUndoHistory, noteTakingFormInstance]);

  function handleChange(newVal: string) {
    setWriteVal(newVal);
    // Don't save if new note and only whitespace
    // Kinda hacky, what if we just call delete here instead of
    // Having IPCHandler logic delete through edit?
    if (!noteEditInfo && !newVal.length) {
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
    writeVal = writeVal.trim(); // Trim to prevent whitespace

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
    saveChangesTimerRef.current = null;
  }

  function handleClose() {
    window.commonElectronAPI.closeCurrentWindow();
  }

  return (
    <div className={styles.bgContainer}>
      <div className={styles.container}>
        <WindowTitle windowTitle={"✏️ Jotter"} onClose={handleClose} />
        <NoteTakingForm
          writeVal={writeVal}
          onChange={handleChange}
          setNoteTakingInstance={setNoteTakingFormInstance}
          placeholder="New note..."
          noteTakingInstance={noteTakingFormInstance}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
