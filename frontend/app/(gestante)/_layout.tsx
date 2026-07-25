import { Stack } from 'expo-router';

export default function GestanteLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="autoevaluacion" />
      <Stack.Screen name="resultado" />
      <Stack.Screen name="controles" />
      <Stack.Screen name="establecimientos" />
    </Stack>
  );
}
