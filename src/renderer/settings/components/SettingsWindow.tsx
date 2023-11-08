import React, { useEffect, useState } from "react";
import styles from "./SettingsWindow.module.scss";
import "@renderer/common/styles/global.scss";
import WindowTitle from "@renderer/common/components/WindowTitle";
import StyledButton from "@renderer/common/components/StyledButton";

// Define a mapping of special keys

export default function SettingsWindow() {
  const [initialNotesFolderPath, setInitialNotesFolderPath] = useState<
    string | null
  >(null);
  const [notesFolderPath, setNotesFolderPath] = useState<string | null>(null);

  useEffect(() => {
    (async (_) => {
      window.settingsElectronAPI
        .getNotesFolderPath()
        .then((currNotesFolderPath) => {
          setInitialNotesFolderPath(currNotesFolderPath || "");
          setNotesFolderPath(currNotesFolderPath || "");
        });
    })();
  }, []);

  if (initialNotesFolderPath === null) return null;
  async function handleChangeNotesFolderRequest() {
    const newPath =
      await window.settingsElectronAPI.openDialogNotesFolderPath();
    if (newPath) {
      setNotesFolderPath(newPath);
    }
  }

  const renderFolderPathText = () => {
    const MAX_STRING_LENGTH = 50;
    const PREFIX = "...";

    if (notesFolderPath) {
      if (notesFolderPath.length > MAX_STRING_LENGTH) {
        return (
          PREFIX +
          notesFolderPath.substring(
            notesFolderPath.length - MAX_STRING_LENGTH - PREFIX.length
          )
        );
      }
      return notesFolderPath;
    }
    return "Select here";
  };

  async function handleSave() {
    window.settingsElectronAPI.setNotesFolderPath(notesFolderPath!);
    setInitialNotesFolderPath(notesFolderPath);
  }

  return (
    <div className={styles.bgContainer}>
      <div className={styles.container}>
        <WindowTitle windowTitle="⚙️ Settings" />
        <div className={styles.settingBlock}>
          <h1>Notes folder</h1>
          <p>Folder where your notes are stored</p>
          <div
            onClick={handleChangeNotesFolderRequest}
            className={styles.settingInput}
          >
            {renderFolderPathText()}
          </div>
        </div>
        <StyledButton
          disabled={notesFolderPath === initialNotesFolderPath}
          onClick={handleSave}
        >
          Save
        </StyledButton>
      </div>
    </div>
  );
}
