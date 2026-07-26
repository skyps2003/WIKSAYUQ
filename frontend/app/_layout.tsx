import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { initDB } from '../src/database';
import { SyncService } from '../src/services/sync/sync.service';
import '../src/i18n';
import { ToastProvider } from '../src/components/AppToast';
import { OfflineNotice } from '../src/components/OfflineNotice';

export default function RootLayout() {
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    try {
      initDB();
      SyncService.sync();
    } catch (e) {
      console.error('Error initializing DB:', e);
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;

      if (isOnline) {
        setShowOfflineNotice(false);
        SyncService.sync();
      } else if (isOffline) {
        setShowOfflineNotice(true);
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
      <OfflineNotice
        visible={showOfflineNotice}
        onDismiss={() => setShowOfflineNotice(false)}
      />
    </ToastProvider>
  );
}
