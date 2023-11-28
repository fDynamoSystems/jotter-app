import React from "react";
import styles from "./WindowTitle.module.scss";

type WindowTitleProps = {
  windowTitle: string;
  onClose?: () => void;
};

export default function WindowTitle(props: WindowTitleProps) {
  return (
    <div className={styles.container}>
      <div className={styles.title}>{props.windowTitle}</div>
      <div className={styles.rightContainer}>
        {!!props.onClose && (
          <button className={styles.buttonClose} onClick={props.onClose}>
            <div className={styles.iconClose}></div>
          </button>
        )}
      </div>
    </div>
  );
}
