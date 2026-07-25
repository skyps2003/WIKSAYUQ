import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { ScreenHeader } from '../../src/components/ScreenHeader';

export default function TareasScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('inicio.menu.tareas')} showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
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
    padding: spacing.m,
    flexGrow: 1,
  },
});
