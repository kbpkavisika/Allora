import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ConversationList } from '@/components/chat/ConversationList';
import { TopBar } from '@/components/ui/TopBar';

export default function BuyerInboxScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={t('account.buyer.messages')} />
      <ConversationList emptyMessage={t('chat.buyerEmpty')} />
    </View>
  );
}
