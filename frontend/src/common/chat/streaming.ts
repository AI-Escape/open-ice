import { MessageType, toolCallHandlers, ToolCallName } from './tools';
import { ChatMessage, LoadingMessage, StreamObject, TextMessage } from './types';
import { v4 as uuidv4 } from 'uuid';

export async function readChatStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) {
  const decoder = new TextDecoder('utf-8');

  // TODO may need to check for external conditions to break loop, such as a cancelation
  let runningLine = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    // console.log('chunk_lines', lines);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(runningLine + line) as StreamObject;
        runningLine = '';

        // text or audio response completed
        if (parsed.type === 'response.completed') {
          break;
        }
        handleStreamObject(parsed, setMessages);
      } catch (e) {
        if (e instanceof SyntaxError) {
          runningLine += line;
        } else {
          console.error(e);
        }
      }
    }
  }

  if (runningLine) {
    try {
      const parsed = JSON.parse(runningLine) as StreamObject;
      handleStreamObject(parsed, setMessages);
    } catch (e) {
      console.info(runningLine);
      console.error(e);
    }
  }
}

export function handleStreamObject(
  obj: StreamObject,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) {
  // console.log('obj', obj);
  // not text or audio delta
  if (obj.type !== 'response.output_text.delta') {
    console.log(obj);
  }

  // text or audio response completed
  if (obj.type === 'response.completed') {
    return;
  }

  setMessages((messages) => {
    const lastMessage = messages[messages.length - 1];

    if (obj.type === 'response.output_text.delta') {
      if (lastMessage.role === 'assistant' && lastMessage.type === MessageType.Text) {
        const updatedMessage = {
          ...lastMessage,
          content: lastMessage.content + obj.delta,
        };

        return [...messages.slice(0, -1), updatedMessage];
      }

      // create new message if last message is not a text message from the assistant
      const newMessage: TextMessage = {
        uuid: uuidv4(),
        type: MessageType.Text,
        created_at: new Date().toISOString().split('.')[0],
        role: 'assistant',
        content: obj.delta,
      };

      if (lastMessage.role === 'assistant' && lastMessage.type === MessageType.Loading) {
        return [...messages.slice(0, -1), newMessage];
      }

      return [...messages, newMessage];
    }

    if (obj.type === 'tool.call.created') {
      const newMessage: LoadingMessage = {
        uuid: uuidv4(),
        type: MessageType.Loading,
        created_at: new Date().toISOString().split('.')[0],
        role: 'assistant',
        name: obj.name,
      };

      if (lastMessage.role === 'assistant' && lastMessage.type === MessageType.Loading) {
        return [...messages.slice(0, -1), newMessage];
      }

      return [...messages, newMessage];
    }

    // TODO support tool calling here
    if (obj.type === 'tool.call.done') {
      console.log('tool call done', obj);
      // TODO add tool call messages here
      // const handler = toolCallHandlers[obj.name as ToolCallName];

      // if (handler) {
      //   const newMessage = handler(obj);

      //   return [...messages.slice(0, -1), newMessage];
      // }
      // console.error('Unknown tool call name: ', obj.name);
    }

    if (obj.type === 'tool.call.error') {
      const newMessage: LoadingMessage = {
        uuid: uuidv4(),
        type: MessageType.Loading,
        created_at: new Date().toISOString().split('.')[0],
        role: 'assistant',
        name: obj.name,
        error: true,
      };

      return [...messages.slice(0, -1), newMessage];
    }

    return messages;
  });
}
