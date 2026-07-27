import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../src/utils/webStorage';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { AppConfirmDialog } from '../../src/components/AppConfirmDialog';
import { useToast } from '../../src/components/AppToast';
import { colors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';
import API_URL from '../../src/config/api';
import { fetchWithTimeout } from '../../src/utils/fetchWithTimeout';
import { SyncService } from '../../src/services/sync/sync.service';
import { OfflineDataService } from '../../src/services/offline-data.service';

export default function ContactosScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [contactos, setContactos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [nombres, setNombres] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchContactos();
  }, []);

  const fetchContactos = async () => {
    try {
      const token = await getItemAsync('userToken');
      const response = await fetchWithTimeout(`${API_URL}/contactos`, {
        timeout: 12000,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudieron cargar los contactos');
      }

      setContactos(result.data);
      await OfflineDataService.cacheContacts(result.data);
    } catch (error) {
      console.error(error);
      setContactos(await OfflineDataService.getCachedContacts());
    } finally {
      setLoading(false);
    }
  };

  const handleLlamar = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    const mensaje = t('contactos.mensaje_sms');
    Linking.openURL(`sms:${phone}?body=${encodeURIComponent(mensaje)}`);
  };

  const handleAgregar = async () => {
    if (!nombres || !telefono || !parentesco) {
      showToast({ message: t('contactos.error_campos'), type: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await SyncService.saveOrQueue({
        tableName: 'contactos',
        data: { nombres, parentesco, telefono_principal: telefono }
      });

      if (result.success) {
        const contacto = result.queued
          ? {
              id: result.localId,
              nombres,
              parentesco,
              telefono_principal: telefono,
              es_contacto_principal: contactos.length === 0,
              sync_status: 'PENDING',
            }
          : result.data;
        const updatedContactos = [...contactos, contacto];

        setContactos(updatedContactos);
        await OfflineDataService.cacheContacts(updatedContactos);
        showToast({
          message: result.queued ? 'Contacto guardado sin internet. Se sincronizará al reconectar.' : t('contactos.exito_agregar'),
          type: 'success',
          duration: 4500,
        });
        setModalVisible(false);
        setNombres('');
        setParentesco('');
        setTelefono('');
      } else {
        showToast({ message: result.message || t('contactos.error_conexion'), type: 'error' });
      }
    } catch (error) {
      console.error(error);
      showToast({ message: t('contactos.error_conexion'), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPrincipal = async (id: string) => {
    try {
      const token = await getItemAsync('userToken');
      const response = await fetch(`${API_URL}/contactos/${id}/principal`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        fetchContactos();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEliminar = (id: string) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = await getItemAsync('userToken');
      const response = await fetch(`${API_URL}/contactos/${deleteTarget}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        showToast({ message: 'Contacto eliminado', type: 'success' });
        fetchContactos();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('contactos.titulo')} showBack={true} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="body1" color={colors.textSecondary} style={styles.description}>
          {t('contactos.descripcion')}
        </AppText>

        <AppButton 
          title={t('contactos.nuevo')}
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        />

        {/* Números Nacionales */}
        <AppText variant="h3" style={styles.sectionTitle}>{t('contactos.numeros_nacionales')}</AppText>
        
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: '#FFF0F0' }]}>
              <MaterialCommunityIcons name="ambulance" size={28} color={colors.danger} />
            </View>
            <View style={styles.cardInfo}>
              <AppText variant="h3">{t('contactos.samu')}</AppText>
              <AppText variant="body2" color={colors.textSecondary}>{t('contactos.samu_desc')}</AppText>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone" size={20} color={colors.textSecondary} />
            <AppText variant="body1" style={styles.phoneText}>106</AppText>
          </View>
          <TouchableOpacity style={[styles.callButton, { backgroundColor: colors.danger }]} onPress={() => handleLlamar('106')}>
            <MaterialCommunityIcons name="phone-outgoing" size={20} color="#FFF" />
            <AppText style={styles.callButtonText}>{t('contactos.llamar')}</AppText>
          </TouchableOpacity>
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: '#E8F4FD' }]}>
              <MaterialCommunityIcons name="police-badge-outline" size={28} color="#00529B" />
            </View>
            <View style={styles.cardInfo}>
              <AppText variant="h3">{t('contactos.policia')}</AppText>
              <AppText variant="body2" color={colors.textSecondary}>{t('contactos.policia_desc')}</AppText>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone" size={20} color={colors.textSecondary} />
            <AppText variant="body1" style={styles.phoneText}>105</AppText>
          </View>
          <TouchableOpacity style={[styles.callButton, { backgroundColor: '#00529B' }]} onPress={() => handleLlamar('105')}>
            <MaterialCommunityIcons name="phone-outgoing" size={20} color="#FFF" />
            <AppText style={styles.callButtonText}>{t('contactos.llamar')}</AppText>
          </TouchableOpacity>
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: '#FFF0F0' }]}>
              <MaterialCommunityIcons name="fire-truck" size={28} color={colors.danger} />
            </View>
            <View style={styles.cardInfo}>
              <AppText variant="h3">{t('contactos.bomberos')}</AppText>
              <AppText variant="body2" color={colors.textSecondary}>{t('contactos.bomberos_desc')}</AppText>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone" size={20} color={colors.textSecondary} />
            <AppText variant="body1" style={styles.phoneText}>116</AppText>
          </View>
          <TouchableOpacity style={[styles.callButton, { backgroundColor: colors.danger }]} onPress={() => handleLlamar('116')}>
            <MaterialCommunityIcons name="phone-outgoing" size={20} color="#FFF" />
            <AppText style={styles.callButtonText}>{t('contactos.llamar')}</AppText>
          </TouchableOpacity>
        </Card>

        <AppText variant="h3" style={[styles.sectionTitle, { marginTop: 16 }]}>{t('contactos.titulo')}</AppText>

        {loading ? (
          <AppText style={styles.emptyText}>Cargando...</AppText>
        ) : contactos.length === 0 ? (
          <AppText style={styles.emptyText}>{t('contactos.vacio')}</AppText>
        ) : (
          contactos.map((contacto) => (
            <Card key={contacto.id} style={{ marginBottom: 12 }}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="account" size={28} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AppText variant="h3">{contacto.nombres}</AppText>
                    {contacto.es_contacto_principal && (
                      <MaterialCommunityIcons name="star" size={16} color="#F2C94C" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <AppText variant="body2" color={colors.textSecondary}>{contacto.parentesco}</AppText>
                </View>
                
                {!contacto.es_contacto_principal && (
                  <TouchableOpacity onPress={() => handleSetPrincipal(contacto.id)} style={styles.actionIconButton}>
                    <MaterialCommunityIcons name="star-outline" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => handleEliminar(contacto.id)} style={styles.actionIconButton}>
                  <MaterialCommunityIcons name="delete-outline" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.phoneRow}>
                <MaterialCommunityIcons name="phone" size={20} color={colors.textSecondary} />
                <AppText variant="body1" style={styles.phoneText}>{contacto.telefono_principal}</AppText>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={[styles.callButton, { flex: 1, marginRight: 8 }]}
                  onPress={() => handleLlamar(contacto.telefono_principal)}
                >
                  <MaterialCommunityIcons name="phone-outgoing" size={20} color="#FFF" />
                  <AppText style={styles.callButtonText}>{t('contactos.llamar')}</AppText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.callButton, { flex: 1, backgroundColor: '#4A90E2', marginLeft: 8 }]}
                  onPress={() => handleSMS(contacto.telefono_principal)}
                >
                  <MaterialCommunityIcons name="message-text-outline" size={20} color="#FFF" />
                  <AppText style={styles.callButtonText}>{t('contactos.enviar_sms')}</AppText>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <AppConfirmDialog
        visible={deleteTarget !== null}
        title={t('contactos.eliminar')}
        message={t('contactos.confirmar_eliminar')}
        icon="account-remove"
        iconColor={colors.danger}
        buttons={[
          { text: t('contactos.cancelar'), onPress: () => setDeleteTarget(null) },
          { text: t('contactos.eliminar'), style: 'destructive', onPress: confirmDelete },
        ]}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Modal Agregar Contacto */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText variant="h2">{t('contactos.nuevo')}</AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <AppText variant="caption" color={colors.textSecondary}>{t('contactos.nombres')}</AppText>
              <TextInput 
                style={styles.input}
                placeholder={t('contactos.nombres_ph')}
                value={nombres}
                onChangeText={setNombres}
              />
            </View>

            <View style={styles.inputContainer}>
              <AppText variant="caption" color={colors.textSecondary}>{t('contactos.parentesco')}</AppText>
              <TextInput 
                style={styles.input}
                placeholder={t('contactos.parentesco_ph')}
                value={parentesco}
                onChangeText={setParentesco}
              />
            </View>

            <View style={styles.inputContainer}>
              <AppText variant="caption" color={colors.textSecondary}>{t('contactos.telefono')}</AppText>
              <TextInput 
                style={styles.input}
                placeholder={t('contactos.telefono_ph')}
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={setTelefono}
              />
            </View>

                <AppButton
                  title={t('contactos.agregar')}
                  onPress={handleAgregar}
                  loading={isSubmitting}
                  style={{ marginTop: spacing.m }}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.m,
  },
  description: {
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  addButton: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.m,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textSecondary,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.m,
  },
  actionIconButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F4F4',
    marginVertical: spacing.m,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  phoneText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalKeyboard: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  inputContainer: {
    marginBottom: spacing.m,
  },
  input: {
    height: 56,
    backgroundColor: '#F9F9F9',
    borderRadius: radius.l,
    paddingHorizontal: spacing.m,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    fontSize: 16,
  },
});
