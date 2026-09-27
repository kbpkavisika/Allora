import { useLastNotificationResponse } from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { notificationConversationId, registerPushToken } from '@/lib/notifications';

export function usePushNotifications(userId: string | undefined, canNavigate: boolean) {
  const response = useLastNotificationResponse();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (userId) registerPushToken();
  }, [userId]);

  useEffect(() => {
    if (!response || !canNavigate) return;

    const responseId = response.notification.request.identifier;
    if (handledResponseId.current === responseId) return;
    handledResponseId.current = responseId;

    const conversationId = notificationConversationId(response.notification);
    if (conversationId) {
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    }
  }, [response, canNavigate]);
}
