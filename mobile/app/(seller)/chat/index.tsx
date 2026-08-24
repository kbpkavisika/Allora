import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';

export default function SellerChatScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-surface px-8">
      <Icon name="chat" size="lg" className="text-secondary" />
      <Text role="heading" className="type-h3 text-primary">
        No messages yet
      </Text>
      <Text className="type-text-primary text-center text-secondary">
        Buyer conversations about your products will show up here.
      </Text>
    </View>
  );
}
