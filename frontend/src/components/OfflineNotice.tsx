import React from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface OfflineNoticeProps {
  visible: boolean;
  onDismiss: () => void;
}

export function OfflineNotice({ visible, onDismiss }: OfflineNoticeProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.heroWrap}>
            <Image
              source={require('../../assets/images/mountains.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.iconBubble}>
              <MaterialCommunityIcons name="wifi-off" size={46} color={colors.primary} />
            </View>
          </View>

          <AppText variant="body1" align="center" style={styles.title}>
            Sin conexión a internet
          </AppText>
          <AppText variant="caption" align="center" color={colors.textSecondary} style={styles.message}>
            Puedes seguir usando la aplicación. Tus datos se sincronizarán cuando recuperes la conexión.
          </AppText>

          <Pressable style={styles.button} onPress={onDismiss} accessibilityRole="button">
            <AppText variant="caption" color="#FFFFFF" style={styles.buttonText}>
              Entendido
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.l,
    backgroundColor: 'rgba(63, 47, 49, 0.18)',
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.backgroundSoft,
    padding: spacing.l,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  heroWrap: {
    height: 190,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.l,
    backgroundColor: '#F9D9D9',
    marginBottom: spacing.l,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.9,
  },
  iconBubble: {
    width: 82,
    height: 82,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  title: {
    fontWeight: '800',
    marginBottom: spacing.s,
  },
  message: {
    lineHeight: 20,
    paddingHorizontal: spacing.s,
    marginBottom: spacing.l,
  },
  button: {
    alignSelf: 'center',
    minWidth: 128,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.l,
  },
  buttonText: {
    fontWeight: '800',
  },
});
