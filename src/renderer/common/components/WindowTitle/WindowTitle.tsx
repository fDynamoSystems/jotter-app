import React from "react";
import styles from "./WindowTitle.module.scss";

type WindowTitleProps = { className?: string; windowTitle: string };

export default function WindowTitle(props: WindowTitleProps) {
  return (
    <div
      className={`${styles.container} ${
        props.className ? props.className : ""
      }`}
    >
      <h1>{props.windowTitle}</h1>
    </div>
  );
}
