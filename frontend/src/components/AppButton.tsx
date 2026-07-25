import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

interface AppButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  compact?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  onPress,
  icon,
  iconPosition = 'left',
  style,
  compact = false,
}) => {
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.roseLight,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.danger,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#fff';
      case 'outline':
      case 'danger':
        return variant === 'danger' ? colors.danger : colors.primary;
      case 'ghost':
        return colors.primary;
      default:
        return '#fff';
    }
  };

  const getIconColor = (): string => {
    return getTextColor();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact && styles.compact,
        getContainerStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons
              name={icon as any}
              size={compact ? 16 : 20}
              color={getIconColor()}
              style={styles.iconLeft}
            />
          )}
          <AppText
            variant={compact ? 'caption' : 'body1'}
            color={getTextColor()}
            style={styles.text}
          >
            {title}
          </AppText>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons
              name={icon as any}
              size={compact ? 16 : 20}
              color={getIconColor()}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.l,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
});
