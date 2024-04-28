import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import Markpilot from 'src/main';
import { CompletionsCancel, CompletionsForce } from './extension';
import { completionsStateField, unsetCompletionsEffect } from './state';

export function acceptCompletionsOnKeydown(
	force: CompletionsForce,
	plugin: Markpilot,
) {
	let lastCompletionsTime = 0;

	function run(view: EditorView) {
		const { state } = view;

		if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
			return false;
		}

		// If there are no completions displayed, do nothing.
		const completionsState = state.field(completionsStateField);
		if (completionsState === undefined) {
			return false;
		}

		// Hide the current completions first.
		view.dispatch({
			effects: [unsetCompletionsEffect.of(null)],
		});

		// Insert completions to the current cursor position.
		const head = state.selection.main.head;
		const newHead = head + completionsState.completions.length;

		view.dispatch({
			selection: {
				head: newHead,
				anchor: newHead,
			},
			changes: [
				state.changes({
					from: head,
					to: head,
					insert: completionsState.completions,
				}),
			],
		});

		// If the completions are triggered within 500ms, force the previous one.
		const previousCompletionsTime = lastCompletionsTime;
		const currentCompletionsTime = Date.now();
		lastCompletionsTime = Date.now();
		if (currentCompletionsTime - previousCompletionsTime < 500) {
			force();
			return true;
		}

		return true;
	}

	const key = plugin.settings.completions.acceptKey;
	return Prec.highest(keymap.of([{ key, run }]));
}

export function rejectCompletionsOnKeydown(
	cancel: CompletionsCancel,
	plugin: Markpilot,
) {
	const { settings } = plugin;

	function run(view: EditorView) {
		const { state } = view;

		if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
			return false;
		}

		// If there are no completions displayed, do nothing.
		const completionsState = state.field(completionsStateField);
		if (completionsState === undefined) {
			return false;
		}

		cancel();
		view.dispatch({
			effects: [unsetCompletionsEffect.of(null)],
		});
		return true;
	}

	const key = settings.completions.rejectKey;
	return Prec.highest(keymap.of([{ key, run }]));
}
