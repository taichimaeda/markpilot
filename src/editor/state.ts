import { StateEffect, StateField } from "@codemirror/state";

export const setCompletionEffect = StateEffect.define<{
  completion: string;
}>();

export const unsetCompletionEffect = StateEffect.define();

interface CompletionState {
  completion: string;
}

export const completionStateField = StateField.define<
  CompletionState | undefined
>({
  create(state) {
    return undefined;
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setCompletionEffect)) {
        return { completion: effect.value.completion };
      }
      if (effect.is(unsetCompletionEffect)) {
        return undefined;
      }
    }

    return value;
  },
});
