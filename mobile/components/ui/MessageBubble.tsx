import { Text, View } from 'react-native';

export interface MessageBubbleProps {
  body: string;
  time: string;
  isMine: boolean;
  senderLabel: string;
  header?: React.ReactNode;
}

export function MessageBubble({ body, time, isMine, senderLabel, header }: MessageBubbleProps) {
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
      <Text
        aria-hidden
        className="type-text-secondary text-secondary"
        maxFontSizeMultiplier={1.5}>
        {time}
      </Text>
    </View>
  );
}
