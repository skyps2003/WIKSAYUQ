import { Stack } from 'expo-router';
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { initDB } from '../src/database';
import { SyncService } from '../src/services/sync/sync.service';
import '../src/i18n';
import { ToastProvider } from '../src/components/AppToast';

export default function RootLayout() {
  useEffect(() => {
    try {
      initDB();
      SyncService.sync();
    } catch (e) {
      console.error('Error initializing DB:', e);
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        SyncService.sync();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <ToastProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(gestante)" />
        <Stack.Screen name="(personal-salud)" />
      </Stack>
    </ToastProvider>
  );
}
