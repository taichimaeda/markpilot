import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginSpec,
  PluginValue,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { completionStateField } from "./state";

class CompletionWidget extends WidgetType {
  constructor(private readonly completion: string) {
    super();
  }

  toDOM(view: EditorView) {
    const spanEl = document.createElement("span");
    spanEl.style.opacity = "0.5";
    spanEl.textContent = this.completion;
    return spanEl;
  }

  get lineBreaks() {
    return this.completion.split("\n").length - 1;
  }
}

class CompletionRenderPluginValue implements PluginValue {
  public decorations: DecorationSet = Decoration.none;

  update(update: ViewUpdate) {
    const { state } = update;

    const field = state.field(completionStateField);
    if (field === undefined) {
      this.decorations = Decoration.none;
      return;
    }

    const decoration = Decoration.widget({
      widget: new CompletionWidget(field.completion),
      side: 1,
    });
    this.decorations = Decoration.set([
      decoration.range(state.selection.main.head),
    ]);
  }
}

const completionRenderPluginSpec: PluginSpec<CompletionRenderPluginValue> = {
  decorations: (value: CompletionRenderPluginValue) => value.decorations,
};

export const completionRenderPlugin = ViewPlugin.fromClass(
  CompletionRenderPluginValue,
  completionRenderPluginSpec
);
