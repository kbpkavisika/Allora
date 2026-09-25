import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/lib/AuthProvider';
import {
  MESSAGE_PAGE_SIZE,
  type ConversationSummary,
  type Message,
  type MessageEvent,
} from '@/lib/chat';
import { supabase } from '@/lib/supabase';

export interface SendMessageInput {
  body: string;
  conversationId?: string;
  shopId?: string;
  productId?: string | null;
  orderId?: string | null;
}

export type MessageListener = (event: MessageEvent) => void;

export interface ChatContextValue {
  conversations: ConversationSummary[];
  unreadCount: number;
  isLoading: boolean;
  getConversation: (id: string) => ConversationSummary | undefined;
  findConversation: (shopId: string) => Promise<{ conversationId: string | null; error: unknown }>;
  loadMessages: (
    conversationId: string,
    before?: string
  ) => Promise<{ messages: Message[]; error: unknown }>;
  sendMessage: (input: SendMessageInput) => Promise<{ message: Message | null; error: unknown }>;
  markRead: (conversationId: string) => Promise<{ error: unknown }>;
  setMuted: (conversationId: string, muted: boolean) => Promise<{ error: unknown }>;
  subscribeToMessages: (listener: MessageListener) => () => void;
  refresh: () => Promise<void>;
}

export interface ChatProviderProps {
  children: ReactNode;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: ChatProviderProps) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const listeners = useRef(new Set<MessageListener>());

  const load = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase.rpc('list_conversations');
    setConversations((data ?? []) as ConversationSummary[]);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    setIsLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`inbox:${userId}`)
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        listeners.current.forEach((listener) => listener(payload as MessageEvent));
        load();
      })
      .on('broadcast', { event: 'read' }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const getConversation = useCallback(
    (id: string) => conversations.find((conversation) => conversation.id === id),
    [conversations]
  );

  const findConversation = useCallback(async (shopId: string) => {
    const { data, error } = await supabase.rpc('find_conversation', { p_shop_id: shopId });
    return { conversationId: (data as string | null) ?? null, error };
  }, []);

  const loadMessages = useCallback(async (conversationId: string, before?: string) => {
    const { data, error } = await supabase.rpc('get_messages', {
      p_conversation_id: conversationId,
      p_before: before ?? null,
      p_limit: MESSAGE_PAGE_SIZE,
    });
    return { messages: (data ?? []) as Message[], error };
  }, []);

  const sendMessage = useCallback(
    async ({ body, conversationId, shopId, productId, orderId }: SendMessageInput) => {
      const { data, error } = await supabase.rpc('send_message', {
        p_body: body,
        p_conversation_id: conversationId ?? null,
        p_shop_id: shopId ?? null,
        p_product_id: productId ?? null,
        p_order_id: orderId ?? null,
      });

      if (!error) await load();

      return { message: (data as Message | null) ?? null, error };
    },
    [load]
  );

  const markRead = useCallback(async (conversationId: string) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unread_count: 0 } : conversation
      )
    );

    const { error } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
    });
    return { error };
  }, []);

  const setMuted = useCallback(async (conversationId: string, muted: boolean) => {
    const applyMuted = (next: boolean) =>
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, muted: next } : conversation
        )
      );

    applyMuted(muted);

    const { error } = await supabase.rpc('set_conversation_muted', {
      p_conversation_id: conversationId,
      p_muted: muted,
    });

    if (error) applyMuted(!muted);
    return { error };
  }, []);

  const subscribeToMessages = useCallback((listener: MessageListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const unreadCount = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unread_count, 0),
    [conversations]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations,
      unreadCount,
      isLoading,
      getConversation,
      findConversation,
      loadMessages,
      sendMessage,
      markRead,
      setMuted,
      subscribeToMessages,
      refresh: load,
    }),
    [
      conversations,
      unreadCount,
      isLoading,
      getConversation,
      findConversation,
      loadMessages,
      sendMessage,
      markRead,
      setMuted,
      subscribeToMessages,
      load,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const chatState = useContext(ChatContext);
  if (!chatState) {
    throw new Error('useChat must be used inside <ChatProvider>.');
  }
  return chatState;
}
