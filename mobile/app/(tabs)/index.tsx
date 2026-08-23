import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-surface px-4">
      {/* TODO: replace with the Discover screen (design.md §09-01) */}
      <Text role="heading" className="type-h2 text-primary">
        Signed in
      </Text>
      <Text className="type-text-primary text-secondary">{session?.user.email}</Text>
      <Button
        variant="secondary"
        label="Log out"
        fullWidth={false}
        onPress={() => supabase.auth.signOut()}
      />
    </View>
  );
}
