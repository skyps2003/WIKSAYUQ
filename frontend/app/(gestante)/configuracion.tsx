import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { AppText } from '../../src/components/AppText';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibilityStore, FontSizeLevel } from '../../src/store/accessibility-store';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../src/utils/webStorage';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

const FONT_SIZES: { key: FontSizeLevel; label: string; quLabel: string }[] = [
  { key: 'pequena', label: 'Pequeña', quLabel: 'Uchuy' },
  { key: 'normal', label: 'Normal', quLabel: 'Normal' },
  { key: 'grande', label: 'Grande', quLabel: 'Hatun' },
];

export default function ConfiguracionScreen() {
  const { t, i18n } = useTranslation();
  const { fontSize, setFontSize } = useAccessibilityStore();
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const handleFontSizeChange = async (size: FontSizeLevel) => {
    setFontSize(size);
    await setItemAsync('wiksayuq.fontSize', size);
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'es' ? 'qu' : 'es';
    await i18n.changeLanguage(newLang);
    await setItemAsync('wiksayuq.language', newLang);
  };

  const lang = i18n.language === 'qu' ? 'qu' : 'es';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('perfil.configuracion')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Apariencia */}
        <AppText variant="h3" style={styles.sectionTitle}>
          {lang === 'qu' ? 'Rikch\'ay' : 'APARIENCIA'}
        </AppText>
        <Card variant="elevated" style={styles.sectionCard}>
          <AppText variant="body1" style={styles.label}>
            {lang === 'qu' ? 'Qillqamanta hatun kaynin' : 'Tamaño de letra'}
          </AppText>
          <View style={styles.segmentRow}>
            {FONT_SIZES.map((item) => {
              const active = fontSize === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => handleFontSizeChange(item.key)}
                  activeOpacity={0.7}
                >
                  <AppText
                    variant="caption"
                    color={active ? colors.surface : colors.textPrimary}
                    style={active && { fontWeight: '600' }}
                  >
                    {lang === 'qu' ? item.quLabel : item.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.previewBox}>
            <AppText variant="caption" color={colors.textSecondary}>
              {lang === 'qu'
                ? 'Kay qillqamanta hatun kaynin hukchasqa kanqa.'
                : 'Este es un texto de ejemplo para que puedas ver cómo se verá el cambio.'}
            </AppText>
          </View>
        </Card>

        {/* Idioma */}
        <AppText variant="h3" style={styles.sectionTitle}>
          {lang === 'qu' ? 'Simi' : 'IDIOMA'}
        </AppText>
        <Card variant="elevated" style={styles.sectionCard}>
          <TouchableOpacity style={styles.langRow} onPress={toggleLanguage} activeOpacity={0.7}>
            <View style={styles.langLeft}>
              <MaterialCommunityIcons name="translate" size={22} color={colors.primary} />
              <AppText variant="body1">{t('perfil.idioma')}</AppText>
            </View>
            <View style={styles.langRight}>
              <AppText variant="body2" color={colors.textSecondary}>
                {i18n.language === 'qu' ? 'Runasimi' : 'Español'}
              </AppText>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.border} />
            </View>
          </TouchableOpacity>
        </Card>

        {/* Notificaciones */}
        <AppText variant="h3" style={styles.sectionTitle}>
          {lang === 'qu' ? 'Willakuykuna' : 'NOTIFICACIONES'}
        </AppText>
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.notifRow}>
            <AppText variant="body2">
              {lang === 'qu' ? "Kunan p'unchaw yachaykuna" : 'Consejos del día'}
            </AppText>
            <Switch
              value={tipsEnabled}
              onValueChange={setTipsEnabled}
              trackColor={{ false: colors.backgroundSoft, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <View style={styles.notifRowLast}>
            <AppText variant="body2">
              {lang === 'qu' ? 'Qhawaykuna yuyaychay' : 'Recordatorio de controles'}
            </AppText>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: colors.backgroundSoft, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </Card>

        {/* Información */}
        <AppText variant="h3" style={styles.sectionTitle}>
          {lang === 'qu' ? 'Willakuy' : 'INFORMACIÓN'}
        </AppText>
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <AppText variant="body2" color={colors.textSecondary}>
              {lang === 'qu' ? 'Appmanta hatun kaynin' : 'Versión de la app'}
            </AppText>
            <AppText variant="body2">{Constants.expoConfig?.version || '1.0.0'}</AppText>
          </View>
          <TouchableOpacity style={styles.infoRow} activeOpacity={0.6} onPress={() => WebBrowser.openBrowserAsync('https://wiksayuq.app/terminos')}>
            <AppText variant="body2" color={colors.textSecondary}>
              {lang === 'qu' ? 'Kamachikuykuna' : 'Términos y condiciones'}
            </AppText>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoRowLast} activeOpacity={0.6} onPress={() => WebBrowser.openBrowserAsync('https://wiksayuq.app/privacidad')}>
            <AppText variant="body2" color={colors.textSecondary}>
              {lang === 'qu' ? 'Pakay willakuy' : 'Política de privacidad'}
            </AppText>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.border} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    marginTop: spacing.l,
    marginBottom: spacing.s,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    marginBottom: 0,
  },
  label: {
    marginBottom: spacing.s,
    fontWeight: '500',
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSoft,
    borderRadius: 12,
    padding: 3,
    marginBottom: spacing.s,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  previewBox: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: 10,
    padding: spacing.s,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  langRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSoft,
  },
  notifRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSoft,
  },
  infoRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
