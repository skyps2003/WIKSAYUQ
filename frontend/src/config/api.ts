import { Platform } from 'react-native';

const host = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});

console.log('[API] Platform.OS:', Platform.OS, '→ host:', host);

let envUrl = process.env.EXPO_PUBLIC_API_URL;
if (envUrl && envUrl.includes('localhost') && Platform.OS === 'android') {
  envUrl = envUrl.replace('localhost', '10.0.2.2');
}

const API_URL = envUrl || `http://${host}:3000/api`;

export default API_URL;
