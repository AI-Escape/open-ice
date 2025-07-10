import { Icon, Spinner } from '@cloudscape-design/components';
import { useState, useEffect, useMemo } from 'react';

export type ChatBarProps = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  addMessage: (message: string) => Promise<void>;
  loading?: boolean;
  onResize?: () => void;
};

export function ChatBar(props: ChatBarProps) {
  const { loading, addMessage, textareaRef, onResize } = props;
  const [input, setInput] = useState('');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset the height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set the height to scroll height

      if (onResize) {
        onResize();
      }
    }
  }, [input, textareaRef, onResize]);

  const enterSend = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !loading) {
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();

      if (!input) {
        return;
      }

      const oldInput = input;
      setInput('');

      try {
        await addMessage(input);
      } catch (err) {
        setInput(oldInput);
      }
    }
  };

  const sendClick = async () => {
    if (!loading) {
      if (!input) {
        return;
      }

      const oldInput = input;
      setInput('');

      try {
        await addMessage(input);
      } catch (err) {
        setInput(oldInput);
      }
    }
  };

  return (
    <div className={`input flex rounded-[28px] bg-gray-100 pr-2 py-2 items-end pl-4'`}>
      <textarea
        ref={textareaRef}
        className="flex-grow py-2 px-6  text-black rounded-l-lg resize-none cursor-text bg-transparent focus:outline-none"
        placeholder="Send message..."
        rows={1}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={enterSend}
      />
      <button
        className={`text-white p-2 rounded-full w-10 h-10 font-bold items-center justify-center flex ml-2 ${
          loading || (!loading && input.trim().length === 0) ? 'bg-gray-100' : 'bg-blue-500'
        }`}
        disabled={loading}
        onClick={sendClick}
      >
        {loading ? (
          <Spinner size="normal" variant="inverted" />
        ) : (
          <svg
            className="icon-2xl"
            fill="none"
            height="32"
            viewBox="0 0 32 32"
            width="32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clipRule="evenodd"
              d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616 1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143 1.143 0 1 1-1.616-1.616z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
