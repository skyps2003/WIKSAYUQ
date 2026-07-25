import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../src/components/AppText';
import theme from '../../../src/theme';
import { colors } from '../../../src/theme/colors';
import { radius, spacing } from '../../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import API_URL from '../../../src/config/api';
import { DailyTipBanner } from '../../../src/components/DailyTipBanner';
import { calculateGestationalWeeks, getTrimesterKey } from '../../../src/utils/gestation';

export default function InicioGestanteScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const getMenuItems = () => [
    { id: '1', title: t('inicio.menu.controles'), icon: 'clipboard-pulse', route: '/(gestante)/controles', bg: colors.roseLight, iconColor: colors.primary },
    { id: '2', title: t('inicio.menu.signos_alarma'), icon: 'alert', route: '/(gestante)/autoevaluacion', bg: '#FEE2E2', iconColor: colors.danger },
    { id: '3', title: t('inicio.menu.educacion'), icon: 'book-open-page-variant', route: '/(gestante)/educacion' as const, bg: colors.roseLight, iconColor: colors.primary },
    { id: '4', title: t('inicio.menu.embarazo'), icon: 'human-pregnant', route: '/embarazo', bg: colors.roseLight, iconColor: colors.primary },
    { id: '5', title: t('inicio.menu.emergencia'), icon: 'phone', route: '/sos', bg: '#FEE2E2', iconColor: colors.danger },
    { id: '6', title: t('inicio.menu.centro_salud'), icon: 'hospital-building', route: '/(gestante)/establecimientos', bg: colors.roseLight, iconColor: colors.primary },
  ];
  
  const [userName, setUserName] = useState('');
  const [weeks, setWeeks] = useState('0');
  const [trimesterKey, setTrimesterKey] = useState('trimestre_1');
  const [nextCitaDate, setNextCitaDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [nextCitaMotivo, setNextCitaMotivo] = useState('');
  const [nextCitaEstablecimiento, setNextCitaEstablecimiento] = useState('');

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          const name = await SecureStore.getItemAsync('userName');
          const wk = await SecureStore.getItemAsync('userWeeks');
          const fum = await SecureStore.getItemAsync('userFum');
          const calculatedWeeks = calculateGestationalWeeks(fum);
          
          if (name) setUserName(name);
          if (calculatedWeeks !== null) {
            const nextWeeks = calculatedWeeks.toString();
            setWeeks(nextWeeks);
            setTrimesterKey(getTrimesterKey(calculatedWeeks));
            await SecureStore.setItemAsync('userWeeks', nextWeeks);
          } else if (wk) {
            const parsedWeeks = parseInt(wk, 10);
            setWeeks(wk);
            setTrimesterKey(getTrimesterKey(Number.isNaN(parsedWeeks) ? 0 : parsedWeeks));
          }
        } catch (error) {
          console.error('Error loading user data', error);
        }
      };
      loadUserData();
      fetchNextCita();
    }, [])
  );

  const fetchNextCita = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const centroSaludId = await SecureStore.getItemAsync('userCentroSaludId');
      const centroSaludNombre = await SecureStore.getItemAsync('userCentroSalud');
      const res = await fetch(`${API_URL}/citas/proximas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const citaDate = new Date(data.data.fecha_programada);
        setNextCitaDate(citaDate);
        const diff = Math.ceil((citaDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, diff));
        setNextCitaMotivo(data.data.motivo || '');
        setNextCitaEstablecimiento(
          centroSaludId === 'custom' && centroSaludNombre
            ? centroSaludNombre
            : data.data.establecimientos_salud?.nombre || ''
        );
      } else {
        setNextCitaDate(null);
        setNextCitaMotivo('');
        setNextCitaEstablecimiento('');
      }
    } catch (e) {
      console.error('Error fetching next cita', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header saludo */}
        <View style={styles.headerSection}>
          <AppText variant="h2" style={styles.greeting}>{t('inicio.hola', { nombre: userName || '...' })}</AppText>
          <AppText variant="body1" color={colors.textSecondary} style={styles.weeksText}>
            {t('inicio.semanas', { semanas: weeks })}
          </AppText>
          <AppText variant="body2" color={colors.textSecondary} style={styles.trimesterText}>
            {t(`inicio.${trimesterKey}`)}
          </AppText>
        </View>

        {/* Consejo del día */}
        <DailyTipBanner />

        {/* Tarjeta de próximo control */}
        <TouchableOpacity style={styles.nextControlCard} activeOpacity={0.7}>
          <View style={styles.calendarIconContainer}>
            <MaterialCommunityIcons name="calendar-month" size={28} color={colors.primary} />
          </View>
          <View style={styles.nextControlText}>
            <AppText variant="body2" color={colors.textSecondary}>
              {nextCitaDate ? t('inicio.proximo_control') : t('inicio.sin_cita')}
            </AppText>
            {nextCitaDate ? (
              <>
                <AppText variant="h3" color={colors.primary}>
                  {nextCitaDate.toLocaleDateString()}
                </AppText>
                <AppText variant="caption" color={colors.textPrimary}>
                  {t('inicio.faltan_dias', { dias: daysRemaining })}
                </AppText>
                {nextCitaEstablecimiento ? (
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                    {nextCitaEstablecimiento}
                  </AppText>
                ) : null}
              </>
            ) : null}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Grid de botones */}
        <View style={styles.grid}>
          {getMenuItems().map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={26}
                  color={item.iconColor}
                />
              </View>
              <AppText variant="caption" align="center" style={styles.gridItemText}>
                {item.title}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  content: {
    padding: spacing.l,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: spacing.m,
    marginTop: spacing.s,
  },
  greeting: {
    marginBottom: 4,
    fontWeight: '700',
  },
  weeksText: {
    fontWeight: '500',
  },
  trimesterText: {
    marginTop: 2,
  },
  nextControlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  calendarIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.roseLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextControlText: {
    flex: 1,
    marginLeft: spacing.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.m,
  },
  gridItem: {
    width: '28%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridItemText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
