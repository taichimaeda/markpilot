import { css } from "@emotion/react";
import { Bot, Copy, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Message } from "src/api/client";

export function ChatItem({ message }: { message: Message }) {
  return (
    <div
      css={css`
        padding: 15px 20px;
        background-color: rgba(
          255,
          255,
          255,
          ${message.role === "user" ? 0.05 : 0}
        );
        border-bottom: 1px solid gray;
        &:last-of-type {
          border-bottom: none;
        }
      `}
    >
      <ChatItemHeader message={message} />
      <ChatItemBody message={message} />
    </div>
  );
}

function ChatItemHeader({ message }: { message: Message }) {
  return (
    <div
      css={css`
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <div
          css={css`
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: 1px solid gray;
            border-radius: 50%;
          `}
        >
          {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
        </div>
        <span
          css={css`
            margin-left: 10px;
            font-size: 13px;
            font-weight: bold;
          `}
        >
          {message.role === "user" ? "You" : "Obsidian Copilot"}
        </span>
      </div>
      <button
        css={css`
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          padding: 0;
          margin: 0;
          border: 1px solid gray;
          border-radius: 5px;
          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
          &:active {
            background-color: rgba(255, 255, 255, 0.2);
          }
        `}
        onClick={() => {
          navigator.clipboard.writeText(message.content);
        }}
      >
        <Copy size={14} />
      </button>
    </div>
  );
}

function ChatItemBody({ message }: { message: Message }) {
  return (
    <div
      css={css`
        font-size: 13px;
      `}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {message.content}
      </ReactMarkdown>
    </div>
  );
}
