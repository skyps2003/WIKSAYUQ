import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../src/utils/webStorage';

import { AppText } from '../../../src/components/AppText';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import API_URL from '../../../src/config/api';

// Dynamic locale — updated on every render via useEffect
const setupLocale = (lang: string) => {
  const isQu = lang === 'qu';
  LocaleConfig.locales['app'] = {
    monthNames: isQu
      ? ['Qul', 'Hat', 'Pau', 'Ayr', 'Aym', 'Int', 'Ant', 'Qha', 'Uma', 'Kan', 'Aya', 'Qha']
      : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: isQu
      ? ['Qul.', 'Hat.', 'Pau.', 'Ayr.', 'Aym.', 'Int.', 'Ant.', 'Qha.', 'Uma.', 'Kan.', 'Aya.', 'Qha.']
      : ['Ene.', 'Feb.', 'Mar', 'Abr', 'May', 'Jun', 'Jul.', 'Ago', 'Sept.', 'Oct.', 'Nov.', 'Dic.'],
    dayNames: isQu
      ? ['Dumingu', 'Lunis', 'Martis', 'Miérculis', 'Wiywis', 'Wirnis', 'Saw']
      : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['D', 'L', 'M', 'M', 'J', 'W', 'S'],
    today: isQu ? 'Kunan' : 'Hoy'
  };
  LocaleConfig.defaultLocale = 'app';
};

type UnifiedEvent = {
  id: string;
  type: 'control' | 'cita' | 'vacuna';
  title: string;
  date: string;
  time: string;
  establecimiento: string;
  details: Record<string, any>;
};

export default function CalendarioScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setupLocale(i18n.language);
  }, [i18n.language]);

  const fetchAllData = async () => {
    try {
      const token = await getItemAsync('userToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resCitas, resVacunas] = await Promise.all([
        fetch(`${API_URL}/citas`, { headers }),
        fetch(`${API_URL}/vacunas/mis-vacunas`, { headers })
      ]);

      const dataCitas = await resCitas.json();
      const dataVacunas = await resVacunas.json();

      const unified: UnifiedEvent[] = [];

      // Transform citas
      if (dataCitas.success) {
        dataCitas.data.forEach((cita: any) => {
          const dateObj = new Date(cita.fecha_programada);
          const control = cita.controles_prenatales?.[0];
          const isControl = cita.tipo === 'CONTROL_PRENATAL' && control;

          unified.push({
            id: cita.id,
            type: isControl ? 'control' : 'cita',
            title: isControl ? `Control Prenatal #${control.numero_control}` : (cita.motivo || 'Cita Médica'),
            date: dateObj.toISOString().split('T')[0],
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            establecimiento: cita.establecimientos_salud?.nombre || 'Centro de Salud',
            details: isControl ? {
              peso_kg: control.peso_kg,
              presion_sistolica: control.presion_sistolica,
              presion_diastolica: control.presion_diastolica,
              observaciones: control.observaciones,
              estado: control.estado
            } : {
              tipo: cita.tipo,
              observaciones: cita.observaciones,
              estado: cita.estado
            }
          });
        });
      }

      // Transform vacunas
      if (dataVacunas.success) {
        dataVacunas.data.forEach((vg: any) => {
          const dateStr = vg.fecha_aplicacion || vg.fecha_programada;
          const dateObj = new Date(dateStr);
          unified.push({
            id: vg.id,
            type: 'vacuna',
            title: vg.vacunas?.nombre || 'Vacuna',
            date: dateObj.toISOString().split('T')[0],
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            establecimiento: vg.establecimientos_salud?.nombre || 'Centro de Salud',
            details: {
              numero_dosis: vg.numero_dosis,
              estado: vg.estado
            }
          });
        });
      }

      const uniqueUnified = Array.from(new Map(unified.map(item => [item.id, item])).values());
      setEvents(uniqueUnified);
    } catch (error) {
      console.error(error);
    }
  };

  // Refresh data when screen comes into focus (after registering from controles module)
  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Build marked dates
  const markedDates: any = {
    [selectedDate]: { selected: true, selectedColor: colors.primary }
  };

  events.forEach(ev => {
    const color = ev.type === 'control' ? '#FF7B93' : ev.type === 'vacuna' ? '#4CAF50' : '#2196F3';
    if (!markedDates[ev.date]) {
      markedDates[ev.date] = { marked: true, dotColor: color };
    } else {
      markedDates[ev.date].marked = true;
      if (!markedDates[ev.date].dotColor) markedDates[ev.date].dotColor = color;
    }
  });

  const getEventsForDate = () => events.filter(e => e.date === selectedDate);

  const getIconForType = (type: string): string => {
    switch (type) {
      case 'control': return 'heart-pulse';
      case 'vacuna': return 'needle';
      case 'cita': return 'calendar-clock';
      default: return 'calendar';
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'control': return { bg: '#FFE5E9', icon: '#FF7B93', border: '#FFD0D6' };
      case 'vacuna': return { bg: '#E8F5E9', icon: '#4CAF50', border: '#C8E6C9' };
      case 'cita': return { bg: '#E3F2FD', icon: '#2196F3', border: '#BBDEFB' };
      default: return { bg: '#F5F5F5', icon: '#999', border: '#EEE' };
    }
  };

  const getLabelForType = (type: string) => {
    switch (type) {
      case 'control': return t('agenda.etiqueta_control');
      case 'vacuna': return t('agenda.etiqueta_vacuna');
      case 'cita': return t('agenda.etiqueta_cita');
      default: return t('agenda.etiqueta_evento');
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const months: string[] = t('agenda.meses', { returnObjects: true }) as any;
    return `${date.getDate()} ${months?.[date.getMonth()] || ''} ${date.getFullYear()}`;
  };

  const renderEventCard = (ev: UnifiedEvent) => {
    const colorSet = getColorForType(ev.type);
    return (
      <View key={ev.id} style={[styles.eventCard, { borderLeftColor: colorSet.icon }]}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={[styles.eventIconCircle, { backgroundColor: colorSet.bg }]}>
            <MaterialCommunityIcons name={getIconForType(ev.type) as any} size={22} color={colorSet.icon} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={[styles.typeBadge, { backgroundColor: colorSet.bg }]}>
              <AppText style={[styles.typeBadgeText, { color: colorSet.icon }]}>{getLabelForType(ev.type)}</AppText>
            </View>
            <AppText variant="h3" style={{ marginTop: 4 }}>{ev.title}</AppText>
          </View>
        </View>

        {/* Info Chips */}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
            <AppText style={styles.chipText}>{ev.time}</AppText>
          </View>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="hospital-building" size={14} color={colors.textSecondary} />
            <AppText style={styles.chipText} numberOfLines={1}>{ev.establecimiento}</AppText>
          </View>
        </View>

        {/* Control-specific vitals */}
        {ev.type === 'control' && (ev.details.peso_kg || ev.details.presion_sistolica) && (
          <View style={styles.vitalsRow}>
            {ev.details.peso_kg && (
              <View style={[styles.vitalCard, { backgroundColor: '#FFF0F2' }]}>
                <MaterialCommunityIcons name="scale-bathroom" size={18} color="#FF7B93" />
                <AppText style={styles.vitalValue}>{parseFloat(ev.details.peso_kg).toFixed(1)}</AppText>
                <AppText style={styles.vitalLabel}>kg</AppText>
              </View>
            )}
            {ev.details.presion_sistolica && (
              <View style={[styles.vitalCard, { backgroundColor: '#FFF0F2' }]}>
                <MaterialCommunityIcons name="heart-pulse" size={18} color="#FF7B93" />
                <AppText style={styles.vitalValue}>{ev.details.presion_sistolica}/{ev.details.presion_diastolica}</AppText>
                <AppText style={styles.vitalLabel}>mmHg</AppText>
              </View>
            )}
          </View>
        )}

        {/* Vacuna-specific */}
        {ev.type === 'vacuna' && ev.details.numero_dosis && (
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="counter" size={14} color="#4CAF50" />
              <AppText style={[styles.chipText, { color: '#4CAF50' }]}>{t('agenda.dosis', { num: ev.details.numero_dosis })}</AppText>
            </View>
            <View style={[styles.chip, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
              <AppText style={[styles.chipText, { color: '#4CAF50' }]}>{ev.details.estado}</AppText>
            </View>
          </View>
        )}

        {/* Observaciones */}
        {ev.details.observaciones && (
          <AppText variant="body2" color={colors.textSecondary} style={{ marginTop: 8 }}>
            {ev.details.observaciones}
          </AppText>
        )}
      </View>
    );
  };

  const dayEvents = getEventsForDate();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title={t('agenda.titulo')}
        showBack={false}
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(gestante)/controles' as any)} style={styles.addButton}>
            <MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.calendarContainer}>
          <Calendar key={i18n.language}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: colors.primary,
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: colors.primary,
              selectedDotColor: '#ffffff',
              arrowColor: colors.primary,
              monthTextColor: colors.textPrimary,
              indicatorColor: colors.primary,
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 16
            }}
          />
        </View>

        {/* Events for selected date */}
        <View style={styles.dateHeader}>
          <MaterialCommunityIcons name="calendar-today" size={18} color={colors.primary} />
          <AppText variant="h3" style={{ marginLeft: 8 }}>{formatDateLabel(selectedDate)}</AppText>
          <View style={styles.countBadge}>
            <AppText style={styles.countBadgeText}>{dayEvents.length}</AppText>
          </View>
        </View>

        {dayEvents.length > 0 ? (
          dayEvents.map(ev => renderEventCard(ev))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#DDD" />
            <AppText style={styles.emptyText}>{t('agenda.no_eventos')}</AppText>
            <TouchableOpacity onPress={() => router.push('/(gestante)/controles' as any)} style={styles.emptyButton}>
              <AppText style={styles.emptyButtonText}>{t('agenda.registrar')}</AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF7B93' }]} />
            <AppText style={styles.legendText}>{t('agenda.leyenda_controles')}</AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <AppText style={styles.legendText}>{t('agenda.leyenda_citas')}</AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <AppText style={styles.legendText}>{t('agenda.leyenda_vacunas')}</AppText>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  addButton: { right: spacing.m },
  scrollContent: { padding: spacing.m, paddingBottom: 40 },
  calendarContainer: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 8, marginBottom: spacing.l,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
  },
  dateHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16
  },
  countBadge: {
    backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 10,
    paddingVertical: 2, marginLeft: 'auto'
  },
  countBadgeText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  eventCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  eventIconCircle: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center'
  },
  typeBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 4
  },
  chipText: { fontSize: 12, color: colors.textSecondary },
  vitalsRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  vitalCard: {
    flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4
  },
  vitalValue: { fontSize: 18, fontWeight: '700', color: '#333' },
  vitalLabel: { fontSize: 11, color: '#999' },
  emptyContainer: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 32, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1
  },
  emptyText: { color: '#BBB', marginTop: 12, fontSize: 14 },
  emptyButton: {
    marginTop: 16, backgroundColor: colors.primary + '15', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10
  },
  emptyButtonText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  legend: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 20
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.textSecondary }
});
