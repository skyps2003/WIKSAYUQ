import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../../src/theme';

export default function PersonalSaludTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: '#EEEEEE',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-plus-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Añadiremos más pestañas aquí a medida que construyamos la app para el personal de salud */}
    </Tabs>
  );
}
