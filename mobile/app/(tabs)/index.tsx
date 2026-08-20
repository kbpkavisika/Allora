import { Link } from 'expo-router';
import { View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-surface">
      {/* TODO: remove once the real entry point exists */}
      <Link href="/sign-in" role="link" className="type-label-lg text-primary underline">
        Sign in
      </Link>
      <Link href="/sign-up" role="link" className="type-label-lg text-primary underline">
        Create an account
      </Link>
    </View>
  );
}
