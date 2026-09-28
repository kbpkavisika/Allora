import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';

export interface MessageBubbleProps {
  body: string;
  time: string;
  isMine: boolean;
  senderLabel: string;
  header?: React.ReactNode;
  isSpeaking?: boolean;
  onReadAloud?: () => void;
}

export function MessageBubble({
  body,
  time,
  isMine,
  senderLabel,
  header,
  isSpeaking = false,
  onReadAloud,
}: MessageBubbleProps) {
  return (
    <View className={`max-w-[80%] gap-1 ${isMine ? 'items-end self-end' : 'items-start self-start'}`}>
      {header}
      <View
        accessible
        aria-label={`${senderLabel}, ${time}: ${body}`}
        className={`rounded-12 px-4 py-3 ${isMine ? 'bg-primary' : 'bg-surface-sunken'}`}>
        <Text
          className={`type-text-primary ${isMine ? 'text-surface' : 'text-primary'}`}
          maxFontSizeMultiplier={2}>
          {body}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Text
          aria-hidden
          className="type-text-secondary text-secondary"
          maxFontSizeMultiplier={1.5}>
          {time}
        </Text>
        {onReadAloud ? (
          <IconButton
            diameter={32}
            icon={<Icon name={isSpeaking ? 'stop' : 'speak'} size="sm" className="text-secondary" />}
            label={isSpeaking ? 'Stop reading' : `Read message from ${senderLabel} aloud`}
            hint={isSpeaking ? 'Stops reading this message' : 'Speaks this message out loud'}
            onPress={onReadAloud}
          />
        ) : null}
      </View>
    </View>
  );
}
