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
    const span = document.createElement("span");
    span.style.opacity = "0.5";
    span.textContent = this.completion;
    return span;
  }

  get lineBreaks() {
    return this.completion.split("\n").length - 1;
  }
}

class CompletionRenderPluginValue implements PluginValue {
  public decorations: DecorationSet = Decoration.none;

  constructor(view: EditorView) {}

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
