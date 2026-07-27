import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { getItemAsync } from '../src/utils/webStorage';
import theme from '../src/theme';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await getItemAsync('isLoggedIn');
        const userRole = await getItemAsync('userRole');
        const savedLanguage = await getItemAsync('wiksayuq.language');

        if (authStatus === 'true') {
          if (userRole === 'personal_salud') {
            router.replace('/(personal-salud)/(tabs)/inicio' as any);
          } else {
            router.replace('/(gestante)/(tabs)/inicio' as any);
          }
        } else if (!savedLanguage) {
          router.replace('/(public)/bienvenida' as any);
        } else {
          router.replace('/(public)/login' as any);
        }
      } catch (error) {
        console.error('Error checking auth', error);
        router.replace('/(public)/login' as any);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.backgroundSoft }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return null;
}
