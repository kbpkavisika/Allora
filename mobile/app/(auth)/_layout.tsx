import { Stack } from 'expo-router';

// Without this the group's landing route falls out of filename ordering, which puts
// create-password first — and that screen bounces to /sign-up when it has no email param.
export const unstable_settings = {
  initialRouteName: 'sign-in',
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
