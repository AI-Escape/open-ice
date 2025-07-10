import { ChatMessage } from '../../common/chat/types';
import { messageComponents, MessageType } from '../../common/chat/tools';

export type ChatTurnProps = {
  index: number;
  length: number;
  message: ChatMessage;
  addMessage?: (message: string) => Promise<void>;
  loading?: boolean;
};

export function ChatTurn(props: ChatTurnProps) {
  const message = props.message;
  const index = props.index;

  let content = null;

  if (message.type in messageComponents) {
    const Component = messageComponents[message.type as MessageType];

    if (message.type === MessageType.Text) {
      content = (
        <Component
          addMessage={props.addMessage}
          index={index}
          length={props.length}
          loading={props.loading}
          message={message}
        />
      );
    } else {
      content = <Component message={message} />;
    }
  } else {
    console.error('Unknown message type: ', message);
  }

  return (
    <div
      key={props.index}
      className={`message max-w-auto break-words ${
        message.role === 'user'
          ? 'bg-gray-200 text-black self-end rounded-tl-lg rounded-bl-lg rounded-tr-lg custom-overflow-wrap px-4 mr-4 py-2'
          : `rounded-tl-lg rounded-tr-lg rounded-br-lg px-2 mr-2 py-2`
      }`}
    >
      <div className="text-xs text-gray-800 mb-1">{message.role === 'user' ? 'You' : 'ALICE'}</div>
      {content}
    </div>
  );
}
