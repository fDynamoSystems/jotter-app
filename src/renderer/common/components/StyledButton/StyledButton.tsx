import React from "react";
import styles from "./StyledButton.module.scss";

type StyledButtonProps = {
  onClick?: () => void;
  children: any;
  type?: "button" | "submit";
  danger?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function StyledButton(props: StyledButtonProps) {
  return (
    <button
      className={`${styles.button} ${props.danger ? styles.dangerButton : ""} ${
        props.disabled ? styles.disabledButton : ""
      } ${props.className || ""}`}
      type={props.type || "button"}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}
