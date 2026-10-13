import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { formatVoiceDuration } from '@/lib/chat';

export interface VoiceNotePlayerProps {
  url: string;
  durationMs: number;
  isMine: boolean;
}

export function VoiceNotePlayer({ url, durationMs, isMine }: VoiceNotePlayerProps) {
  const { t } = useTranslation();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [isLoaded, setIsLoaded] = useState(false);

  const totalMs = status.duration > 0 ? status.duration * 1000 : durationMs;
  const elapsedMs = isLoaded ? status.currentTime * 1000 : 0;
  const reachedEnd = status.duration > 0 && status.currentTime >= status.duration - 0.05;
  const tone = isMine ? 'text-surface' : 'text-primary';

  async function toggle() {
    if (status.playing) {
      player.pause();
      return;
    }

    await setAudioModeAsync({ playsInSilentMode: true });

    if (!isLoaded) {
      player.replace(url);
      setIsLoaded(true);
    } else if (reachedEnd) {
      await player.seekTo(0);
    }

    player.play();
  }

  return (
    <View className="flex-row items-center gap-3">
      <IconButton
        icon={<Icon name={status.playing ? 'pause' : 'play'} size="md" className="text-primary" />}
        label={
          status.playing
            ? t('chat.pauseVoice')
            : t('chat.playVoice', { duration: formatVoiceDuration(durationMs) })
        }
        variant="outlined"
        onPress={toggle}
      />
      <Text className={`type-mono ${tone}`} maxFontSizeMultiplier={2}>
        {isLoaded
          ? `${formatVoiceDuration(elapsedMs)} / ${formatVoiceDuration(totalMs)}`
          : formatVoiceDuration(durationMs)}
      </Text>
    </View>
  );
}
