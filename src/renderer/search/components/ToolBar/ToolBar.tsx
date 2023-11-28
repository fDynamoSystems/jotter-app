import React from "react";
import styles from "./ToolBar.module.scss";

type ToolBarProps = {
  className?: string;
};

export default function ToolBar(props: ToolBarProps) {
  function handleOpenNotesFolder() {
    console.warn("To implement");
  }

  function handleOpenSettings() {
    console.warn("To implement");
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
