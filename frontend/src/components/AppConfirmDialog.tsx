import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { colors } from '../theme/colors';

interface ConfirmButton {
  text: string;
  style?: 'default' | 'destructive';
  onPress?: () => void;
}

interface AppConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  buttons?: ConfirmButton[];
  onClose?: () => void;
}

export const AppConfirmDialog: React.FC<AppConfirmDialogProps> = ({
  visible,
  title,
  message,
  icon = 'help-circle',
  iconColor = colors.primary,
  buttons = [{ text: 'OK', onPress: () => {} }],
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 1, damping: 20, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose?.());
  };

  const handlePress = (btn: ConfirmButton) => {
    if (btn.style === 'destructive' || !btn.onPress) {
      handleClose();
    }
    btn.onPress?.();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <Animated.View style={[styles.dialog, { transform: [{ translateY }] }]}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: iconColor + '15' }]}>
              <MaterialCommunityIcons name={icon as any} size={32} color={iconColor} />
            </View>
          </View>

          <AppText variant="h2" align="center" style={styles.title}>{title}</AppText>
          <AppText variant="body1" align="center" color={colors.textSecondary} style={styles.message}>
            {message}
          </AppText>

          <View style={styles.buttonsRow}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isFirst = index === 0;
              const isLast = index === buttons.length - 1;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isDestructive && styles.buttonDestructive,
                    buttons.length === 2 && isFirst && styles.buttonLeft,
                    buttons.length === 2 && isLast && styles.buttonRight,
                  ]}
                  onPress={() => handlePress(btn)}
                  activeOpacity={0.8}
                >
                  <AppText
                    variant="body1"
                    color={isDestructive ? '#FFF' : colors.primary}
                    style={isDestructive && { color: '#FFF' }}
                  >
                    {btn.text}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    marginTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  buttonDestructive: {
    backgroundColor: colors.danger,
  },
  buttonLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  buttonRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
});
