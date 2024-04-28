import {
	Decoration,
	DecorationSet,
	EditorView,
	PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from '@codemirror/view';
import { completionsStateField } from './state';

class CompletionsWidget extends WidgetType {
	constructor(private readonly completions: string) {
		super();
	}

	toDOM(view: EditorView) {
		const spanEl = document.createElement('span');
		spanEl.classList.add('markpilot-completions');
		spanEl.textContent = this.completions;
		return spanEl;
	}

	get lineBreaks() {
		return this.completions.split('\n').length - 1;
	}
}

class CompletionsRenderPluginValue implements PluginValue {
	public decorations: DecorationSet = Decoration.none;

	update(update: ViewUpdate) {
		const { state } = update;

		const completionsState = state.field(completionsStateField);
		if (completionsState === undefined) {
			this.decorations = Decoration.none;
			return;
		}

		const decoration = Decoration.widget({
			widget: new CompletionsWidget(completionsState.completions),
			side: 1,
		});
		this.decorations = Decoration.set([
			decoration.range(state.selection.main.head),
		]);
	}
}

const completionsRenderPluginSpec: PluginSpec<CompletionsRenderPluginValue> = {
	decorations: (value: CompletionsRenderPluginValue) => value.decorations,
};

export const completionsRenderPlugin = ViewPlugin.fromClass(
	CompletionsRenderPluginValue,
	completionsRenderPluginSpec,
);
