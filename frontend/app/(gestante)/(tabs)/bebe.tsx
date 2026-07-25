import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../src/components/AppText';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function BebeScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('bebe.titulo')} showBack={false} />

      <View style={styles.content}>
        <MaterialCommunityIcons name="baby-face-outline" size={80} color={colors.primary} />
        <AppText variant="h2" style={styles.subtitle}>{t('bebe.subtitulo')}</AppText>
        <View style={styles.card}>
          <MaterialCommunityIcons name="progress-wrench" size={28} color={colors.primary} />
          <AppText variant="body1" color={colors.primary} style={styles.cardText}>
            {t('bebe.proximamente')}
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.m,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 26,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundSoft,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: spacing.xs,
  },
  cardText: {
    fontWeight: '600',
  },
});
