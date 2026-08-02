const CLOUD_API_URL = 'https://wiksayuq.rimaqmasi.com/api';

// A standalone APK must never fall back to localhost: on a phone that address
// points to the phone itself. For local development, set EXPO_PUBLIC_API_URL.
const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_URL = (configuredUrl || CLOUD_API_URL).replace(/\/+$/, '');

if (__DEV__) console.log('[API] URL:', API_URL);

export default API_URL;
