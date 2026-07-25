import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ProfileHeaderProps {
  fullName: string;
  weeks: string;
  centroSalud: string;
  photo: string | null;
  onPickImage: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ fullName, weeks, centroSalud, photo, onPickImage }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.photoContainer} onPress={onPickImage} activeOpacity={0.8}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <MaterialCommunityIcons name="account" size={60} color={colors.border} />
        )}
      </TouchableOpacity>
      <AppText variant="h3" style={styles.name}>{fullName}</AppText>
      <AppText variant="body1" color={colors.textSecondary} style={styles.weeks}>{weeks} semanas de gestación</AppText>
      <View style={styles.hospitalRow}>
        <MaterialCommunityIcons name="hospital-building" size={16} color={colors.primary} />
        <AppText variant="caption" color={colors.primary} style={styles.hospitalText}>{centroSalud}</AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.l,
    paddingTop: spacing.m,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  weeks: {
    marginBottom: 8,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hospitalText: {
    fontWeight: '600',
  },
});
