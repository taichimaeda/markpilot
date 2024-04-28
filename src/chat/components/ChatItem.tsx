import { Bot, Copy, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { ChatMessage } from 'src/api';

export function ChatItem({
	active,
	message,
}: {
	active?: boolean;
	message: ChatMessage;
}) {
	return (
		<div
			className={
				'markpilot-chat-item' +
				(message.role === 'user' ? ' user' : ' assistant')
			}
		>
			<ChatItemHeader message={message} />
			{active && message.content === '' ? (
				<ChatItemBodyTyping />
			) : (
				<ChatItemBody message={message} />
			)}
		</div>
	);
}

function ChatItemHeader({ message }: { message: ChatMessage }) {
	return (
		<div className="markpilot-chat-item-header">
			<div className="profile-container">
				<div className="profile-icon">
					{message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
				</div>
				<span className="profile-name">
					{message.role === 'user' ? 'You' : 'Markpilot'}
				</span>
			</div>
			<button
				className="copy-button"
				onClick={() => {
					navigator.clipboard.writeText(message.content);
				}}
			>
				<Copy size={14} />
			</button>
		</div>
	);
}

function ChatItemBody({ message }: { message: ChatMessage }) {
	return (
		<div className="markpilot-chat-item-body">
			{/* TODO: Make markdown content selectable. */}
			<ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
				{message.content}
			</ReactMarkdown>
		</div>
	);
}

function ChatItemBodyTyping() {
	return (
		<div className="markpilot-chat-item-body-typing">
			<div className="dot" />
			<div className="dot" />
			<div className="dot" />
		</div>
	);
}
