import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import ObsidianCopilot from "src/main";
import { App } from "./App";

export const CHAT_VIEW_TYPE = "obsidian-copilot-chat-view";

export class ChatView extends ItemView {
  private root: Root;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: ObsidianCopilot
  ) {
    super(leaf);
  }

  getViewType() {
    return CHAT_VIEW_TYPE;
  }

  getDisplayText() {
    return "Obsidian Copilot";
  }

  getIcon() {
    // Using icon from Lucide:
    // https://lucide.dev/icons/bot
    return "bot";
  }

  async onOpen() {
    const { containerEl } = this;

    containerEl.empty();
    this.root = createRoot(containerEl);
    this.root.render(
      <React.StrictMode>
        <App plugin={this.plugin} />
      </React.StrictMode>
    );
  }

  async onClose() {
    this.root.unmount();
  }
}
