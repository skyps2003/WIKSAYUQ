import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, Image, Keyboard, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useToast } from '../../src/components/AppToast';
import { colors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../src/utils/webStorage';
import { useTranslation } from 'react-i18next';
import API_URL from '../../src/config/api';
import { fetchWithTimeout } from '../../src/utils/fetchWithTimeout';

export default function MisDatosScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const pinRef = useRef<View>(null);
  const confirmPinRef = useRef<View>(null);
  const keyboardHeight = useKeyboardHeight();

  const [userData, setUserData] = useState({
    fullName: '',
    dni: '',
    age: '',
    centroSalud: '',
    weeks: '',
    photo: null as string | null,
  });

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fullName = await getItemAsync('userFullName') || 'María Quispe';
        const dni = await getItemAsync('userDni') || '-';
        const age = await getItemAsync('userAge') || '-';
        const centroSalud = await getItemAsync('userCentroSalud') || '-';
        const weeks = await getItemAsync('userWeeks') || '0';
        const photo = await getItemAsync('userPhoto') || null;
        setUserData({ fullName, dni, age, centroSalud, weeks, photo });
      } catch (error) {
        console.error('Error loading data', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeField && keyboardHeight > 0) {
      setTimeout(() => {
        const yTarget = activeField === 'newPin' ? 400 : 480;
        scrollViewRef.current?.scrollTo({ y: yTarget, animated: true });
      }, 150);
    }
  }, [activeField, keyboardHeight]);

  const { showToast } = useToast();

  const handleChangePin = async () => {
    if (!newPin || !confirmPin) {
      showToast({ message: t('mis_datos.error_campos'), type: 'error' });
      return;
    }
    if (newPin.length !== 4) {
      showToast({ message: t('mis_datos.error_longitud'), type: 'error' });
      return;
    }
    if (newPin !== confirmPin) {
      showToast({ message: t('mis_datos.error_coincidencia'), type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const token = await getItemAsync('userToken');
      const response = await fetchWithTimeout(`${API_URL}/auth/change-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPin }),
        timeout: 25000 // 25s timeout for Render cold start
      });

      const result = await response.json();
      if (response.ok && result.success) {
        showToast({ message: t('mis_datos.exito'), type: 'success' });
        Keyboard.dismiss();
        setActiveField(null);
        setNewPin('');
        setConfirmPin('');
        router.back();
      } else {
        showToast({ message: result.message || t('mis_datos.error_conexion'), type: 'error' });
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.message?.includes('Timeout') 
        ? 'El servidor tardó en responder. Intenta de nuevo.' 
        : t('mis_datos.error_conexion');
      showToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const initials = userData.fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('mis_datos.titulo')} showBack={true} />

      <View style={[styles.innerContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 0 }]}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
          {/* Foto de perfil */}
          <View style={styles.photoSection}>
            <View style={styles.photoCircle}>
              {userData.photo ? (
                <Image source={{ uri: userData.photo }} style={styles.photoImage} />
              ) : (
                <AppText variant="h2" style={styles.photoInitials}>{initials}</AppText>
              )}
              <TouchableOpacity style={styles.photoEditBadge}>
                <MaterialCommunityIcons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <AppText variant="body2" color={colors.textSecondary} style={{ marginTop: spacing.s }}>
              {userData.fullName}
            </AppText>
          </View>

          {/* User Info Card */}
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="card-account-details-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <AppText variant="caption" color={colors.textSecondary}>{t('mis_datos.dni')}</AppText>
                <AppText variant="body1" style={styles.valueText}>{userData.dni}</AppText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="account-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <AppText variant="caption" color={colors.textSecondary}>{t('mis_datos.nombres')}</AppText>
                <AppText variant="body1" style={styles.valueText}>{userData.fullName}</AppText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="calendar-account" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <AppText variant="caption" color={colors.textSecondary}>{t('mis_datos.edad')}</AppText>
                <AppText variant="body1" style={styles.valueText}>{userData.age} {t('mis_datos.anos')}</AppText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="human-pregnant" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <AppText variant="caption" color={colors.textSecondary}>{t('mis_datos.semanas_label')}</AppText>
                <AppText variant="body1" style={styles.valueText}>{userData.weeks} {t('mis_datos.semanas_val')}</AppText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="home-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <AppText variant="caption" color={colors.textSecondary}>{t('mis_datos.comunidad')}</AppText>
                <AppText variant="body1" style={styles.valueText}>{userData.centroSalud}</AppText>
              </View>
            </View>
          </View>

          <AppText variant="h3" style={styles.sectionTitle}>{t('mis_datos.cambiar_pin')}</AppText>

          {/* Change PIN Form */}
          <View style={styles.card}>
            <View ref={pinRef} style={styles.inputWithIcon}>
              <TextInput
                style={styles.inputField}
                placeholder={t('mis_datos.nuevo_pin')}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showNewPin}
                placeholderTextColor={colors.textSecondary}
                value={newPin}
                onChangeText={(v) => setNewPin(v.replace(/[^0-9]/g, '').substring(0, 4))}
                onFocus={() => setActiveField('newPin')}
                onBlur={() => setActiveField(null)}
                showSoftInputOnFocus={true}
              />
              <TouchableOpacity onPress={() => setShowNewPin(!showNewPin)} style={{ padding: 4 }}>
                <MaterialCommunityIcons
                  name={showNewPin ? "eye" : "eye-off"}
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View ref={confirmPinRef} style={styles.inputWithIcon}>
              <TextInput
                style={styles.inputField}
                placeholder={t('mis_datos.repetir_pin')}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showConfirmPin}
                placeholderTextColor={colors.textSecondary}
                value={confirmPin}
                onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, '').substring(0, 4))}
                onFocus={() => setActiveField('confirmPin')}
                onBlur={() => setActiveField(null)}
                showSoftInputOnFocus={true}
              />
              <TouchableOpacity onPress={() => setShowConfirmPin(!showConfirmPin)} style={{ padding: 4 }}>
                <MaterialCommunityIcons
                  name={showConfirmPin ? "eye" : "eye-off"}
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <AppButton
              title={loading ? t('mis_datos.actualizando') : t('mis_datos.actualizar_btn')}
              onPress={handleChangePin}
              disabled={loading}
              style={{ marginTop: spacing.m }}
            />
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  photoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  photoInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.l,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: spacing.m,
    flex: 1,
  },
  valueText: {
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F4F4',
    marginLeft: 56,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#333',
    marginBottom: spacing.m,
    marginLeft: 8,
    fontSize: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: radius.l,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
    height: 56,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  }
});
