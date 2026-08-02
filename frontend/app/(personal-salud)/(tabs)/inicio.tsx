import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '../../../src/components/AppText';
import theme from '../../../src/theme';
import { clearUserSessionData } from '../../../src/utils/userSession';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function InicioPersonalSaludScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await clearUserSessionData();
    router.replace('/(public)/login' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h2" style={styles.title}>Panel de Salud</AppText>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={24} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <MaterialCommunityIcons name="clipboard-pulse-outline" size={80} color={theme.colors.primary} />
        <AppText variant="h3" style={styles.welcomeText}>¡Bienvenido(a)!</AppText>
        <AppText variant="body1" style={styles.subtitle}>
          Estamos construyendo las funciones para el Personal de Salud.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  title: {
    color: theme.colors.primary,
  },
  logoutButton: {
    padding: theme.spacing.s,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.m,
  },
  welcomeText: {
    color: '#333',
    marginTop: theme.spacing.m,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
  },
});
