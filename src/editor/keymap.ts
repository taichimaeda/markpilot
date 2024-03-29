import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import Markpilot from "src/main";
import { CompletionCancel, CompletionForce } from "./extension";
import { completionStateField, unsetCompletionEffect } from "./state";

export function acceptCompletionOnKeydown(
  force: CompletionForce,
  plugin: Markpilot
) {
  let lastCompletionTime = 0;

  function run(view: EditorView) {
    const { state } = view;

    if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
      return false;
    }

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
    const head = state.selection.main.head;
    const newHead = head + field.completion.length;

    view.dispatch({
      selection: {
        head: newHead,
        anchor: newHead,
      },
      changes: [
        state.changes({
          from: head,
          to: head,
          insert: field.completion,
        }),
      ],
    });

    // If the completion is triggered within 500ms, force the previous one.
    const previousCompletionTime = lastCompletionTime;
    const currentCompletionTime = Date.now();
    lastCompletionTime = Date.now();
    if (currentCompletionTime - previousCompletionTime < 500) {
      force();
      return true;
    }

    return true;
  }

  const key = plugin.settings.completions.acceptKey;
  return Prec.highest(keymap.of([{ key, run }]));
}

export function rejectCompletionOnKeydown(
  cancel: CompletionCancel,
  plugin: Markpilot
) {
  function run(view: EditorView) {
    const { state } = view;

    if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
      return false;
    }

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

  const key = plugin.settings.completions.rejectKey;
  return Prec.highest(keymap.of([{ key, run }]));
}
