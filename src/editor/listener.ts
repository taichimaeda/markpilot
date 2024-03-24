import { EditorView, ViewUpdate } from "@codemirror/view";
import { CompletionFetcher } from "./extension";
import { setCompletionEffect } from "./state";

function showCompletion(fetcher: CompletionFetcher) {
  let latestCompletionId = 0;

  return async (update: ViewUpdate) => {
    const { state, view } = update;

    // If the document hasn't changed or there is a selection, do nothing.
    if (!update.docChanged || !state.selection.main.empty) {
      return;
    }

    const currentCompletionId = ++latestCompletionId;
    const completion = await fetcher(state);
    // If there is a newer completion request, ignore the current one.
    if (currentCompletionId !== latestCompletionId) {
      return;
    }

    view.dispatch({
      effects: [setCompletionEffect.of({ completion })],
    });
  };
}

export const showCompletionOnUpdate = (fetcher: CompletionFetcher) =>
  EditorView.updateListener.of(showCompletion(fetcher));
