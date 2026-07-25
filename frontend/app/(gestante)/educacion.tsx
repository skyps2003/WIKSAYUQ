import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { ScreenHeader } from '../../src/components/ScreenHeader';

const videos = [
  {
    title: 'Guía del Embarazo – Semana a Semana',
    channel: 'BabyCenter en Español',
    url: 'https://www.youtube.com/playlist?list=PL6bQ6drR3o_e5dOE6n0B6z-oMA6wUFj8c',
    lang: 'ES',
  },
  {
    title: 'Pregnancy: A Week-by-Week Guide',
    channel: 'BabyCenter',
    url: 'https://www.youtube.com/playlist?list=PLl9QZjs5Vh1WADGUoqLW4OrLHvFn5FTLU',
    lang: 'EN',
  },
];

export default function EducacionScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const consejos = [
    { icon: 'food-apple', title: t('educacion.nutricion_titulo'), text: t('educacion.nutricion_texto') },
    { icon: 'alert-circle-outline', title: t('educacion.signos_titulo'), text: t('educacion.signos_texto') },
    { icon: 'yoga', title: t('educacion.ejercicios_titulo'), text: t('educacion.ejercicios_texto') },
    { icon: 'water', title: t('educacion.hidratacion_titulo'), text: t('educacion.hidratacion_texto') },
    { icon: 'heart-pulse', title: t('educacion.control_titulo'), text: t('educacion.control_texto') },
    { icon: 'needle', title: t('educacion.vacunas_titulo'), text: t('educacion.vacunas_texto') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('educacion.titulo')} showBack={true} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText style={styles.sectionTitle}>
          <MaterialCommunityIcons name="play-circle-outline" size={18} color={colors.primary} /> {t('educacion.videos')}
        </AppText>
        <AppText style={styles.sectionDesc}>{t('educacion.videos_desc')}</AppText>
        {videos.map((v, i) => (
          <TouchableOpacity key={i} style={styles.videoCard} onPress={() => Linking.openURL(v.url)}>
            <View style={styles.thumb}>
              <MaterialCommunityIcons name="human-pregnant" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText style={styles.videoTitle}>{v.title}</AppText>
              <AppText style={styles.videoSub}>{v.channel} · {v.lang === 'ES' ? t('educacion.lang_es') : t('educacion.lang_en')}</AppText>
            </View>
            <MaterialCommunityIcons name="play-circle" size={36} color={colors.primary} />
          </TouchableOpacity>
        ))}

        <AppText style={[styles.sectionTitle, { marginTop: 24 }]}>
          <MaterialCommunityIcons name="lightbulb-outline" size={18} color={colors.secondary} /> {t('educacion.consejos')}
        </AppText>
        {consejos.map((c, i) => (
          <View key={i} style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <MaterialCommunityIcons name={c.icon as any} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText style={styles.tipTitle}>{c.title}</AppText>
              <AppText style={styles.tipText}>{c.text}</AppText>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.m, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  videoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 10,
  },
  thumb: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  videoTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  videoSub: { fontSize: 12, color: colors.textSecondary },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 8,
  },
  tipIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  tipTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  tipText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
