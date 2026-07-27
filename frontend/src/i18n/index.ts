import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import { getItemAsync, setItemAsync } from '../utils/webStorage';

import es from './es';
import qu from './qu';

const STORE_LANGUAGE_KEY = 'wiksayuq.language';

const getLocalStorage = () => {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      let savedLanguage = null;
      if (Platform.OS !== 'web') {
        savedLanguage = await getItemAsync(STORE_LANGUAGE_KEY);
      } else {
        const ls = getLocalStorage();
        savedLanguage = ls ? ls.getItem(STORE_LANGUAGE_KEY) : null;
      }
      
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
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
        await setItemAsync(STORE_LANGUAGE_KEY, lng);
      } else {
        const ls = getLocalStorage();
        if (ls) ls.setItem(STORE_LANGUAGE_KEY, lng);
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
