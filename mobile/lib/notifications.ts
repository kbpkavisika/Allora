import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export const MESSAGES_CHANNEL_ID = 'messages';

let activeConversationId: string | null = null;
let registeredToken: string | null = null;

export function setActiveConversation(conversationId: string | null) {
  activeConversationId = conversationId;
}

export function notificationConversationId(
  notification: Notifications.Notification
): string | null {
  const conversationId = notification.request.content.data?.conversation_id;
  return typeof conversationId === 'string' ? conversationId : null;
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isOpen = notificationConversationId(notification) === activeConversationId;

    return {
      shouldShowBanner: !isOpen,
      shouldShowList: !isOpen,
      shouldPlaySound: !isOpen,
      shouldSetBadge: false,
    };
  },
});

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(MESSAGES_CHANNEL_ID, {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

export async function registerPushToken(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;

    const { error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_platform: Platform.OS,
    });
    if (!error) registeredToken = token;
  } catch {
    // Remote push is unavailable in Expo Go on Android and on simulators; chat still works live.
  }
}

export async function unregisterPushToken(): Promise<void> {
  if (!registeredToken) return;

  await supabase.rpc('unregister_push_token', { p_token: registeredToken });
  registeredToken = null;
}
