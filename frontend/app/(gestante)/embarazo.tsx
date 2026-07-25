import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { AppText } from '../../src/components/AppText';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { ScreenHeader } from '../../src/components/ScreenHeader';

type Status = 'completed' | 'current' | 'upcoming';

const MILESTONES = [
  { id: 'concepcion', week: 4, trimester: 1 },
  { id: 'latido', week: 8, trimester: 1 },
  { id: 'organos', week: 12, trimester: 1 },
  { id: 'movimientos', week: 16, trimester: 2 },
  { id: 'ecografia', week: 20, trimester: 2 },
  { id: 'sentidos', week: 24, trimester: 2 },
  { id: 'pulmones', week: 28, trimester: 3 },
  { id: 'posicion', week: 34, trimester: 3 },
  { id: 'termino', week: 38, trimester: 3 },
];

function getMilestoneStatus(milestoneWeek: number, currentWeek: number): Status {
  if (currentWeek >= milestoneWeek) return 'completed';
  if (currentWeek >= milestoneWeek - 3 && currentWeek < milestoneWeek) return 'current';
  return 'upcoming';
}

function getTrimester(week: number): 1 | 2 | 3 {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

export default function EmbarazoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [weeks, setWeeks] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const wk = await SecureStore.getItemAsync('userWeeks');
        if (wk) setWeeks(parseInt(wk, 10));
      } catch {}
    })();
  }, []);

  const trimester = getTrimester(weeks);

  const firstOfTrimester = (tr: number) => MILESTONES.find(m => m.trimester === tr);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('embarazo.titulo')} showBack={true} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="human-pregnant" size={28} color="#fff" />
          </View>
          <AppText style={styles.heroWeeks}>{t('embarazo.subtitulo_semana', { semanas: weeks })}</AppText>
          <View style={styles.trimesterBadge}>
            <AppText style={styles.trimesterBadgeText}>{t(`embarazo.trimestre_${trimester}`)}</AppText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (weeks / 40) * 100)}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <AppText style={styles.progressLabel}>Semana 1</AppText>
            <AppText style={styles.progressLabel}>Semana 40</AppText>
          </View>
        </View>

        {[1, 2, 3].map(tr => {
          const milestones = MILESTONES.filter(m => m.trimester === tr);
          return (
            <View key={tr}>
              {tr > 1 && <View style={styles.trSpacer} />}
              <View style={styles.trHeader}>
                <View style={styles.trDot} />
                <AppText style={styles.trTitle}>{t(`embarazo.trimestre_${tr}`)}</AppText>
                <View style={styles.trLine} />
              </View>
              <View style={styles.timelineTrack}>
                {milestones.map((m, idx) => {
                  const status = getMilestoneStatus(m.week, weeks);
                  const isLast = idx === milestones.length - 1;
                  return (
                    <View key={m.id} style={styles.milestoneRow}>
                      <View style={styles.timelineCol}>
                        <View
                          style={[
                            styles.timelineNode,
                            status === 'completed' && styles.nodeCompleted,
                            status === 'current' && styles.nodeCurrent,
                            status === 'upcoming' && styles.nodeUpcoming,
                          ]}
                        >
                          {status === 'completed' && (
                            <MaterialCommunityIcons name="check" size={14} color="#fff" />
                          )}
                          {status === 'current' && (
                            <View style={styles.nodePulse} />
                          )}
                        </View>
                        {!isLast && (
                          <View
                            style={[
                              styles.timelineLine,
                              status === 'completed' && styles.lineCompleted,
                            ]}
                          />
                        )}
                      </View>
                      <View
                        style={[
                          styles.card,
                          status === 'current' && styles.cardCurrent,
                        ]}
                      >
                        <View style={styles.cardTop}>
                          <View style={styles.weekBadge}>
                            <AppText style={styles.weekBadgeText}>Sem. {m.week}</AppText>
                          </View>
                          {status === 'current' && (
                            <View style={styles.currentBadge}>
                              <AppText style={styles.currentBadgeText}>{t('embarazo.actual')}</AppText>
                            </View>
                          )}
                          {status === 'completed' && (
                            <View style={styles.completedBadge}>
                              <MaterialCommunityIcons name="check-circle" size={14} color={colors.primary} />
                              <AppText style={styles.completedBadgeText}>{t('embarazo.completado')}</AppText>
                            </View>
                          )}
                        </View>
                        <AppText style={styles.cardTitle}>
                          {t(`embarazo.${m.id}_titulo`)}
                        </AppText>
                        <AppText style={styles.cardDesc}>
                          {t(`embarazo.${m.id}_texto`)}
                        </AppText>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSoft },
  content: { padding: spacing.m, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: spacing.l,
    alignItems: 'center', marginBottom: spacing.l,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05, shadowRadius: 16, elevation: 3,
  },
  heroBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.m,
  },
  heroWeeks: {
    fontSize: 20, fontWeight: '700', color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  trimesterBadge: {
    backgroundColor: '#FFF5F6', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginBottom: spacing.m,
  },
  trimesterBadgeText: {
    fontSize: 13, fontWeight: '600', color: colors.primary,
  },
  progressTrack: {
    width: '100%', height: 6, backgroundColor: '#F0F0F0',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginTop: 4,
  },
  progressLabel: {
    fontSize: 11, color: colors.textSecondary,
  },

  trSpacer: { height: 8 },
  trHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.s, marginLeft: 8,
  },
  trDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary, marginRight: 8,
  },
  trTitle: {
    fontSize: 15, fontWeight: '700', color: colors.textPrimary,
    marginRight: 12,
  },
  trLine: {
    flex: 1, height: 1, backgroundColor: '#E8E8E8',
  },

  timelineTrack: { paddingLeft: 0 },

  milestoneRow: {
    flexDirection: 'row', marginBottom: 4,
  },
  timelineCol: {
    width: 44, alignItems: 'center',
  },
  timelineNode: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2,
  },
  nodeCompleted: {
    backgroundColor: colors.primary,
  },
  nodeCurrent: {
    backgroundColor: colors.primary,
  },
  nodeUpcoming: {
    backgroundColor: '#E0E0E0', borderWidth: 2, borderColor: '#D0D0D0',
  },
  nodePulse: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(226, 95, 122, 0.2)',
    position: 'absolute',
  },
  timelineLine: {
    width: 2, flex: 1, minHeight: 30,
    backgroundColor: '#E0E0E0',
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },

  card: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 16,
    padding: 14, marginLeft: 8, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  cardCurrent: {
    borderColor: colors.primary,
    backgroundColor: '#FFF8F9',
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 6,
    gap: 8,
  },
  weekBadge: {
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
  },
  weekBadgeText: {
    fontSize: 11, fontWeight: '700', color: colors.primary,
  },
  currentBadge: {
    backgroundColor: '#FFE8EC',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 11, fontWeight: '600', color: colors.primary,
  },
  completedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 11, fontWeight: '600', color: colors.primary,
  },
  cardTitle: {
    fontSize: 14, fontWeight: '600', color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12, color: colors.textSecondary, lineHeight: 17,
  },
});
