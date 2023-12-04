import React, { useCallback, useMemo } from "react";
import styles from "./NoteTakingForm.module.scss";
import SimpleMdeReact from "react-simplemde-editor";
import "./easymde.scss";
import EasyMDE from "easymde";
import type { Editor } from "codemirror";

type NoteTakingFormProps = {
  writeVal: string;
  onChange: (newVal: string) => void;
  setNoteTakingInstance: (newInstance: Editor | null) => void;
  noteTakingInstance: Editor | null;
  placeholder?: string;
  onClose: () => void;
};

export default function NoteTakingForm(props: NoteTakingFormProps) {
  const mdeOptions = useMemo(() => {
    return {
      autofocus: true,
      spellChecker: false,
      blockStyles: {
        bold: "__",
        italic: "_",
        code: "```",
      },
      unorderedListStyle: "-",
      toolbar: [
        "bold",
        "italic",
        "heading",
        "ordered-list",
        "unordered-list",
        "quote",
        "code",
      ],
      minHeight: "0", // Defines wrapping, defaults to 300px which is smaller than what we want
      status: [], // Status bar at the bottom
    } as EasyMDE.Options;
  }, []);

  const getCmInstanceCallback = useCallback((editor: Editor) => {
    props.setNoteTakingInstance(editor);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Need to override some easy mde handlers of keyboard shortcuts
    if (e.code === "Escape") {
      window.commonElectronAPI.closeOverlay();
    }
  }
  return (
    <div className={styles.formContainer}>
      {/*
      SimpleMDE and Easy MDE option links:
      https://github.com/RIP21/react-simplemde-editor/tree/master
      https://github.com/Ionaru/easy-markdown-editor/tree/master#configuration
      */}
      <SimpleMdeReact
        value={props.writeVal}
        onChange={props.onChange}
        placeholder={props.placeholder}
        options={mdeOptions}
        getCodemirrorInstance={getCmInstanceCallback}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
