import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { NEW_CONVERSATION_ID } from '@/lib/chat';
import { useChat } from '@/lib/ChatProvider';

export interface SellerChatContext {
  shopId: string;
  buyerId?: string;
  productId?: string;
  orderId?: string;
}

export function useSellerChat() {
  const { findConversation } = useChat();
  const [isOpening, setIsOpening] = useState(false);

  const openSellerChat = useCallback(
    async ({ shopId, buyerId, productId, orderId }: SellerChatContext) => {
      setIsOpening(true);
      const { conversationId } = await findConversation(shopId, buyerId);
      setIsOpening(false);

      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversationId ?? NEW_CONVERSATION_ID,
          shopId,
          ...(buyerId ? { buyerId } : null),
          ...(productId ? { productId } : null),
          ...(orderId ? { orderId } : null),
        },
      });
    },
    [findConversation]
  );

  return { openSellerChat, isOpening };
}
