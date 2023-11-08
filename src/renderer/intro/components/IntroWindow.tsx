import React, { useState } from "react";
import styles from "./IntroWindow.module.scss";
import "@renderer/common/styles/global.scss";
import WindowTitle from "@renderer/common/components/WindowTitle";
import StyledButton from "@renderer/common/components/StyledButton";

export default function IntroWindow() {
  const [notesFolderPath, setNotesFolderPath] = useState<string | null>(null);

  async function handleChangeNotesFolderRequest() {
    const newPath = await window.introElectronAPI.openDialogNotesFolderPath();
    setNotesFolderPath(newPath || null);
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
    return "Select folder...";
  };

  async function handleConfirm() {
    if (!notesFolderPath) return;
    const success = await window.introElectronAPI.setNotesFolderPath(
      notesFolderPath
    );
    if (success) window.introElectronAPI.closeIntroWindow();
  }

  return (
    <div className={styles.bgContainer}>
      <div className={styles.container}>
        <WindowTitle windowTitle="Welcome to Jotter!" />
        <p>To start with, choose a folder to store your notes in.</p>
        <div
          onClick={handleChangeNotesFolderRequest}
          className={styles.settingInput}
        >
          {renderFolderPathText()}
        </div>
        <StyledButton
          onClick={handleConfirm}
          className={styles.confirmButton}
          disabled={!notesFolderPath}
        >
          Confirm
        </StyledButton>
      </div>
    </div>
  );
}
