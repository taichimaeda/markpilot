import { css } from '@emotion/react';
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
    <div
      css={css`
        position: relative;
        width: 100%;
      `}
    >
      <textarea
        disabled={disabled}
        placeholder="Type a message..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          // Press Enter to submit, Shift+Enter for newline
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            setValue('');
            submit(value);
          }
        }}
        css={css`
          width: 100%;
          height: ${numRows + 1.5}rem;
          resize: none;
          margin: 0;
          padding: 10px;
          border-radius: 5px;
        `}
      />
      <div
        css={css`
          position: absolute;
          top: 0;
          bottom: 0;
          height: ${numRows + 1.5}rem;
          right: 10px;
          display: flex;
          align-items: center;
        `}
      >
        <button
          css={css`
            width: 24px;
            height: 24px;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            background-color: rgba(255, 255, 255, 0) !important;
            &:hover {
              box-shadow: none !important;
              background-color: rgba(255, 255, 255, 0.1) !important;
              border-radius: 50%;
            }
          `}
        >
          <SendHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
