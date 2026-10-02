import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import {
  notificationConversationId,
  registerPushToken,
  useLastNotificationResponse,
} from '@/lib/notifications';

export function usePushNotifications(userId: string | undefined, canNavigate: boolean) {
  const { i18n } = useTranslation();
  const response = useLastNotificationResponse();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (userId) registerPushToken(i18n.language);
  }, [userId, i18n.language]);

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
