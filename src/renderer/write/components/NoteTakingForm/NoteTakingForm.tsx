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
  placeholder?: string;
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
        "|",
        "ordered-list",
        "unordered-list",
        "|",
        "quote",
        "code",
        "|",
        "table",
      ],
      minHeight: "0", // Defines wrapping, defaults to 300px which is smaller than what we want
      status: ["words"], // Status bar at the bottom
    } as EasyMDE.Options;
  }, []);

  const getCmInstanceCallback = useCallback((editor: Editor) => {
    props.setNoteTakingInstance(editor);
  }, []);

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
      />
    </div>
  );
}
