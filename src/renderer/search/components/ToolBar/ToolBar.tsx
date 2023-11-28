import React from "react";
import styles from "./ToolBar.module.scss";

type ToolBarProps = {
  className?: string;
};

export default function ToolBar(props: ToolBarProps) {
  function handleOpenSettings() {
    window.commonElectronAPI.openSettings();
  }

  async function handleOpenNotesFolder() {
    const openRes = await window.commonElectronAPI.openNotesFolderPath();
    if (!openRes.isError) window.commonElectronAPI.closeOverlay();
    // TODO: Handle errors
  }

  return (
    <div className={styles.container + ` ${props.className || ""}`}>
      <button className={styles.buttonIcon} onClick={handleOpenNotesFolder}>
        📁
      </button>
      <button className={styles.buttonIcon} onClick={handleOpenSettings}>
        ⚙️
      </button>
    </div>
  );
}
