export type BaseChatMessage = {
  uuid: string;
  type: string;
  role: string;
  created_at?: string;
  hidden?: boolean;
};

export type TextMessageOption = {
  title: string;
  subtitle: string;
  value: string;
};

export type TextMessage = BaseChatMessage & {
  type: 'text';
  content: string;
  options?: TextMessageOption[];
};

export type LoadingMessage = BaseChatMessage & {
  type: 'loading';
  name?: string;
  error?: boolean;
  complete?: boolean;
};

export type SearchMessage = BaseChatMessage & {
  type: 'search';
  query: string;
  // TODO better type here
  value: any;
};

export type ChatMessage = TextMessage | LoadingMessage | SearchMessage;

export type ChatBasic = {
  uuid: string;
  created_at: string;
  name?: string;
  description?: string;
};

export type Chat = {
  uuid: string;
  created_at: string;
  messages: ChatMessage[];
  name?: string;
  description?: string;
};

export type MessageRequest = {
  content: string;
};

export type TextDelta = {
  type: 'response.output_text.delta';
  delta: string;
};

export type ToolCallCreated = {
  type: 'tool.call.created';
  name: string;
};

export type StreamEnd = {
  type: 'response.completed';
};

export type ToolCallError = {
  type: 'tool.call.error';
  name: string;
};

export type ToolCallDone = {
  type: 'tool.call.done';
  name: string;
};

export type SearchToolCallDone = ToolCallDone & {
  name: 'search';
  // TODO better type here
  value: any;
};

export type StreamObject =
  | TextDelta
  | ToolCallCreated
  | StreamEnd
  | ToolCallError
  | SearchToolCallDone;
