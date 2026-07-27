import { Platform } from 'react-native';

const developmentHost = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});

const productionApiUrl = `http://${developmentHost}:3000/api`;

const API_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? `http://${developmentHost}:3000/api` : productionApiUrl);

console.log('[API] Platform.OS:', Platform.OS, '→ URL:', API_URL);

export default API_URL;
