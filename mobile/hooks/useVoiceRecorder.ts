import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback } from 'react';

export interface VoiceRecording {
  uri: string;
  durationMs: number;
}

export type StartRecordingResult = 'recording' | 'denied' | 'failed';

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 250);

  const start = useCallback(async (): Promise<StartRecordingResult> => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) return 'denied';

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      return 'recording';
    } catch {
      return 'failed';
    }
  }, [recorder]);

  const stopRecorder = useCallback(async () => {
    const durationMs = Math.round(recorder.currentTime * 1000);
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    return durationMs;
  }, [recorder]);

  const finish = useCallback(async (): Promise<VoiceRecording | null> => {
    const durationMs = await stopRecorder();
    return recorder.uri && durationMs > 0 ? { uri: recorder.uri, durationMs } : null;
  }, [recorder, stopRecorder]);

  const cancel = useCallback(async () => {
    await stopRecorder();
  }, [stopRecorder]);

  return {
    isRecording: state.isRecording,
    durationMs: state.durationMillis,
    start,
    finish,
    cancel,
  };
}
