import React from "react";
import styles from "./WindowTitle.module.scss";
import Close from "@mui/icons-material/Close";

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
            <Close className={styles.iconClose} />
          </button>
        )}
      </div>
    </div>
  );
}
