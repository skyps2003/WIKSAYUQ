import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import es from './es';
import qu from './qu';

const STORE_LANGUAGE_KEY = 'wiksayuq.language';

// A simple language detector that reads from SecureStore (only on Native)
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      let savedLanguage = null;
      if (Platform.OS !== 'web') {
        savedLanguage = await SecureStore.getItemAsync(STORE_LANGUAGE_KEY);
      } else {
        savedLanguage = localStorage.getItem(STORE_LANGUAGE_KEY);
      }
      
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        // Fallback language
        callback('es');
      }
    } catch (error) {
      console.log('Error reading language', error);
      callback('es');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(STORE_LANGUAGE_KEY, lng);
      } else {
        localStorage.setItem(STORE_LANGUAGE_KEY, lng);
      }
    } catch (error) {
      console.log('Error saving language', error);
    }
  }
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    resources: {
      es: { translation: es },
      qu: { translation: qu },
    },
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
  });

export default i18n;
