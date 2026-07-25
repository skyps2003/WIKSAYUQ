import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface Props {
  visible: boolean;
  value: Date;
  mode?: 'date' | 'time';
  maximumDate?: Date;
  minimumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAYS_ES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export const DatePickerModal: React.FC<Props> = ({
  visible, value, mode = 'date', maximumDate, minimumDate, onConfirm, onCancel
}) => {
  const [selectedDate, setSelectedDate] = useState(value);
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [viewYear, setViewYear] = useState(value.getFullYear());

  useEffect(() => {
    if (visible) {
      setSelectedDate(value);
      setViewMonth(value.getMonth());
      setViewYear(value.getFullYear());
    }
  }, [visible, value]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const isDayDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (maximumDate && d > maximumDate) return true;
    if (minimumDate && d < minimumDate) return true;
    return false;
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const handleDayPress = (day: number) => {
    if (isDayDisabled(day)) return;
    const newDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(newDate);
  };

  const handlePrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const handleNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  if (mode === 'time') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <AppText variant="body2" color="white" style={{ fontWeight: '700' }}>{viewYear}</AppText>
              <AppText variant="h2" color="white" style={{ fontWeight: '700' }}>
                {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </View>
            <View style={styles.body}>
              <AppText style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: 16 }}>
                Selecciona la hora
              </AppText>
              <View style={styles.timeGrid}>
                {Array.from({ length: 18 }, (_, index) => index + 6).map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.timeBtn, selectedDate.getHours() === h && styles.timeBtnActive]}
                    onPress={() => { const d = new Date(selectedDate); d.setHours(h, 0); setSelectedDate(d); }}
                  >
                    <AppText style={[styles.timeBtnText, selectedDate.getHours() === h && styles.timeBtnTextActive]}>
                      {h.toString().padStart(2, '0')}:00
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <AppText style={{ color: colors.textSecondary, fontWeight: '600' }}>CANCELAR</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(selectedDate)}>
                <AppText style={{ color: 'white', fontWeight: '700' }}>ACEPTAR</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <AppText variant="body2" color="white" style={{ fontWeight: '700' }}>{viewYear}</AppText>
            <AppText variant="h2" color="white" style={{ fontWeight: '700' }}>
              {DAYS_ES[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTHS_ES[selectedDate.getMonth()].substring(0, 3)}.
            </AppText>
          </View>
          <View style={styles.body}>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
              <AppText variant="body1" style={{ fontWeight: '700', color: colors.textPrimary }}>
                {MONTHS_ES[viewMonth]} de {viewYear}
              </AppText>
              <TouchableOpacity onPress={handleNext} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.daysHeader}>
              {DAYS_ES.map((d, index) => (
                <View key={`${d}-${index}`} style={styles.dayCell}>
                  <AppText style={styles.dayHeaderText}>{d}</AppText>
                </View>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const disabled = isDayDisabled(day);
                const selected = isSameDay(selectedDate, new Date(viewYear, viewMonth, day));
                return (
                  <View key={day} style={styles.dayCell}>
                    <TouchableOpacity
                      style={[styles.dayBtn, selected && styles.dayBtnSelected, disabled && styles.dayBtnDisabled]}
                      onPress={() => handleDayPress(day)}
                      disabled={disabled}
                    >
                      <AppText style={[styles.dayText, selected && styles.dayTextSelected, disabled && styles.dayTextDisabled]}>
                        {day}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <AppText style={{ color: colors.textSecondary, fontWeight: '600' }}>CANCELAR</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(selectedDate)}>
              <AppText style={{ color: 'white', fontWeight: '700' }}>ACEPTAR</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '88%',
    maxWidth: 360,
    backgroundColor: 'white',
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.l,
    paddingTop: 20,
    paddingBottom: 18,
  },
  body: {
    padding: spacing.m,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  daysHeader: {
    flexDirection: 'row',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBtnSelected: {
    backgroundColor: colors.primary,
  },
  dayBtnDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: colors.textSecondary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeBtn: {
    width: '31%',
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: radius.m,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
  },
  timeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeBtnText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  timeBtnTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: radius.m,
  },
});
