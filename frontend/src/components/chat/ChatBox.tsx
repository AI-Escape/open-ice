import { useState, useEffect, createRef, useRef } from 'react';

import { Chat, ChatMessage } from '../../common/chat/types';
import { useChatApi } from '../../common/chat/api';

import { ChatTurn } from './ChatTurn';
import { ChatBar } from './ChatBar';
import { ErrorTurn } from './ErrorTurn';

export type ChatBoxProps = {
  chat: Chat;
};

export function ChatBox(props: ChatBoxProps) {
  const chatContentRef = createRef<HTMLDivElement>();

  const prevChatScrollEnd = useRef<number>(0);

  const barRef = useRef<HTMLTextAreaElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(
    props.chat.messages.filter(
      (message) => (message.type === 'text' || message.type === 'loading') && !message.hidden,
    ),
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ask, loading, error } = useChatApi(props.chat.uuid, setMessages);

  useEffect(() => {
    if (chatContentRef.current) {
      const currentScroll = chatContentRef.current.scrollTop;
      const height = chatContentRef.current.clientHeight;
      const scrollHeight = chatContentRef.current.scrollHeight;
      const scrollEnd = scrollHeight - height;
      const prevScrollEnd = !prevChatScrollEnd.current ? scrollEnd : prevChatScrollEnd.current;

      const scrollEndTolerance = 100;

      if (currentScroll !== scrollEnd) {
        // console.log(`scroll ${currentScroll} -> ${prevScrollEnd} ? (${currentScroll + scrollEndTolerance} >= ${prevScrollEnd} -> ${currentScroll + scrollEndTolerance >= prevScrollEnd})`);
        if (currentScroll + scrollEndTolerance >= prevScrollEnd) {
          chatContentRef.current.scrollTop = scrollEnd;
        }
      }
      prevChatScrollEnd.current = scrollEnd;
    }
  }, [messages, chatContentRef]);

  return (
    <div className="flex flex-col flex-grow min-h-0 max-h-[80dvh]">
      <div ref={chatContentRef} className="flex-grow overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col px-4 space-y-2 mx-auto lg:max-w-6xl">
          {messages.length > 0 ? (
            messages.map((item, index) => (
              <ChatTurn
                key={item.uuid}
                addMessage={ask}
                index={index}
                length={messages.length}
                loading={loading}
                message={item}
              />
            ))
          ) : (
            <ChatTurn
              key="initial-message"
              addMessage={ask}
              index={0}
              length={1}
              message={{
                uuid: 'initial-message',
                role: 'assistant',
                type: 'text',
                content: 'Hello! What would you like to know about immigration statistics?',
                options: [
                  {
                    title: 'Are all',
                    subtitle: 'detainees criminals?',
                    value: 'Are all detainees criminals?',
                  },
                  {
                    title: 'How long do',
                    subtitle: 'detainees stay in detention?',
                    value: 'How long do detainees stay in detention?',
                  },
                  {
                    title: 'How many detainees',
                    subtitle: 'are there in the US?',
                    value: 'How many detainees are there in the US?',
                  },
                  {
                    title: 'How are detainees',
                    subtitle: 'being released?',
                    value: 'How are detainees being released?',
                  },
                ],
              }}
            />
          )}
          {error && !loading && <ErrorTurn error={error} />}
        </div>
      </div>
      <div className="px-4 pb-2 pt-4 bg-transparent">
        <div className="mx-auto lg:max-w-6xl bg-transparent">
          <ChatBar addMessage={ask} loading={loading} textareaRef={barRef} />
        </div>
      </div>
    </div>
  );
}
