import { View } from 'react-native';

import { ConversationList } from '@/components/chat/ConversationList';
import { TopBar } from '@/components/ui/TopBar';

export default function BuyerInboxScreen() {
  return (
    <View className="flex-1 bg-surface">
      <TopBar title="Messages" />
      <ConversationList emptyMessage="Tap Chat with seller on a product or order to ask a question." />
    </View>
  );
}
