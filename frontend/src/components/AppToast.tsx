import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../theme/colors';

type ToastType = 'success' | 'error' | 'info';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-80)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(({ message, type = 'success', duration = 3000 }: ToastConfig) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(message);
    setType(type);
    setVisible(true);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }, duration);
  }, [opacity, translateY]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'information';
  const bgColor = type === 'success' ? colors.success : type === 'error' ? colors.danger : colors.primary;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }], backgroundColor: bgColor }]}>
          <MaterialCommunityIcons name={iconName} size={22} color="#FFF" />
          <AppText style={styles.toastText} variant="body2" color="#FFF">{message}</AppText>
          <TouchableOpacity onPress={() => {
            Animated.parallel([
              Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }),
            ]).start(() => setVisible(false));
          }}>
            <MaterialCommunityIcons name="close" size={18} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    gap: 10,
  },
  toastText: { flex: 1, marginLeft: 4 },
});
