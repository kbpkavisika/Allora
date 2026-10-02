import { ConversationList } from '@/components/chat/ConversationList';
import { useTranslation } from 'react-i18next';

export default function SellerChatScreen() {
  const { t } = useTranslation();

  return <ConversationList emptyMessage={t('seller.chat.empty')} />;
}
