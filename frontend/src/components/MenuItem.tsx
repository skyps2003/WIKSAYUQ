import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface MenuItemProps {
  icon: string;
  title: string;
  trailing?: string;
  onPress: () => void;
  isLast?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  trailing,
  onPress,
  isLast,
}) => {
  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={styles.left}>
        <MaterialCommunityIcons name={icon as any} size={22} color={colors.primary} />
        <AppText variant="body1" style={styles.title}>{title}</AppText>
      </View>
      <View style={styles.right}>
        {trailing ? (
          <AppText variant="body2" color={colors.textSecondary}>{trailing}</AppText>
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.border} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSoft,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  title: {
    fontWeight: '500',
  },
  right: {
    alignItems: 'center',
    marginLeft: 12,
  },
});
