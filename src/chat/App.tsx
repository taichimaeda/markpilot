import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChatHistory, ChatRole } from 'src/api';
import Markpilot from 'src/main';
import { ChatInput } from './components/ChatBox';
import { ChatItem } from './components/ChatItem';
import { ChatFetcher, ChatView } from './view';

const SYSTEM_PROMPT = `
Welcome, I'm your Copilot and I'm here to help you get things done faster. You can also start an inline chat session.

I'm powered by AI, so surprises and mistakes are possible. Make sure to verify any generated code or suggestions, and share feedback so that we can learn and improve. Check out the Copilot documentation to learn more.
`;

const defaultHistory: ChatHistory = {
  messages: [{ role: 'system', content: SYSTEM_PROMPT }],
  response: '',
};

export function App({
  view,
  fetcher,
  cancel,
  plugin,
}: {
  view: ChatView;
  fetcher: ChatFetcher;
  cancel: () => void;
  plugin: Markpilot;
}) {
  const { settings } = plugin;

  const [turn, setTurn] = useState<ChatRole>('user');
  const [history, setHistory] = useState<ChatHistory>(
    settings.chat.history.messages.length > 1
      ? settings.chat.history
      : defaultHistory,
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  // Expose the method to clear history to the view
  // so that the plugin command can call it.
  useEffect(() => {
    view.clear = () => setHistory(defaultHistory);
  }, []);

  // Scroll to the bottom when chat history changes.
  useLayoutEffect(() => {
    bottomRef?.current?.scrollIntoView();
  }, [history]);

  // Save chat history to settings when it changes.
  // There may be a better way to store chat history, but this works for now.
  useEffect(() => {
    settings.chat.history = history;
    plugin.saveSettings();
  }, [history]);

  useEffect(() => {
    if (turn === 'assistant') {
      (async () => {
        for await (const chunk of fetcher(history.messages)) {
          setHistory((history) => ({
            ...history,
            response: history.response + chunk,
          }));
        }

        setHistory((history) => ({
          messages: [
            ...history.messages,
            { role: 'assistant', content: history.response },
          ],
          response: '',
        }));
        setTurn('user');
      })();
    }
  }, [turn]);

  function submit(content: string) {
    setHistory({
      ...history,
      messages: [...history.messages, { role: 'user', content }],
    });
    setTurn('assistant');
  }

  return (
    <div className="markpilot-chat-root">
      <div className="items-container">
        {history.messages.map((message, index) => (
          <ChatItem key={index} message={message} />
        ))}
        {turn === 'assistant' && (
          <ChatItem
            active
            message={{ role: 'assistant', content: history.response }}
          />
        )}
        <div ref={bottomRef} />
      </div>
      <div className="input-container">
        <ChatInput turn={turn} cancel={cancel} submit={submit} />
      </div>
    </div>
  );
}
