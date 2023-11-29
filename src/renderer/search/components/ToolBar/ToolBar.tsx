import React from "react";
import styles from "./ToolBar.module.scss";

type ToolBarProps = {
  className?: string;
};

export default function ToolBar(props: ToolBarProps) {
  function handleOpenSettings() {
    window.commonElectronAPI.openSettings();
  }

  return (
    <div className={styles.container + ` ${props.className || ""}`}>
      <button className={styles.buttonIcon} onClick={handleOpenSettings}>
        ⚙️
      </button>
    </div>
  );
}
