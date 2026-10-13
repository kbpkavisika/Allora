import { Text, View } from 'react-native';

export interface MessageBubbleProps {
  body: string;
  time: string;
  isMine: boolean;
  senderLabel: string;
  header?: React.ReactNode;
  status?: string | null;
  media?: React.ReactNode;
}

export function MessageBubble({
  body,
  time,
  isMine,
  senderLabel,
  header,
  status,
  media,
}: MessageBubbleProps) {
  const caption = status ? `${time} · ${status}` : time;
  const hasMedia = Boolean(media);

  return (
    <View className={`max-w-[80%] gap-1 ${isMine ? 'items-end self-end' : 'items-start self-start'}`}>
      {header}
      <View
        accessible={!hasMedia}
        aria-label={hasMedia ? undefined : `${senderLabel}, ${caption}: ${body}`}
        className={`gap-2 rounded-12 px-4 py-3 ${isMine ? 'bg-primary' : 'bg-surface-sunken'}`}>
        {media}
        {body ? (
          <Text
            className={`type-text-primary ${isMine ? 'text-surface' : 'text-primary'}`}
            maxFontSizeMultiplier={2}>
            {body}
          </Text>
        ) : null}
      </View>
      <Text
        aria-hidden={!hasMedia}
        aria-label={hasMedia ? `${senderLabel}, ${caption}` : undefined}
        className="type-text-secondary text-secondary"
        maxFontSizeMultiplier={1.5}>
        {caption}
      </Text>
    </View>
  );
}
