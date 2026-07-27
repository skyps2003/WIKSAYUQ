import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Linking, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../src/components/AppText';
import { AppConfirmDialog } from '../../../src/components/AppConfirmDialog';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { ProfileHeader } from '../../../src/components/ProfileHeader';
import { WeightChartCard } from '../../../src/components/WeightChartCard';
import { MenuItem } from '../../../src/components/MenuItem';
import { colors } from '../../../src/theme/colors';
import { spacing, radius } from '../../../src/theme/spacing';
import { useRouter } from 'expo-router';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../src/utils/webStorage';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { calculateGestationalWeeks } from '../../../src/utils/gestation';

export default function PerfilScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [userData, setUserData] = useState({
    fullName: '',
    photo: null as string | null,
    weeks: '0',
    centroSalud: '',
  });

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const fullName = await getItemAsync('userFullName') || 'María Quispe Huamán';
          const photo = await getItemAsync('userPhoto');
          const fum = await getItemAsync('userFum');
          const calculatedWeeks = calculateGestationalWeeks(fum);
          const weeks = calculatedWeeks !== null
            ? calculatedWeeks.toString()
            : await getItemAsync('userWeeks') || '0';
          const centroSalud = await getItemAsync('userCentroSalud') || 'Hospital Regional';
          if (calculatedWeeks !== null) await setItemAsync('userWeeks', weeks);
          setUserData({ fullName, photo, weeks, centroSalud });
          setRefreshKey(prev => prev + 1);
        } catch (error) {
          console.error('Error loading profile', error);
        }
      };
      loadData();
    }, [])
  );

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setUserData(prev => ({ ...prev, photo: base64Img }));
        await setItemAsync('userPhoto', base64Img);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const handleLogout = () => setShowLogoutDialog(true);

  const confirmLogout = async () => {
    try {
      await deleteItemAsync('isLoggedIn');
      router.replace('/(public)/login' as any);
    } catch (e) {
      console.error('Error cerrando sesión', e);
    }
  };

  const handleSupport = async () => {
    const phone = '+51925903051';
    const message = 'Tengo una consulta con el sistema.';
    const url = `sms:${phone}?body=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening support message', error);
      Alert.alert('Soporte', 'No se pudo abrir la aplicación de mensajes.');
    }
  };

  const menuItems = [
    {
      icon: 'account-edit-outline',
      title: t('perfil.mis_datos'),
      onPress: () => router.push('/(gestante)/mis-datos' as any),
    },
    {
      icon: 'phone-alert-outline',
      title: t('perfil.contactos'),
      onPress: () => router.push('/(gestante)/contactos' as any),
    },
    {
      icon: 'cog-outline',
      title: t('perfil.configuracion'),
      trailing: i18n.language === 'qu' ? 'Runasimi' : 'Español',
      onPress: () => router.push('/(gestante)/configuracion' as any),
    },
    {
      icon: 'help-circle-outline',
      title: t('perfil.ayuda'),
      onPress: handleSupport,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t('perfil.titulo')} showBack={false} />

        <ProfileHeader
          fullName={userData.fullName}
          weeks={userData.weeks}
          centroSalud={userData.centroSalud}
          photo={userData.photo}
          onPickImage={pickImage}
        />

        <WeightChartCard refreshKey={refreshKey} />

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              trailing={item.trailing}
              onPress={item.onPress}
              isLast={index === menuItems.length - 1}
            />
          ))}
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
            <AppText variant="body1" color={colors.danger} style={styles.logoutText}>
              {t('perfil.cerrar_sesion')}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AppConfirmDialog
        visible={showLogoutDialog}
        title={t('perfil.cerrar_sesion')}
        message={t('perfil.confirmar_salir')}
        icon="logout"
        iconColor={colors.danger}
        buttons={[
          { text: t('perfil.cancelar'), onPress: () => setShowLogoutDialog(false) },
          { text: t('perfil.salir'), style: 'destructive', onPress: confirmLogout },
        ]}
        onClose={() => setShowLogoutDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxl,
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    overflow: 'hidden',
    marginBottom: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  logoutSection: {
    marginTop: spacing.s,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    paddingVertical: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  logoutText: {
    fontWeight: '700',
  },
});
