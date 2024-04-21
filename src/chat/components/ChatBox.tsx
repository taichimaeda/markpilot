import { CircleStop, SendHorizontal } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { ChatRole } from 'src/api';

export const ChatInput = forwardRef<
  HTMLTextAreaElement,
  {
    turn: ChatRole;
    cancel: () => void;
    submit: (text: string) => void;
  }
>(function ({ turn, cancel, submit }, ref) {
  const [value, setValue] = useState('');

  const numLines = value.split('\n').length;
  const numRows = Math.min(10, numLines);

  return (
    <div className="markpilot-chat-input">
      <textarea
        ref={ref}
        className="input-field"
        style={{ height: `${numRows + 1.5}rem` }}
        disabled={turn !== 'user'}
        placeholder="Type a message..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (
            turn === 'user' &&
            value.trim() !== '' &&
            event.key === 'Enter' &&
            !event.shiftKey && // Allow newline with shift key
            !event.nativeEvent.isComposing // Prevent submitting on IME
          ) {
            event.preventDefault();
            setValue('');
            submit(value);
          }
        }}
      />
      <div
        className="send-button-container"
        style={{ height: `${numRows + 1.5}rem` }}
      >
        <button
          className="send-button"
          disabled={turn === 'user' && value.trim() === ''}
          onClick={(event) => {
            if (turn === 'user') {
              event.preventDefault();
              setValue('');
              submit(value);
            } else if (turn === 'assistant') {
              event.preventDefault();
              cancel();
            }
          }}
        >
          {turn === 'user' ? (
            <SendHorizontal size={16} />
          ) : (
            <CircleStop size={16} />
          )}
        </button>
      </div>
    </div>
  );
});
