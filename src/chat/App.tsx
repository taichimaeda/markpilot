import { useEffect, useState } from 'react';
import { ChatHistory, ChatRole } from 'src/api/types';
import Markpilot from 'src/main';
import { ChatInput } from './components/ChatBox';
import { ChatItem } from './components/ChatItem';
import { ChatView } from './view';

const systemPrompt = `
Welcome, I'm your Copilot and I'm here to help you get things done faster. You can also start an inline chat session.

I'm powered by AI, so surprises and mistakes are possible. Make sure to verify any generated code or suggestions, and share feedback so that we can learn and improve. Check out the Copilot documentation to learn more.
`;
const defaultHistory: ChatHistory = {
  messages: [{ role: 'system', content: systemPrompt }],
  response: '',
};

export function App({ view, plugin }: { view: ChatView; plugin: Markpilot }) {
  const [turn, setTurn] = useState<ChatRole>('system');
  const [history, setHistory] = useState<ChatHistory>(defaultHistory);

  const { settings } = plugin;

  useEffect(() => {
    // Expose the method to clear history to the view
    // so that the plugin command can call it.
    view.clear = () => setHistory(defaultHistory);
  }, []);

  useEffect(() => {
    if (settings.chat.history.messages.length > 1) {
      setHistory(settings.chat.history);
    }
    setTurn('user');
  }, []);

  useEffect(() => {
    settings.chat.history = history;
    plugin.saveSettings();
  }, [history]);

  useEffect(() => {
    if (turn === 'assistant') {
      (async () => {
        const chunks = plugin.chatClient.fetchChat(history.messages);
        for await (const chunk of chunks) {
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
            message={{ role: 'assistant', content: history.response }}
          />
        )}
      </div>
      <div className="input-container">
        <ChatInput disabled={turn === 'assistant'} submit={submit} />
      </div>
    </div>
  );
}
