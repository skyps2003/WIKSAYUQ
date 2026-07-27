import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../src/components/AppText';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AppConfirmDialog } from '../../../src/components/AppConfirmDialog';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import theme from '../../../src/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../src/utils/webStorage';
import API_URL from '../../../src/config/api';
import { fetchWithTimeout } from '../../../src/utils/fetchWithTimeout';
import { OfflineDataService } from '../../../src/services/offline-data.service';

export default function SosScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<any[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchContacts();
    startPulse();
  }, []);

  const startPulse = () => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  };

  const fetchContacts = async () => {
    try {
      const token = await getItemAsync('userToken');
      const response = await fetchWithTimeout(`${API_URL}/contactos`, {
        timeout: 12000,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudieron cargar los contactos');
      }

      setContacts(result.data);
      await OfflineDataService.cacheContacts(result.data);
    } catch (error) {
      console.error('Error fetching contacts for SOS:', error);
      setContacts(await OfflineDataService.getCachedContacts());
    }
  };

  const handleSendSMS = async () => {
    if (contacts.length === 0) {
      setAlertMessage(t('sos.no_contactos'));
      setShowAlert(true);
      return;
    }
    const phones = contacts.map(c => c.telefono_principal).join(',');
    const userWeeks = await getItemAsync('userWeeks') || '??';
    const mensaje = t('contactos.mensaje_sos', { semanas: userWeeks });
    Linking.openURL(`sms:${phones}?body=${encodeURIComponent(mensaje)}`);
  };

  const handleCallContact = () => {
    if (contacts.length === 0) {
      setAlertMessage(t('sos.no_contactos'));
      setShowAlert(true);
      return;
    }
    Linking.openURL(`tel:${contacts[0].telefono_principal}`);
  };

  const handleCallHealthCenter = () => {
    Linking.openURL(`tel:106`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('sos.titulo')} showBack={false} />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Animated SOS Button */}
        <View style={styles.sosContainer}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.pulseInner}>
              <TouchableOpacity style={styles.sosButton} activeOpacity={0.8}>
                <AppText variant="h1" color="#fff" style={{ fontSize: 48, fontWeight: 'bold' }}>{t('sos.boton_sos')}</AppText>
                <AppText variant="body2" color="#fff">{t('sos.titulo')}</AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <AppText variant="body1" align="center" color={colors.textSecondary} style={styles.warningText}>
          {t('sos.advertencia')}
        </AppText>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCallHealthCenter}>
            <MaterialCommunityIcons name="ambulance" size={24} color={colors.danger} />
            <AppText variant="body1" color={colors.textPrimary} style={styles.actionText}>
              {t('sos.llamar_samu')}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSendSMS}>
            <MaterialCommunityIcons name="message-alert-outline" size={24} color={colors.primary} />
            <AppText variant="body1" color={colors.textPrimary} style={styles.actionText}>
              {t('sos.enviar_sms')}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCallContact}>
            <MaterialCommunityIcons name="phone-outgoing" size={24} color={colors.primary} />
            <AppText variant="body1" color={colors.textPrimary} style={styles.actionText}>
              {t('sos.llamar_contacto')}
            </AppText>
          </TouchableOpacity>
        </View>

      </ScrollView>
      <AppConfirmDialog
        visible={showAlert}
        title={t('sos.atencion')}
        message={alertMessage}
        icon="alert-circle"
        iconColor={colors.danger}
        buttons={[{ text: 'OK', onPress: () => setShowAlert(false) }]}
        onClose={() => setShowAlert(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
    paddingBottom: 100,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: '100%',
    marginTop: spacing.m,
  },
  pulseOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(235, 87, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(235, 87, 87, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EB5757',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EB5757',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  warningText: {
    marginTop: spacing.l,
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.m,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: theme.radius.m,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionText: {
    marginLeft: spacing.m,
    fontWeight: 'bold',
  },
});
