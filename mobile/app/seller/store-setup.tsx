import { Text } from 'react-native';

import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function StoreSetupScreen() {
  return (
    <KeyboardScreen>
      <ScreenHeader
        title="Set up your shop"
        subtitle="Routing check for step 2. The full wizard replaces this screen next."
        showBack={false}
        className="mb-6"
      />

      <Text className="type-text-primary text-secondary">
        You are seeing this because you chose the seller role and have not created a shop yet.
      </Text>
    </KeyboardScreen>
  );
}
