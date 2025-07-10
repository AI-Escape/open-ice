import RenderedLoadingMessage from '../../components/chat/RenderedLoadingMessage';
import RenderedTextMessage from '../../components/chat/RenderedTextMessage';

import { ChatMessage, ToolCallDone } from './types';

export enum MessageType {
  Text = 'text',
  Loading = 'loading',
}

export enum ToolCallName {}

export const messageComponents: Record<MessageType, React.FC<any>> = {
  [MessageType.Loading]: RenderedLoadingMessage,
  [MessageType.Text]: RenderedTextMessage,
  // Add other message types here...
};

export const toolCallMessages: Record<ToolCallName, string> = {
  // Add other tool calls here...
};

export const toolCallHandlers: Record<ToolCallName, (obj: ToolCallDone) => ChatMessage> = {};
