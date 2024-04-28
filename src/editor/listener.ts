import { EditorView, ViewUpdate } from '@codemirror/view';
import { Notice } from 'obsidian';
import Markpilot from 'src/main';
import { CompletionsFetcher } from './extension';
import { setCompletionsEffect, unsetCompletionsEffect } from './state';

function showCompletions(fetcher: CompletionsFetcher) {
  let lastHead = -1;
  let latestCompletionsId = 0;

  return async (update: ViewUpdate) => {
    const { state, view } = update;

    // TODO:
    // Stop re-fetching the completions when the suggestions match the typed text.

    // If the document has not changed and the head has not moved, keep the completions.
    const previousHead = lastHead;
    const currentHead = state.selection.main.head;
    lastHead = currentHead;
    if (!update.docChanged && currentHead === previousHead) {
      return;
    }

    // Hide the current completion first.
    view.dispatch({
      effects: [unsetCompletionsEffect.of(null)],
    });

    // If there are multiple or non-empty selection, skip showing the completions.
    if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
      return;
    }
    // If the suffix does not end with a punctuation or space, ignore.
    const head = state.selection.main.head;
    const char = state.sliceDoc(head, head + 1);
    if (char.length == 1 && !char.match(/^[\p{P}\s]/u)) {
      return;
    }
    // If the prefix is empty, ignore.
    // This helps prevent showing completions when opening a new document.
    const prefix = state.sliceDoc(0, head);
    const suffix = state.sliceDoc(head, length);
    if (prefix.trim() === '') {
      return;
    }

    const currentCompletionsId = ++latestCompletionsId;

    // Fetch completions from the server.
    const completions = await fetcher(prefix, suffix).catch((error) => {
      new Notice('Failed to fetch completions: ', error);
      return undefined;
    });
    // If fetch has failed, ignore and return.
    if (completions === undefined) {
      return;
    }

    // If there are newer completions request, ignore the current one.
    if (currentCompletionsId !== latestCompletionsId) {
      return;
    }

    view.dispatch({
      effects: [setCompletionsEffect.of({ completions: completions })],
    });
  };
}

export const showCompletionsOnUpdate = (
  fetcher: CompletionsFetcher,
  plugin: Markpilot,
) => EditorView.updateListener.of(showCompletions(fetcher));
