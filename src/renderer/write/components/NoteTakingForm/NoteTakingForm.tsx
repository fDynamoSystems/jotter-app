import React from "react";
import styles from "./NoteTakingForm.module.scss";

type NoteTakingFormProps = {
  writeVal: string;
  onChange: (newVal: string) => void;
  placeholder?: string;
};

export default function NoteTakingForm(props: NoteTakingFormProps) {
  return (
    <div className={styles.formContainer}>
      <textarea
        className={styles.textArea}
        value={props.writeVal}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </div>
  );
}
