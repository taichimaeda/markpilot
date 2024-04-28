import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ChatMessage } from 'src/api';
import Markpilot from 'src/main';
import { App } from './App';

export const CHAT_VIEW_TYPE = 'markpilot-chat-view';

export type ChatFetcher = (
	messages: ChatMessage[],
) => AsyncGenerator<string | undefined>;

export class ChatView extends ItemView {
	private root: Root;
	public clear?: () => void;

	constructor(
		leaf: WorkspaceLeaf,
		private fetcher: ChatFetcher,
		private cancel: () => void,
		private plugin: Markpilot,
	) {
		super(leaf);
	}

	getViewType() {
		return CHAT_VIEW_TYPE;
	}

	getDisplayText() {
		return 'Markpilot';
	}

	getIcon() {
		// Using icon from Lucide:
		// https://lucide.dev/icons/bot
		return 'bot';
	}

	async onOpen() {
		const { containerEl } = this;

		containerEl.empty();
		this.root = createRoot(containerEl);
		this.root.render(
			<React.StrictMode>
				<App
					view={this}
					fetcher={this.fetcher}
					cancel={this.cancel}
					plugin={this.plugin}
				/>
			</React.StrictMode>,
		);
	}

	async onClose() {
		this.root.unmount();
	}
}
