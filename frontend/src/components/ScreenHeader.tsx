import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, showBack = true, rightAction }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButton} />
      )}
      <AppText variant="h2" align="center" style={styles.title}>{title}</AppText>
      <View style={styles.rightSlot}>{rightAction}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    minHeight: 52,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  rightSlot: {
    width: 40,
    alignItems: 'flex-end',
  },
});
