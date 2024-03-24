import { StateEffect, StateField } from "@codemirror/state";

export const setCompletionEffect = StateEffect.define<{
  completion: string;
}>();

export const unsetCompletionEffect = StateEffect.define();

interface CompletionState {
  completion: string | undefined;
}

export const completionStateField = StateField.define<CompletionState>({
  create(state) {
    return { completion: "" };
  },
  update(value, transaction) {
    if (transaction.effects.length !== 1) {
      throw new Error("Unexpected number of effects");
    }

    const effect = transaction.effects[0];

    if (effect.is(setCompletionEffect)) {
      return { completion: effect.value.completion };
    }
    if (effect.is(unsetCompletionEffect)) {
      return { completion: undefined };
    }

    throw new Error("Unexpected effect");
  },
});
