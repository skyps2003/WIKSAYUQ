import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../../src/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function GestanteTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: t('menu.inicio'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, focused && styles.pillActive]}>
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={focused ? colors.primary : 'rgba(255,255,255,0.55)'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: t('menu.calendario'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, focused && styles.pillActive]}>
              <MaterialCommunityIcons
                name={focused ? 'calendar-month' : 'calendar-month-outline'}
                size={22}
                color={focused ? colors.primary : 'rgba(255,255,255,0.55)'}
              />
            </View>
          ),
        }}
      />

      {/* Botón central SOS Corazón */}
      <Tabs.Screen
        name="sos"
        options={{
          title: ' ',
          tabBarIcon: () => (
            <View style={styles.sosContainer}>
              <View style={styles.sosGlowOuter} />
              <View style={styles.sosGlowInner} />
              <View style={styles.sosButton}>
                <MaterialCommunityIcons name="heart" size={28} color={colors.primary} />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="bebe"
        options={{
          title: ' ',
          href: null,
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: t('menu.historial') || 'Historial',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, focused && styles.pillActive]}>
              <MaterialCommunityIcons
                name={focused ? 'clipboard-text' : 'clipboard-text-outline'}
                size={22}
                color={focused ? colors.primary : 'rgba(255,255,255,0.55)'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: t('menu.perfil'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.pill, focused && styles.pillActive]}>
              <MaterialCommunityIcons
                name={focused ? 'account' : 'account-outline'}
                size={22}
                color={focused ? colors.primary : 'rgba(255,255,255,0.55)'}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    backgroundColor: colors.primary,
    height: 72,
    paddingTop: 8,
    paddingBottom: 12,
    elevation: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pill: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  pillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  sosContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
  },
  sosGlowOuter: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    opacity: 0.18,
  },
  sosGlowInner: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    opacity: 0.28,
  },
  sosButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
});
