import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import theme from '../../src/theme';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

export default function BienvenidaScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await SecureStore.setItemAsync('wiksayuq.language', lang);
  };

  const continueToLogin = async () => {
    const lang = i18n.language === 'qu' ? 'qu' : 'es';
    await SecureStore.setItemAsync('wiksayuq.language', lang);
    router.replace('/(public)/login' as any);
  };

  const isEs = i18n.language === 'es';
  const isQu = i18n.language === 'qu';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <AppText variant="h2" align="center" style={styles.promptText}>
          {t('bienvenida.elige_idioma')}
        </AppText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.langCard, isEs && styles.langCardActive]}
            onPress={() => handleLanguageChange('es')}
            activeOpacity={0.8}
          >
            <View style={styles.langInfo}>
              <AppText variant="h3" color={isEs ? theme.colors.primary : theme.colors.textPrimary}>
                Español
              </AppText>
            </View>
            {isEs && <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.langCard, isQu && styles.langCardActive]}
            onPress={() => handleLanguageChange('qu')}
            activeOpacity={0.8}
          >
            <View style={styles.langInfo}>
              <AppText variant="h3" color={isQu ? theme.colors.primary : theme.colors.textPrimary}>
                Runasimi (Quechua)
              </AppText>
            </View>
            {isQu && <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <AppButton 
            title={t('bienvenida.continuar')}
            onPress={continueToLogin}
            style={styles.continueButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background blends the logo
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 280,
    height: 280,
  },
  promptText: {
    marginBottom: theme.spacing.xl,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.m,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#EEEEEE',
    borderRadius: theme.radius.l,
    padding: theme.spacing.l,
  },
  langCardActive: {
    backgroundColor: theme.colors.roseLight,
    borderColor: theme.colors.primary,
  },
  langInfo: {
    flex: 1,
  },
  footer: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: theme.spacing.l,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 18,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
