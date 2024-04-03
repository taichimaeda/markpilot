import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { ChatHistory, ChatRole } from 'src/api/openai';
import Markpilot from 'src/main';
import { ChatInput } from './components/ChatBox';
import { ChatItem } from './components/ChatItem';

const systemPrompt = `
Welcome, I'm your Copilot and I'm here to help you get things done faster. You can also start an inline chat session.

I'm powered by AI, so surprises and mistakes are possible. Make sure to verify any generated code or suggestions, and share feedback so that we can learn and improve. Check out the Copilot documentation to learn more.
`;

export function App({ plugin }: { plugin: Markpilot }) {
  const [turn, setTurn] = useState<ChatRole>('system');
  const [history, setHistory] = useState<ChatHistory>({
    messages: [{ role: 'system', content: systemPrompt }],
    response: '',
  });

  const { settings } = plugin;

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
        for await (const chunk of plugin.client.fetchChat(history.messages)) {
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
    <div
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;
      `}
    >
      <div
        css={css`
          margin: 15px 0;
          flex-grow: 1;
          overflow-y: scroll;
        `}
      >
        {history.messages.map((message, index) => (
          <ChatItem key={index} message={message} />
        ))}
        {turn === 'assistant' && (
          <ChatItem
            message={{ role: 'assistant', content: history.response }}
          />
        )}
      </div>
      <div
        css={css`
          margin: 15px;
          margin-top: 0;
        `}
      >
        <ChatInput disabled={turn === 'assistant'} submit={submit} />
      </div>
    </div>
  );
}
