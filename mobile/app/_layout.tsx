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

import '../global.css';


const SPLASH_MIN_MS = 1200;

SplashScreen.preventAutoHideAsync();

if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  SplashScreen.setOptions({ fade: true, duration: 200 });
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useAuth();
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

  const ready = fontsLoaded && !isLoading;

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
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
