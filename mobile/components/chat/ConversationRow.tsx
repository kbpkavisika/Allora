import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { CountBadge } from '@/components/ui/CountBadge';
import { Icon } from '@/components/ui/Icon';
import { conversationPreview, formatConversationTime, type ConversationSummary } from '@/lib/chat';

export interface ConversationRowProps {
  conversation: ConversationSummary;
  userId: string;
  onPress: () => void;
}

export function ConversationRow({ conversation, userId, onPress }: ConversationRowProps) {
  const isUnread = conversation.unread_count > 0;
  const preview = conversationPreview(conversation, userId);
  const time = conversation.last_message_at
    ? formatConversationTime(conversation.last_message_at)
    : null;

  const accessibleName = [
    conversation.counterpart_name,
    conversation.muted ? 'muted' : null,
    isUnread ? `${conversation.unread_count} unread` : null,
    preview,
    time,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={accessibleName}
      accessibilityHint="Opens the conversation"
      className="min-h-tap flex-row items-center gap-3 px-4 py-3 active:bg-surface-muted">
      <Avatar name={conversation.counterpart_name} />

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className={`flex-1 text-primary ${isUnread ? 'type-label-lg' : 'type-text-primary'}`}
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}>
            {conversation.counterpart_name}
          </Text>
          {conversation.muted ? <Icon name="mute" size="sm" className="text-secondary" /> : null}
          {time ? (
            <Text
              className={`type-text-secondary ${isUnread ? 'text-primary' : 'text-secondary'}`}
              maxFontSizeMultiplier={1.5}>
              {time}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <Text
            className={`flex-1 ${
              isUnread ? 'type-label-sm text-primary' : 'type-text-secondary text-secondary'
            }`}
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}>
            {preview}
          </Text>
          <CountBadge count={conversation.unread_count} />
        </View>
      </View>
    </Pressable>
  );
}
