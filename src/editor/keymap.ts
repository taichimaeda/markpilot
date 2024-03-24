import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import {
  CompletionCancel,
  CompletionFetcher,
  CompletionForce,
} from "./extension";
import {
  completionStateField,
  setCompletionEffect,
  unsetCompletionEffect,
} from "./state";

export function triggerCompletionOnTab(
  fetcher: CompletionFetcher,
  force: CompletionForce,
) {
  let latestCompletionId = 0;
  let latestCompletionTime = 0;

  function run(view: EditorView) {
    const { state } = view;

    // If there is no completion displayed, do nothing.
    const field = state.field(completionStateField);
    if (field === undefined) {
      return false;
    }

    // Hide the current completion first.
    view.dispatch({
      effects: [unsetCompletionEffect.of(null)],
    });

    // Insert completion text to the current cursor position.
    view.dispatch({
      changes: [
        state.changes({
          from: state.selection.main.head,
          to: state.selection.main.head,
          insert: field.completion,
        }),
      ],
    });

    // If the completion is triggered within 500ms, force the previous one.
    const currentCompletionTime = Date.now();
    if (currentCompletionTime - latestCompletionTime < 500) {
      force();
      return true;
    }
    latestCompletionTime = Date.now();

    // Re-fetch the next completion in a callback.
    (async function () {
      const currentCompletionId = ++latestCompletionId;
      const completion = await fetcher(state);
      // If there is a newer completion request, ignore the current one.
      if (currentCompletionId !== latestCompletionId) {
        return;
      }

      view.dispatch({
        effects: [setCompletionEffect.of({ completion })],
      });
    })();

    return true;
  }

  return Prec.highest(keymap.of([{ key: "Tab", run }]));
}

export function dismissCompletionOnEscape(cancel: CompletionCancel) {
  function run(view: EditorView) {
    const { state } = view;

    // If there is no completion displayed, do nothing.
    const field = state.field(completionStateField);
    if (field === undefined) {
      return false;
    }

    cancel();
    view.dispatch({
      effects: [unsetCompletionEffect.of(null)],
    });
    return true;
  }

  return Prec.highest(keymap.of([{ key: "Escape", run }]));
}
