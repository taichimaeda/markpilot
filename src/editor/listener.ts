import { EditorState } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { Notice } from "obsidian";
import Markpilot from "src/main";
import { CompletionFetcher } from "./extension";
import { LanguageAlias, languagesAliases } from "./languages";
import { setCompletionEffect, unsetCompletionEffect } from "./state";

function showCompletion(fetcher: CompletionFetcher, plugin: Markpilot) {
  let lastHead = -1;
  let latestCompletionId = 0;

  return async (update: ViewUpdate) => {
    const { state, view } = update;

    // If the document has not changed and the head has not moved, keep the completion.
    const previousHead = lastHead;
    const currentHead = state.selection.main.head;
    lastHead = currentHead;
    if (!update.docChanged && currentHead === previousHead) {
      return;
    }

    // Hide the current completion first.
    view.dispatch({
      effects: [unsetCompletionEffect.of(null)],
    });

    // If there are multiple or non-empty selection, skip showing the completion.
    if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
      return;
    }

    // If the suffix does not end with a punctuation or space, ignore.
    const head = state.selection.main.head;
    const char = state.sliceDoc(head, head + 1);
    if (char.length == 1 && !char.match(/^[\p{P}\s]/u)) {
      return;
    }

    const currentCompletionId = ++latestCompletionId;

    // Get the completion context with code blocks taken into account.
    const { language, prefix, suffix } = getCompletionContext(state, plugin);
    // Fetch completion from the server.
    const completion = await fetcher(language, prefix, suffix).catch(
      (error) => {
        new Notice("Failed to fetch completion: ", error);
        return undefined;
      }
    );
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

// NOTE:
// This is a bare-bone implementation
// because I was unable to find a parser that outputs an AST
// with the information indicating where each node spans.
function getCompletionContext(state: EditorState, plugin: Markpilot) {
  const head = state.selection.main.head;
  const length = state.doc.length;
  const prefix = state.sliceDoc(0, head);
  const suffix = state.sliceDoc(head, length);

  const windowSize = plugin.settings.completions.windowSize;
  const context = {
    language: "markdown",
    prefix: prefix.slice(prefix.length - windowSize / 2, prefix.length),
    suffix: suffix.slice(0, windowSize / 2),
  };

  // Pattern for the code block delimiter e.g. ```python or ```
  let pattern;

  let prefixChars = 0;
  const prefixLines = prefix.split("\n").reverse();

  for (const [i, line] of prefixLines.entries()) {
    // Check if the line starts with a code block pattern.
    const parts = /^(```|````|~~~|~~~~)/.exec(line);
    if (parts !== null) {
      pattern = parts[1];

      // Check if the line ends with a language identifier.
      const language = line.slice(pattern.length).trim();
      if (language === "") {
        // Return default context as closing code block pattern is detected.
        return context;
      } else {
        // Otherwise update the context with the language and prefix.
        context.language =
          languagesAliases[language as LanguageAlias] || language.toLowerCase();
        context.prefix = prefix.slice(
          prefix.length - prefixChars,
          prefix.length
        );
        break;
      }
    } else if (i === prefixLines.length - 1) {
      // Return default context as no code block pattern is detected.
      return context;
    }
    prefixChars += line.length + 1;
  }

  let suffixChars = 0;
  const suffixLines = suffix.split("\n");

  for (const line of suffixLines) {
    // Check if the line ends with the code block pattern detected above.
    const parts = new RegExp(`^${pattern}\\s*$`).exec(line);
    if (parts !== null) {
      context.suffix = suffix.slice(0, suffixChars);
      break;
    }
    suffixChars += line.length + 1;
  }

  return context;
}

export const showCompletionOnUpdate = (
  fetcher: CompletionFetcher,
  plugin: Markpilot
) => EditorView.updateListener.of(showCompletion(fetcher, plugin));
