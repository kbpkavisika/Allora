import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConversationRow } from '@/components/chat/ConversationRow';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/lib/AuthProvider';
import { useChat } from '@/lib/ChatProvider';

export interface ConversationListProps {
  emptyMessage: string;
}

export function ConversationList({ emptyMessage }: ConversationListProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { conversations, isLoading, refresh } = useChat();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userId = session?.user.id ?? '';

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function pullToRefresh() {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }

  if (isLoading && conversations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator className="text-secondary" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-surface"
      data={conversations}
      keyExtractor={(conversation) => conversation.id}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 32 }}
      refreshing={isRefreshing}
      onRefresh={pullToRefresh}
      ItemSeparatorComponent={() => <View className="ml-4 h-px bg-border" aria-hidden />}
      renderItem={({ item }) => (
        <ConversationRow
          conversation={item}
          userId={userId}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
        />
      )}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
          <Icon name="chat" size="lg" className="text-secondary" />
          <Text role="heading" className="type-h3 text-primary">
            No messages yet
          </Text>
          <Text className="type-text-primary text-center text-secondary">{emptyMessage}</Text>
        </View>
      }
    />
  );
}
