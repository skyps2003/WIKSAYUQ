import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { colors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';
import { useRouter } from 'expo-router';

const PREGUNTAS = [
  '¿Has tenido sangrado vaginal en este embarazo?',
  '¿Has sentido fuertes dolores de cabeza recientemente?',
  '¿Has notado zumbidos en los oídos o visión borrosa?',
  '¿Tu bebé ha dejado de moverse (si tienes más de 20 semanas)?',
  '¿Tienes fiebre o escalofríos?',
  '¿Has perdido líquido por la vagina?',
  '¿Sientes ardor al orinar o dolor en el vientre?'
];

export default function AutoevaluacionScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [respuestas, setRespuestas] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState<boolean | null>(null);

  const handleNext = () => {
    if (selectedOption === null) return;
    
    const nuevasRespuestas = [...respuestas, selectedOption];
    setRespuestas(nuevasRespuestas);
    setSelectedOption(null);

    if (currentStep < PREGUNTAS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finished
      const tienePeligro = nuevasRespuestas.some(r => r === true);
      router.push({
        pathname: '/(gestante)/resultado',
        params: { peligro: tienePeligro ? 'true' : 'false' }
      } as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="SIGNOS DE ALARMA" showBack={true} />

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${((currentStep + 1) / PREGUNTAS.length) * 100}%` }]} />
        </View>
        <AppText variant="body2" color={colors.textSecondary} style={styles.progressText}>
          {currentStep + 1}/{PREGUNTAS.length}
        </AppText>
      </View>

      {/* Question content */}
      <View style={styles.content}>
        <AppText variant="h2" align="center" style={styles.questionText}>
          {PREGUNTAS[currentStep]}
        </AppText>

        <Image 
          source={require('../../assets/images/woman.png')}
          style={styles.illustration}
          resizeMode="contain"
        />

        <View style={styles.optionsRow}>
          <TouchableOpacity 
            style={[styles.optionButton, selectedOption === true && styles.optionSelected]}
            onPress={() => setSelectedOption(true)}
          >
            <AppText variant="h3" color={selectedOption === true ? '#fff' : colors.textPrimary}>Sí</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionButton, selectedOption === false && styles.optionSelected]}
            onPress={() => setSelectedOption(false)}
          >
            <AppText variant="h3" color={selectedOption === false ? '#fff' : colors.textPrimary}>No</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <AppButton 
          title="SIGUIENTE" 
          onPress={handleNext}
          disabled={selectedOption === null}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.s,
    marginBottom: spacing.xl,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.roseLight,
    borderRadius: 3,
    marginRight: spacing.m,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  questionText: {
    marginBottom: spacing.xl,
    lineHeight: 32,
  },
  illustration: {
    width: 200,
    height: 250,
    marginBottom: spacing.l,
  },
  optionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  optionButton: {
    flex: 1,
    height: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    padding: spacing.l,
    paddingBottom: spacing.xl,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 16,
  }
});
