import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ImageBackground, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/AppText';
import { AppConfirmDialog } from '../../src/components/AppConfirmDialog';
import theme from '../../src/theme';
import { useRouter } from 'expo-router';
import { getItemAsync, setItemAsync } from '../../src/utils/webStorage';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import API_URL from '../../src/config/api';
import { fetchWithTimeout, readApiResponse } from '../../src/utils/fetchWithTimeout';
import { clearUserSessionData } from '../../src/utils/userSession';
import { calculateGestationalWeeks, getTrimesterKey } from '../../src/utils/gestation';
import { OfflineDataService } from '../../src/services/offline-data.service';

export default function LoginScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState('');
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [dialog, setDialog] = useState({ visible: false, title: '', message: '' });

  const showError = (title: string, message: string) => setDialog({ visible: true, title, message });

  const requestLogin = async (timeout: number) => {
    const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, pin }),
      timeout,
    });

    if ([502, 503, 504].includes(response.status)) {
      throw new Error(`SERVER_STARTING_${response.status}`);
    }

    return response;
  };

  useEffect(() => {
    const loadLanguagePreference = async () => {
      const savedLanguage = await getItemAsync('wiksayuq.language');
      setShowLanguageSelection(!savedLanguage);
    };

    loadLanguagePreference();
  }, []);

  const handleLogin = async () => {
    if (!dni || !pin) {
      showError("Error", t('login.dni') + " / " + t('login.pin'));
      return;
    }
    
    const network = await NetInfo.fetch();
    if (network.isConnected === false || network.isInternetReachable === false) {
      showError('Sin conexión', 'Conéctate a internet para iniciar sesión. Después podrás usar las funciones guardadas sin conexión.');
      return;
    }

    setLoading(true);
    setLoginStatus('Conectando...');
    const slowServerTimer = setTimeout(() => {
      setLoginStatus('Iniciando servidor, espera...');
    }, 4000);

    try {
      let response: Response;
      try {
        response = await requestLogin(45000);
      } catch (firstError) {
        console.warn('Primer intento de login falló; reintentando:', firstError);
        setLoginStatus('Servidor iniciando, reintentando...');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        response = await requestLogin(30000);
      }

      const result = await readApiResponse<any>(response);

      if (result.success) {
        await clearUserSessionData();
        await setItemAsync('userToken', result.data.token);
        await setItemAsync('isLoggedIn', 'true');
        
        const user = result.data.user;
        await setItemAsync('userName', user.nombres.split(' ')[0]);
        await setItemAsync('userFullName', user.nombres);
        await setItemAsync('userDni', user.dni);
        await setItemAsync('userRole', user.rol.toLowerCase());
        
        if (user.foto_base64) {
          await setItemAsync('userPhoto', user.foto_base64);
        }

        if (user.fum) {
          await setItemAsync('userFum', user.fum);
          const weeks = calculateGestationalWeeks(user.fum);
          if (weeks !== null) {
            await setItemAsync('userWeeks', weeks.toString());
            await setItemAsync('userTrimester', getTrimesterKey(weeks));
          }
        }

        const preferredCenter = user.establecimiento_id && user.centro_salud
          ? { id: user.establecimiento_id, nombre: user.centro_salud }
          : await OfflineDataService.getPreferredHealthCenter(user.dni);
        if (preferredCenter) {
          await setItemAsync('userCentroSaludId', preferredCenter.id);
          await setItemAsync('userCentroSalud', preferredCenter.nombre);
          await OfflineDataService.savePreferredHealthCenter(preferredCenter, user.dni);
        }
        
        if (user.rol === 'PERSONAL_SALUD') {
          router.replace('/(personal-salud)/(tabs)/inicio' as any);
        } else {
          router.replace('/(gestante)/(tabs)/inicio' as any);
        }
      } else {
        showError("Error", result.message || "Credenciales incorrectas");
      }
    } catch (error) {
      console.error(error);
      showError(
        'Servidor no disponible',
        'El servidor tardó demasiado en responder. Espera un momento y vuelve a intentar.'
      );
    } finally {
      clearTimeout(slowServerTimer);
      setLoading(false);
      setLoginStatus('');
    }
  };

  const selectLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await setItemAsync('wiksayuq.language', lang);
    setShowLanguageSelection(false);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/login_bg.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
          >
            
            {/* Header / Logo */}
            <View style={styles.headerContainer}>
              <Image 
                source={require('../../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <AppText variant="h1" style={styles.mainTitle}>WIKSA<AppText variant="h1" style={styles.mainTitleAccent}>YUQ</AppText></AppText>
              <AppText variant="body1" style={styles.subtitle}>{t('login.subtitulo')}</AppText>
            </View>

            {showLanguageSelection && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionTitleRow}>
                  <MaterialCommunityIcons name="leaf" size={20} color={theme.colors.primary} style={{ transform: [{ scaleX: -1 }] }} />
                  <AppText variant="h3" style={styles.sectionTitle}>{t('login.elige_idioma') || 'Elige tu idioma'}</AppText>
                  <MaterialCommunityIcons name="leaf" size={20} color={theme.colors.primary} />
                </View>

                <TouchableOpacity 
                  style={[styles.langCard, i18n.language === 'es' && styles.langCardSelected]} 
                  onPress={() => selectLanguage('es')}
                  activeOpacity={0.7}
                >
                  <View style={styles.langLeft}>
                    <MaterialCommunityIcons name="web" size={24} color={i18n.language === 'es' ? theme.colors.primary : '#888'} />
                    <AppText variant="body1" style={[styles.langText, i18n.language === 'es' && styles.langTextSelected]}>Español</AppText>
                  </View>
                  <MaterialCommunityIcons 
                    name={i18n.language === 'es' ? "check-circle" : "checkbox-blank-circle-outline"} 
                    size={24} 
                    color={i18n.language === 'es' ? theme.colors.primary : '#DDD'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.langCard, i18n.language === 'qu' && styles.langCardSelected]} 
                  onPress={() => selectLanguage('qu')}
                  activeOpacity={0.7}
                >
                  <View style={styles.langLeft}>
                    <MaterialCommunityIcons name="web" size={24} color={i18n.language === 'qu' ? theme.colors.primary : '#888'} />
                    <AppText variant="body1" style={[styles.langText, i18n.language === 'qu' && styles.langTextSelected]}>Runasimi (Quechua)</AppText>
                  </View>
                  <MaterialCommunityIcons 
                    name={i18n.language === 'qu' ? "check-circle" : "checkbox-blank-circle-outline"} 
                    size={24} 
                    color={i18n.language === 'qu' ? theme.colors.primary : '#DDD'} 
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Login Form */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="leaf" size={20} color={theme.colors.primary} style={{ transform: [{ scaleX: -1 }] }} />
                <AppText variant="h3" style={styles.sectionTitle}>{t('login.titulo')}</AppText>
                <MaterialCommunityIcons name="leaf" size={20} color={theme.colors.primary} />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="card-account-details-outline" size={24} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('login.dni')}
                  keyboardType="numeric" 
                  maxLength={8}
                  placeholderTextColor="#999"
                  value={dni}
                  onChangeText={setDni}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-outline" size={24} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('login.pin')}
                  keyboardType="numeric" 
                  maxLength={4}
                  secureTextEntry={!showPin}
                  placeholderTextColor="#999"
                  value={pin}
                  onChangeText={setPin}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons 
                    name={showPin ? "eye" : "eye-off"} 
                    size={22} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleLogin}
                disabled={loading}
              >
                <AppText variant="body1" style={styles.primaryButtonText}>
                  {loading ? loginStatus || t('login.verificando') : t('login.ingresar')}
                </AppText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => router.push('/(public)/registro' as any)}
              >
                <AppText variant="body1" style={styles.secondaryButtonText}>
                  {t('login.no_cuenta')}
                </AppText>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.primary} />
              </TouchableOpacity>

              <View style={styles.academicNotice}>
                <MaterialCommunityIcons name="information-outline" size={18} color={theme.colors.terracotta} />
                <AppText variant="caption" style={styles.academicNoticeText}>
                  Este sistema es un prototipo académico y no reemplaza la evaluación, diagnóstico o recomendación de un profesional de la salud.
                </AppText>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AppConfirmDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        icon="alert-circle"
        iconColor={theme.colors.danger}
        buttons={[{ text: 'OK', onPress: () => setDialog(d => ({ ...d, visible: false })) }]}
        onClose={() => setDialog(d => ({ ...d, visible: false }))}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF9F9',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    justifyContent: 'center',
    paddingTop: theme.spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: theme.spacing.s,
  },
  mainTitle: {
    fontSize: 42,
    letterSpacing: 2,
    color: '#E87D8F',
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  mainTitleAccent: {
    fontSize: 42,
    letterSpacing: 2,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    fontSize: 15,
  },
  sectionContainer: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.m,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  sectionTitle: {
    color: '#555',
    fontSize: 22,
    fontWeight: '700',
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 20,
    padding: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
  },
  langCardSelected: {
    backgroundColor: '#FFF0F3',
    borderColor: theme.colors.primary,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  langText: {
    color: '#666',
    fontWeight: '600',
  },
  langTextSelected: {
    color: theme.colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.l,
    height: 56,
  },
  inputIcon: {
    marginRight: theme.spacing.m,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.s,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 18,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 20,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  academicNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.s,
    marginTop: theme.spacing.m,
    padding: theme.spacing.m,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: theme.radius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  academicNoticeText: {
    flex: 1,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
