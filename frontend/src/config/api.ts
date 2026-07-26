import { Platform } from 'react-native';

const developmentHost = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});

const productionApiUrl = 'https://wiksayuq.onrender.com/api';

let envUrl = process.env.EXPO_PUBLIC_API_URL;
if (envUrl && envUrl.includes('localhost') && Platform.OS === 'android') {
  envUrl = envUrl.replace('localhost', '10.0.2.2');
}

// APK builds must use the public API; 10.0.2.2 only exists inside an Android emulator.
const API_URL = envUrl || (__DEV__ ? `http://${developmentHost}:3000/api` : productionApiUrl);

console.log('[API] Platform.OS:', Platform.OS, '→ URL:', API_URL);

export default API_URL;
