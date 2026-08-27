import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
} from '@expo-google-fonts/archivo';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { BrandSplash } from '@/components/BrandSplash';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { ProfileProvider, useProfile } from '@/lib/ProfileProvider';
import { ShopProvider, useShop } from '@/lib/ShopProvider';

import '../global.css';


const SPLASH_MIN_MS = 1200;

SplashScreen.preventAutoHideAsync();

if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  SplashScreen.setOptions({ fade: true, duration: 200 });
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ShopProvider>
          <RootNavigator />
        </ShopProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { isLoading: isShopLoading } = useShop();
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const [minHoldElapsed, setMinHoldElapsed] = useState(false);

  const ready = fontsLoaded && !isLoading && !isProfileLoading && !isShopLoading;
  // Defaults to "in the app" while the profile is still loading (masked by the splash below)
  // so exactly one Stack.Protected guard is ever true — never zero, which expo-router can get
  // stuck on if the current screen falls outside every protected branch at once.
  const needsOnboarding = !!session && !isProfileLoading && (profile?.role ?? null) === null;
  const showApp = !!session && !needsOnboarding;
  const isSeller = profile?.role === 'seller';

  useEffect(() => {
    const timer = setTimeout(() => setMinHoldElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

 
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Protected guard={showApp && !isSeller}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={showApp && isSeller}>
          <Stack.Screen name="(seller)" options={{ headerShown: false }} />
          <Stack.Screen
            name="seller/add-product"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="seller/edit-product"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="seller/shop-registration"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen name="seller/store-setup" options={{ headerShown: false }} />
          <Stack.Screen name="seller/products" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={showApp}>
          <Stack.Screen
            name="account/edit-profile"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="account/address"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="account/reset-password"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack.Protected>

        <Stack.Protected guard={needsOnboarding}>
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {(!ready || !minHoldElapsed) && <BrandSplash />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
