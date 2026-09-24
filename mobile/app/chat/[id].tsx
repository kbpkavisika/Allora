import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageComposer } from '@/components/chat/MessageComposer';
import {
  MessageContextLine,
  type MessageContextLineProps,
} from '@/components/chat/MessageContextLine';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { TopBar } from '@/components/ui/TopBar';
import { useAuth } from '@/lib/AuthProvider';
import {
  fetchProductNames,
  mergeMessages,
  NEW_CONVERSATION_ID,
  type Message,
} from '@/lib/chat';
import { useChat } from '@/lib/ChatProvider';
import { useOrders } from '@/lib/OrdersProvider';
import { useProfile } from '@/lib/ProfileProvider';
import { supabase } from '@/lib/supabase';

interface MessageContext {
  productId?: string | null;
  orderId?: string | null;
}

type ContextLine = Omit<MessageContextLineProps, 'onRemove' | 'className'>;

export default function ChatThreadScreen() {
  const insets = useSafeAreaInsets();
  const { id, shopId, productId, orderId } = useLocalSearchParams<{
    id?: string;
    shopId?: string;
    productId?: string;
    orderId?: string;
  }>();
  const { session } = useAuth();
  const { profile } = useProfile();
  const { getOrder } = useOrders();
  const { getConversation, loadMessages, sendMessage, subscribeToMessages } = useChat();

  const userId = session?.user.id;
  const isNew = !id || id === NEW_CONVERSATION_ID;
  const conversationId = isNew ? null : id;
  const conversation = conversationId ? getConversation(conversationId) : undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isMissing, setIsMissing] = useState(isNew && !shopId);
  const [shopName, setShopName] = useState<string | null>(null);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [pendingContext, setPendingContext] = useState<MessageContext | null>(
    productId || orderId ? { productId, orderId } : null
  );
  const [toast, setToast] = useState<string | null>(null);

  const refreshMessages = useCallback(async () => {
    if (!conversationId) return;

    const { messages: latest, error } = await loadMessages(conversationId);
    if (error) {
      setIsMissing(true);
    } else {
      setMessages((current) => mergeMessages(current, latest));
    }
    setIsLoading(false);
  }, [conversationId, loadMessages]);

  useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  useEffect(
    () =>
      subscribeToMessages((event) => {
        if (event.conversation_id === conversationId) refreshMessages();
      }),
    [conversationId, subscribeToMessages, refreshMessages]
  );

  useEffect(() => {
    if (conversation || !shopId) return;

    supabase
      .from('shops')
      .select('name')
      .eq('id', shopId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setShopName(data.name);
        } else if (isNew) {
          setIsMissing(true);
        }
      });
  }, [conversation, shopId, isNew]);

  useEffect(() => {
    const ids = new Set(messages.map((message) => message.product_id));
    ids.add(pendingContext?.productId ?? null);

    const missing = [...ids].filter(
      (productKey): productKey is string => !!productKey && !(productKey in productNames)
    );
    if (missing.length === 0) return;

    fetchProductNames(missing).then((names) =>
      setProductNames((current) => ({
        ...current,
        ...Object.fromEntries(missing.map((productKey) => [productKey, names[productKey] ?? ''])),
      }))
    );
  }, [messages, pendingContext, productNames]);

  const title = conversation?.counterpart_name ?? shopName ?? 'Chat';

  function contextLine({ productId: product, orderId: order }: MessageContext): ContextLine | null {
    if (order) {
      const orderNumber = getOrder(order)?.order_number;
      return {
        icon: 'orders',
        label: orderNumber ? `About order ${orderNumber}` : 'About an order',
        onPress: orderNumber
          ? () =>
              router.push({
                pathname: profile?.role === 'seller' ? '/seller/orders/[id]' : '/orders/[id]',
                params: { id: order },
              })
          : undefined,
      };
    }

    if (product) {
      const productName = productNames[product];
      return {
        icon: 'shop',
        label: productName ? `About ${productName}` : 'About a product',
        onPress: productName
          ? () => router.push({ pathname: '/product/[id]', params: { id: product } })
          : undefined,
      };
    }

    return null;
  }

  async function handleSend(body: string) {
    const { message, error } = await sendMessage({
      body,
      conversationId: conversationId ?? undefined,
      shopId: conversationId ? undefined : shopId,
      productId: pendingContext?.productId,
      orderId: pendingContext?.orderId,
    });

    if (error || !message) {
      setToast('Could not send your message. Try again.');
      return false;
    }

    setPendingContext(null);
    setMessages((current) => mergeMessages(current, [message]));

    if (!conversationId) {
      router.setParams({ id: message.conversation_id });
    }

    return true;
  }

  if (isMissing) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Chat" />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            Conversation not found
          </Text>
          <Button
            variant="secondary"
            label="Go back"
            fullWidth={false}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        </View>
      </View>
    );
  }

  const pendingLine = pendingContext ? contextLine(pendingContext) : null;

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={title} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator className="text-secondary" />
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <Text role="heading" className="type-h3 text-center text-primary">
              Start the conversation
            </Text>
            <Text className="type-text-primary text-center text-secondary">
              Ask {shopName ?? 'the seller'} about a product, an order or delivery.
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(message) => message.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => {
              const isMine = item.sender_id === userId;
              const line = contextLine({ productId: item.product_id, orderId: item.order_id });

              return (
                <View className={`max-w-[80%] gap-1 ${isMine ? 'self-end' : 'self-start'}`}>
                  {line ? <MessageContextLine {...line} /> : null}
                  <View
                    className={`rounded-12 px-4 py-3 ${isMine ? 'bg-primary' : 'bg-surface-sunken'}`}>
                    <Text
                      className={`type-text-primary ${isMine ? 'text-surface' : 'text-primary'}`}>
                      {item.body}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View
          className="gap-2 border-t-1 border-border bg-surface px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}>
          {pendingLine ? (
            <MessageContextLine {...pendingLine} onRemove={() => setPendingContext(null)} />
          ) : null}
          <MessageComposer onSend={handleSend} disabled={isLoading} />
        </View>
      </KeyboardAvoidingView>

      <Toast message={toast} offset={72} onDismiss={() => setToast(null)} />
    </View>
  );
}
