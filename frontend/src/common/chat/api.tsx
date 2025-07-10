import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createMessage } from '../api/chat';
import { ChatMessage, LoadingMessage, MessageRequest, TextMessage } from '../chat/types';
import { v4 as uuidv4 } from 'uuid';

export function useChatApi(
  chatId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) {
  const create = useMutation({
    mutationFn: async (message: MessageRequest) => {
      console.log('streaming message:', message);

      return createMessage(chatId, message, setMessages, undefined);
    },
    // TODO: check if this is ok
    retry: 3,
    onError: (error) => {
      console.error(error);
      // occurs after all retries have failed
      // remove the last message (loading message)
      setMessages((messages) => [...messages.slice(0, -1)]);
    },
  });

  const loading = create.isPending;

  const error = create.error;

  const ask = useCallback(
    async (message: string) => {
      const text = message.trim();

      if (!text) {
        return;
      }

      if (loading) {
        return;
      }

      console.log('adding message');
      const newMessage: TextMessage = {
        uuid: uuidv4(),
        type: 'text',
        created_at: new Date().toISOString().split('.')[0],
        role: 'user',
        content: text,
      };
      const newLoadingMessage: LoadingMessage = {
        uuid: uuidv4(),
        type: 'loading',
        created_at: new Date().toISOString().split('.')[0],
        role: 'assistant',
      };

      // preemptively adding user's message to messages to look more responsive
      setMessages((messages) => [...messages, newMessage, newLoadingMessage]);

      // reset error states
      create.reset();

      console.log('sending to chat');
      await create.mutateAsync({ content: text });
    },
    [create],
  );
  return {
    ask,
    loading,
    error,
  };
}
