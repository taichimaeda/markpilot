import Markpilot from "src/main";
import { debounceAsyncFunc } from "../utils";
import { acceptCompletionOnKeydown, rejectCompletionOnKeydown } from "./keymap";
import { showCompletionOnUpdate } from "./listener";
import { completionStateField } from "./state";
import { completionRenderPlugin } from "./view";

export type CompletionFetcher = (
  language: string,
  prefix: string,
  suffix: string
) => Promise<string | undefined>;

export type CompletionCancel = () => void;
export type CompletionForce = () => void;

export function inlineCompletionExtension(
  fetcher: CompletionFetcher,
  plugin: Markpilot
) {
  const { debounced, cancel, force } = debounceAsyncFunc(fetcher, 500);

  return [
    completionStateField,
    completionRenderPlugin,
    showCompletionOnUpdate(debounced, plugin),
    acceptCompletionOnKeydown(force, plugin),
    rejectCompletionOnKeydown(cancel, plugin),
  ];
}
