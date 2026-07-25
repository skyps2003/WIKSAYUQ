import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { DAILY_TIPS } from '../data/daily-tips';
import { useRouter } from 'expo-router';

const DISMISS_KEY = 'tip_dismissed_julian';

export const DailyTipBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const checkDismissed = async () => {
      const today = Math.floor(Date.now() / 86400000).toString();
      const saved = await SecureStore.getItemAsync(DISMISS_KEY);
      if (saved === today) setVisible(false);
    };
    checkDismissed();
  }, []);

  const dismiss = async () => {
    const today = Math.floor(Date.now() / 86400000).toString();
    await SecureStore.setItemAsync(DISMISS_KEY, today);
    setVisible(false);
  };

  if (!visible) return null;

  const lang = i18n.language === 'qu' ? 'qu' : 'es';
  const tips = DAILY_TIPS[lang] || DAILY_TIPS.es;
  const tipIndex = Math.floor(Date.now() / 86400000) % tips.length;
  const tip = tips[tipIndex];

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Card style={styles.card}>
        <View style={styles.contentRow}>
          <View style={styles.textSection}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="lightbulb-outline" size={18} color={colors.primary} />
              </View>
              <AppText variant="body1" color={colors.primary} style={styles.title}>
                {lang === 'qu' ? "Kunan p'unchaw yachay" : 'Consejo del día'}
              </AppText>
            </View>
            <AppText variant="body2" style={styles.text}>"{tip.text}"</AppText>
            <TouchableOpacity style={styles.seeMore} onPress={() => router.push('/(gestante)/educacion' as any)}>
              <AppText variant="caption" color={colors.primary} style={styles.seeMoreText}>
                {lang === 'qu' ? 'Astawan yachaykunata qhaway >' : 'Ver más consejos >'}
              </AppText>
            </TouchableOpacity>
          </View>
          <Image 
            source={require('../../assets/images/woman.png')}
            style={styles.womanImage}
            resizeMode="contain"
          />
        </View>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.s,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.roseLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
  },
  text: {
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  seeMore: {
    alignSelf: 'flex-start',
  },
  seeMoreText: {
    fontWeight: '600',
  },
  womanImage: {
    width: 90,
    height: 100,
    marginLeft: 8,
  },
});
