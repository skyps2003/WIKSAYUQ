import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const memoryStore = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
  if (!isWeb) {
    const { getItemAsync } = require('expo-secure-store');
    return getItemAsync(key);
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (!isWeb) {
    const { setItemAsync } = require('expo-secure-store');
    return setItemAsync(key, value);
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (!isWeb) {
    const { deleteItemAsync } = require('expo-secure-store');
    return deleteItemAsync(key);
  }
  try {
    localStorage.removeItem(key);
  } catch {
    memoryStore.delete(key);
  }
}
