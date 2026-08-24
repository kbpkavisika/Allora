import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'shop-registration',
};

export default function SellerLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
