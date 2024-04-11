import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

export function ChatInput({
  disabled,
  submit,
}: {
  disabled: boolean;
  submit: (text: string) => void;
}) {
  const [value, setValue] = useState('');

  const numLines = value.split('\n').length;
  const numRows = Math.min(10, numLines);

  return (
    <div className="markpilot-chat-input">
      <textarea
        className="input-field"
        style={{ height: `${numRows + 1.5}rem` }}
        disabled={disabled}
        placeholder="Type a message..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (
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
        <button className="send-button">
          <SendHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
