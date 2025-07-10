import { readChatStream } from '../chat/streaming';
import { Chat, MessageRequest, ChatMessage } from '../chat/types';

import { handleFetchResponse } from './errors';
import axiosInstance, { apiUrl } from './axiosInstance';

export async function createChat() {
  const response = await axiosInstance.post('/chat');

  return response.data as Chat;
}

export async function getChat(chatId: string) {
  const response = await axiosInstance.get(`/chat/${chatId}`);

  return response.data as Chat;
}

export async function createMessage(
  chatId: string,
  message: MessageRequest,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  token?: string,
) {
  const url = `${apiUrl}/chat/${chatId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok || response.body === null) {
    const error = await handleFetchResponse(response);
    throw error;
  }

  const reader = response.body.getReader();
  await readChatStream(reader, setMessages);
}
