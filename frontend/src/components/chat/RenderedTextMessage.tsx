import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { TextMessage } from '../../common/chat/types';

export type RenderedTextMessageProps = {
  message: TextMessage;
  addMessage?: (message: string) => Promise<void>;
  loading?: boolean;
  index: number;
  length: number;
};

export default function RenderedTextMessage(props: RenderedTextMessageProps) {
  const { message, addMessage, loading, index, length } = props;
  const { options } = message;

  const textContent = (
    <div className="space-y-2 prose-sm md:prose-lg lg:prose-xl">
      <ReactMarkdown
        // Note: We replace all newlines with two spaces and a newline to ensure that the markdown
        // renderer correctly renders line breaks.
        children={message.content.replaceAll('\n', '  \n')}
        components={{
          ul: ({ node, ...props }) => <ul className="list-disc list-inside pl-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside pl-2" {...props} />,
          li: ({ node, ...props }) => (
            <li className="list-decimal list-outside ml-2 mb-2 space-y-4" {...props} />
          ),
          div: ({ node, ...props }) => <div {...props} className="space-y-4" />,
          code: ({ node, ...props }) => (
            <code
              {...props}
              className="bg-gray-800 text-gray-300 p-1 rounded-lg break-words whitespace-pre-wrap"
            />
          ),
        }}
        remarkPlugins={[remarkGfm]}
      />
    </div>
  );

  let content = null;

  if (options && addMessage && index === length - 1) {
    const optionsContent = options.map((option, option_idx) => (
      <button
        key={`turn-${index}-option-${option_idx}`}
        className={`text-white p-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 ${
          loading ? 'bg-gray-800' : 'bg-slate-700'
        }`}
        disabled={loading}
        onClick={() => {
          if (addMessage && !loading) {
            addMessage(option.value);
          }
        }}
      >
        <h3 className="text-med sm:text-lg font-semibold">{option.title}</h3>
        <p className="text-xs sm:text-sm text-gray-300">{option.subtitle}</p>
      </button>
    ));

    content = (
      <div className="chat-options space-y-4">
        {textContent}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">{optionsContent}</div>
      </div>
    );
  } else {
    content = textContent;
  }

  return content;
}
