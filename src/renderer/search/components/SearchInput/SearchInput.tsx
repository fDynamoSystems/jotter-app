import React from "react";
import styles from "./SearchInput.module.scss";

type SearchInputProps = {
  queryVal: string;
  onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.Ref<HTMLInputElement>;
  placeholder?: string;
  className?: string;
  onClear: () => void;
};

export default function SearchInput(props: SearchInputProps) {
  return (
    <div className={styles.container + ` ${props.className}`}>
      <input
        type="text"
        className={styles.searchInput}
        value={props.queryVal}
        onChange={props.onQueryChange}
        ref={props.inputRef}
        placeholder={props.placeholder}
      />
      <button
        className={
          styles.buttonClear + ` ${!props.queryVal && styles.hideButtonClear}`
        }
        onClick={props.onClear}
      >
        <div className={styles.iconClear}></div>
      </button>
    </div>
  );
}
