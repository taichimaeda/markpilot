import { EditorView, ViewUpdate } from "@codemirror/view";
import { CompletionFetcher } from "./extension";
import { setCompletionEffect, unsetCompletionEffect } from "./state";

function showCompletion(fetcher: CompletionFetcher) {
  let latestCompletionId = 0;

  return async (update: ViewUpdate) => {
    const { state, view } = update;

    // If the document hasn't changed or there is a selection, do nothing.
    if (
      !update.docChanged ||
      state.selection.ranges.length > 1 ||
      !state.selection.main.empty
    ) {
      return;
    }

    view.dispatch({
      effects: [unsetCompletionEffect.of(null)],
    });

    const currentCompletionId = ++latestCompletionId;
    const completion = await fetcher(state).catch((error) => {
      console.error("Failed to fetch completion: ", error);
      return undefined;
    });
    // if completion has failed, ignore and return.
    if (completion === undefined) {
      return;
    }
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
