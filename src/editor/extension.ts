import { EditorState } from "@codemirror/state";
import { dismissCompletionOnEscape, triggerCompletionOnTab } from "./keymap";
import { showCompletionOnUpdate } from "./listener";
import { completionStateField } from "./state";
import { debounceAsyncFunc } from "./utils";
import { completionRenderPlugin } from "./view";

export type CompletionFetcher = (state: EditorState) => Promise<string>;
export type CompletionCancel = () => void;
export type CompletionForce = () => void;

export function inlineCompletionExtension() {
  const fetcher = async (state: EditorState) => {
    return "hello, world!";
  };
  const { debounced, cancel, force } = debounceAsyncFunc(fetcher, 500);

  return [
    completionStateField,
    completionRenderPlugin,
    showCompletionOnUpdate(debounced),
    triggerCompletionOnTab(debounced, force),
    dismissCompletionOnEscape(cancel),
  ];
}
