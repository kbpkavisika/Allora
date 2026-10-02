import { Stack } from 'expo-router';

import { useReduceMotion } from '@/hooks/useReduceMotion';

export const unstable_settings = {
  initialRouteName: 'sign-in',
};

export default function AuthLayout() {
  const reduceMotion = useReduceMotion();
  return <Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'default', gestureEnabled: !reduceMotion }} />;
}
