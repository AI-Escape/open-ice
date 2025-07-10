import { ChatBox } from './ChatBox';
import { createChat, getChat } from '../../common/api/chat';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { LoadingOrError } from '../Loading';

export function ChatView() {
  const [nowChat, setNowChat] = useState(new Date());
  const [chatId, setChatId] = useState<string | null>(null);

  const createChatMutation = useMutation({
    mutationFn: createChat,
    onSuccess: (chat) => {
      setChatId(chat.uuid);
    },
  });

  const getChatQuery = useQuery({
    queryKey: ['chat', chatId, nowChat],
    queryFn: () => getChat(chatId ?? ''),
    enabled: !!chatId,
  });

  useEffect(() => {
    if (!chatId) {
      createChatMutation.mutate();
    }
  }, []);

  return getChatQuery.isLoading || getChatQuery.isError || !getChatQuery.data ? (
    <LoadingOrError
      loading={getChatQuery.isLoading}
      error={getChatQuery.error}
      retry={() => {
        setNowChat(new Date());
      }}
    />
  ) : (
    <ChatBox chat={getChatQuery.data} />
  );
}
