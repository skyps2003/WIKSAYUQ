import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import { colors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '../../src/components/ScreenHeader';

export default function ResultadoAutoevaluacionScreen() {
  const router = useRouter();
  const { peligro } = useLocalSearchParams();
  const isPeligro = peligro === 'true';

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="RESULTADO" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        
        {isPeligro ? (
          <>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="alert" size={120} color={colors.danger} />
            </View>
            
            <AppText variant="h2" align="center" style={styles.title}>
              Es importante que acudas al centro de salud más cercano.
            </AppText>
            
            <AppText variant="body1" align="center" color={colors.textSecondary} style={styles.description}>
              Por tu seguridad y la de tu bebé, recomendamos que recibas atención médica de inmediato.
            </AppText>

            <View style={styles.actionsContainer}>
              <AppButton 
                title="Ver centros cercanos" 
                onPress={() => {}}
                style={styles.primaryButton}
              />
              <AppButton 
                title="Llamar por emergencia" 
                variant="secondary"
                onPress={() => {}}
                style={styles.secondaryButton}
              />
            </View>

            <View style={styles.adviceCard}>
              <View style={styles.adviceIcon}>
                <MaterialCommunityIcons name="clipboard-text" size={24} color={colors.primary} />
              </View>
              <View style={{flex: 1}}>
                <AppText variant="body2" color={colors.primaryDark} style={{fontWeight: 'bold'}}>Consejo</AppText>
                <AppText variant="body2" color={colors.textPrimary}>No te automediques.</AppText>
                <AppText variant="body2" color={colors.textPrimary}>Acude lo más pronto posible.</AppText>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="check-circle" size={120} color={colors.success} />
            </View>
            
            <AppText variant="h2" align="center" style={styles.title}>
              ¡Todo parece estar bien!
            </AppText>
            
            <AppText variant="body1" align="center" color={colors.textSecondary} style={styles.description}>
              No presentas signos de alarma evidentes. Continúa asistiendo a tus controles prenatales regulares.
            </AppText>

            <View style={styles.actionsContainer}>
              <AppButton 
                title="Volver al Inicio" 
                onPress={() => router.push('/(gestante)/(tabs)/inicio' as any)}
                style={styles.primaryButton}
              />
            </View>

            <View style={[styles.adviceCard, { backgroundColor: '#E8F5E9' }]}>
              <View style={[styles.adviceIcon, { backgroundColor: '#C8E6C9' }]}>
                <MaterialCommunityIcons name="leaf" size={24} color={colors.success} />
              </View>
              <View style={{flex: 1}}>
                <AppText variant="body2" color={colors.success} style={{fontWeight: 'bold'}}>Consejo</AppText>
                <AppText variant="body2" color={colors.textPrimary}>Mantén una dieta saludable y descansa.</AppText>
              </View>
            </View>
          </>
        )}

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
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.l,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    marginBottom: spacing.m,
    lineHeight: 32,
  },
  description: {
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.m,
    marginBottom: spacing.xxl,
  },
  primaryButton: {
    paddingVertical: 16,
  },
  secondaryButton: {
    paddingVertical: 16,
    backgroundColor: colors.roseLight,
    borderWidth: 0,
  },
  adviceCard: {
    width: '100%',
    backgroundColor: colors.roseLight,
    borderRadius: radius.l,
    padding: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  }
});
