import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import theme from '../../src/theme';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DatePickerModal } from '../../src/components/DatePickerModal';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { getItemAsync, setItemAsync } from '../../src/utils/webStorage';
import API_URL from '../../src/config/api';
import { clearUserSessionData } from '../../src/utils/userSession';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';
import { fetchWithTimeout, readApiResponse } from '../../src/utils/fetchWithTimeout';
import { useToast } from '../../src/components/AppToast';
import { OfflineDataService } from '../../src/services/offline-data.service';

export default function RegistroScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const keyboardHeight = useKeyboardHeight();
  
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [edad, setEdad] = useState('');
  const [dni, setDni] = useState('');
  const [loadingDni, setLoadingDni] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  const [fum, setFum] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);

  const [provincia, setProvincia] = useState<{ id: string; nombre: string } | null>(null);
  const [distrito, setDistrito] = useState<{ id: string; nombre: string } | null>(null);
  const [comunidad, setComunidad] = useState('');
  const [centroSaludNombre, setCentroSaludNombre] = useState('');

  const [provinciasList, setProvinciasList] = useState<any[]>([]);
  const [distritosList, setDistritosList] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'provincia' | 'distrito'>('provincia');
  const [loadingData, setLoadingData] = useState(false);
  const [loadingProvincias, setLoadingProvincias] = useState(true);
  const [provinciasError, setProvinciasError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaTratamiento, setAceptaTratamiento] = useState(false);
  const [dniError, setDniError] = useState('');

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(public)/login' as any);
  };

  const loadProvincias = async () => {
    try {
      setLoadingProvincias(true);
      setProvinciasError('');
      console.log('[API] Cargando provincias desde:', `${API_URL}/ubigeo/provincias/00000000-0000-0000-0000-000000000003`);
      const res = await fetchWithTimeout(`${API_URL}/ubigeo/provincias/00000000-0000-0000-0000-000000000003`, { timeout: 15000 });
      const json = await res.json();
      console.log('[API] Provincias respuesta:', json.success ? `${json.data?.length} provincias` : 'error');

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudieron cargar las provincias');
      }

      setProvinciasList(json.data || []);
    } catch (e: any) {
      console.error('[API] Error loading provincias:', e?.message || e);
      setProvinciasError('No se pudieron cargar las provincias. Puedes reintentar o continuar sin seleccionar ubicación.');
      showToast({
        message: 'No se pudieron cargar provincias. Puedes reintentar o continuar.',
        type: 'info',
        duration: 4500,
      });
    } finally {
      setLoadingProvincias(false);
    }
  };

  // Cargar provincias de Apurímac al montar
  useEffect(() => {
    loadProvincias();
  }, []);

  // Buscar datos del DNI al completar 8 dígitos
  useEffect(() => {
    if (dni.length === 8) {
      fetchReniecData();
    }
  }, [dni]);

  const fetchReniecData = async () => {
    try {
      setDniError('');
      setLoadingDni(true);
      const res = await fetchWithTimeout(`${API_URL}/reniec/${dni}`, { timeout: 12000 });
      const data = await res.json();
      if (data.success && data.data) {
        setNombres(data.data.nombres || '');
        setApellidoPaterno(data.data.apellidoPaterno || '');
        setApellidoMaterno(data.data.apellidoMaterno || '');
        setEdad(data.data.edad?.toString() || '');
      } else {
        setDniError('No se pudo encontrar el DNI. Ingresa los datos manualmente.');
        setNombres('');
        setApellidoPaterno('');
        setApellidoMaterno('');
        setEdad('');
      }
    } catch (e: any) {
      console.error('[API] RENIEC error:', e?.message || e);
      setDniError('Error de conexión. Ingresa los datos manualmente.');
    } finally {
      setLoadingDni(false);
    }
  };

  const openModal = async (type: 'provincia' | 'distrito') => {
    setModalType(type);
    setModalVisible(true);

    if (type === 'distrito' && provincia) {
      setLoadingData(true);
      try {
        const res = await fetchWithTimeout(`${API_URL}/ubigeo/distritos/${provincia.id}`, { timeout: 12000 });
        const data = await res.json();
        if (data.success) setDistritosList(data.data);
      } catch (e) {
        console.error(e);
        showToast({ message: 'No se pudieron cargar distritos. Intenta otra vez.', type: 'error' });
      }
      finally { setLoadingData(false); }
    }
  };

  const selectOption = (item: any) => {
    if (modalType === 'provincia') {
      setProvincia(item);
      setDistrito(null); setComunidad(''); setCentroSaludNombre('');
    }
    if (modalType === 'distrito') {
      setDistrito(item);
      setComunidad(''); setCentroSaludNombre('');
    }
    setModalVisible(false);
  };

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
        setFotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const handleDateChange = (selectedDate: Date) => {
    setShowDatePicker(false);
    setFum(selectedDate);
    setDateSelected(true);
  };

  const formattedDate = dateSelected
    ? fum.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  const getModalTitle = () => {
    if (modalType === 'provincia') return 'Seleccionar Provincia';
    return 'Seleccionar Distrito';
  };

  const getModalData = () => {
    if (modalType === 'provincia') return provinciasList;
    if (modalType === 'distrito') return distritosList;
    return [];
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      if (!dni || !nombres || !pin || pin.length < 4) {
        Alert.alert("Campos incompletos", "Por favor ingresa tu DNI, Nombres y un PIN de 4 dígitos.");
        return;
      }
      if (!aceptaTerminos || !aceptaTratamiento) {
        Alert.alert("Términos requeridos", "Debes aceptar los términos y la política de datos personales.");
        return;
      }

      const centroSaludFinal = centroSaludNombre.trim()
        ? { id: 'custom', nombre: centroSaludNombre.trim() }
        : null;
      const registerOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni,
          pin,
          nombres,
          apellido_paterno: apellidoPaterno,
          apellido_materno: apellidoMaterno,
          edad,
          rol: 'GESTANTE',
          comunidad_id: null,
          establecimiento_id: centroSaludFinal?.id || null,
          foto_base64: fotoBase64 || null,
          fum: dateSelected ? fum.toISOString() : null,
          acepta_terminos: aceptaTerminos,
          acepta_tratamiento_datos: aceptaTratamiento,
          idioma_preferido: 'ESPANOL',
        }),
      };
      let response: Response;
      try {
        response = await fetchWithTimeout(`${API_URL}/auth/register`, { ...registerOptions, timeout: 45000 });
        if ([502, 503, 504].includes(response.status)) throw new Error(`SERVER_STARTING_${response.status}`);
      } catch (firstError) {
        console.warn('Primer intento de registro falló; reintentando:', firstError);
        showToast({ message: 'Servidor iniciando. Reintentando registro...', type: 'info', duration: 3000 });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        response = await fetchWithTimeout(`${API_URL}/auth/register`, { ...registerOptions, timeout: 30000 });
      }
      const result = await readApiResponse<any>(response);

      if (!result.success) {
        Alert.alert("Error en Registro", result.message || "Error al crear la cuenta");
        return;
      }

      let semanas = 0;
      let trimestre = 'Primer trimestre';
      if (dateSelected && fum) {
        const diffDays = Math.ceil(Math.abs(Date.now() - fum.getTime()) / (1000 * 60 * 60 * 24));
        semanas = Math.floor(diffDays / 7);
        if (semanas > 12 && semanas <= 26) trimestre = 'Segundo trimestre';
        if (semanas > 26) trimestre = 'Tercer trimestre';
      }

      const primerNombre = nombres.split(' ')[0] || 'María';
      const user = result.data.user;

      await clearUserSessionData();
      await setItemAsync('userToken', result.data.token);
      await setItemAsync('userName', primerNombre);
      await setItemAsync('userFullName', user.nombres || nombres);
      await setItemAsync('userDni', user.dni || dni);
      await setItemAsync('userAge', edad || '0');
      await setItemAsync('userApellidoPaterno', user.apellido_paterno || apellidoPaterno || '');
      await setItemAsync('userApellidoMaterno', user.apellido_materno || apellidoMaterno || '');
      await setItemAsync('userSexo', user.sexo || 'NO_ESPECIFICA');
      await setItemAsync('userTelefono', user.telefono || '');
      await setItemAsync('userDireccion', user.direccion || '');
      await setItemAsync('userIdioma', user.idioma_preferido || 'ESPANOL');
      if (user.foto_base64) await setItemAsync('userPhoto', user.foto_base64);
      else if (fotoBase64) await setItemAsync('userPhoto', fotoBase64);
      const comunidadFinal = comunidad.trim();
      if (comunidadFinal) {
        await setItemAsync('userComunidadId', 'custom');
        await setItemAsync('userComunidad', comunidadFinal);
      }
      if (centroSaludFinal) {
        await setItemAsync('userCentroSaludId', centroSaludFinal.id);
        await setItemAsync('userCentroSalud', centroSaludFinal.nombre);
        await OfflineDataService.savePreferredHealthCenter(centroSaludFinal, user.dni || dni);
      }
      await setItemAsync('userWeeks', semanas.toString());
      await setItemAsync('userTrimester', trimestre);
      if (dateSelected) await setItemAsync('userFum', fum.toISOString());
      await setItemAsync('isLoggedIn', 'true');
      await setItemAsync('userRole', 'gestante');
      router.replace('/(gestante)/(tabs)/inicio' as any);
    } catch (e) {
      console.error(e);
      showToast({
        message: 'No se pudo conectar con el servidor. Revisa tu internet e intenta otra vez.',
        type: 'error',
        duration: 4500,
      });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h3" style={styles.headerTitle}>{t('registro.titulo')}</AppText>
        <AppText variant="body1" color={theme.colors.primary}>{t('registro.paso')}</AppText>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 120 : 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
        <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
          <View style={[styles.photoCircle, fotoBase64 ? { padding: 0, overflow: 'hidden' } : {}]}>
            {fotoBase64 ? (
              <Image source={{ uri: fotoBase64 }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialCommunityIcons name="camera" size={32} color={theme.colors.primary} />
            )}
          </View>
          <AppText variant="caption" color={theme.colors.textSecondary} style={{ marginTop: theme.spacing.s }}>
            {fotoBase64 ? 'Cambiar foto (Opcional)' : t('registro.agregar_foto')}
          </AppText>
        </TouchableOpacity>

        <View style={styles.form}>
          {/* DNI con auto-búsqueda */}
          <View style={styles.inputWithIcon}>
            <TextInput 
              style={styles.inputField} 
              placeholder={t('registro.dni')}
              keyboardType="numeric" 
              maxLength={8}
              placeholderTextColor={theme.colors.textSecondary}
              value={dni}
              onChangeText={(t) => { setDni(t); setDniError(''); }}
            />
            {loadingDni ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : dni.length === 8 && !dniError ? (
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
            ) : null}
          </View>
          {dniError ? (
            <AppText variant="caption" color="#E53935" style={{ marginTop: -8 }}>
              {dniError}
            </AppText>
          ) : null}

          {/* Nombres - autollenado por RENIEC */}
          <View style={styles.inputWithIcon}>
            <TextInput 
              style={styles.inputField} 
              placeholder={t('registro.nombres')}
              placeholderTextColor={theme.colors.textSecondary}
              value={nombres}
              onChangeText={setNombres}
            />
            {nombres ? <MaterialCommunityIcons name="account-check" size={20} color="#4CAF50" /> : null}
          </View>

          {/* Apellido Paterno - autollenado */}
          <View style={styles.inputWithIcon}>
            <TextInput 
              style={styles.inputField} 
              placeholder="Apellido Paterno"
              placeholderTextColor={theme.colors.textSecondary}
              value={apellidoPaterno}
              onChangeText={setApellidoPaterno}
            />
            {apellidoPaterno ? <MaterialCommunityIcons name="account-check" size={20} color="#4CAF50" /> : null}
          </View>

          {/* Apellido Materno - autollenado */}
          <View style={styles.inputWithIcon}>
            <TextInput 
              style={styles.inputField} 
              placeholder="Apellido Materno"
              placeholderTextColor={theme.colors.textSecondary}
              value={apellidoMaterno}
              onChangeText={setApellidoMaterno}
            />
            {apellidoMaterno ? <MaterialCommunityIcons name="account-check" size={20} color="#4CAF50" /> : null}
          </View>

          {/* Edad - autollenada */}
          <View style={styles.inputWithIcon}>
            <TextInput 
              style={styles.inputField} 
              placeholder={t('registro.edad')}
              keyboardType="numeric" 
              maxLength={2}
              placeholderTextColor={theme.colors.textSecondary}
              value={edad}
              onChangeText={setEdad}
            />
            {edad ? <MaterialCommunityIcons name="account-check" size={20} color="#4CAF50" /> : null}
          </View>

          {/* PIN */}
          <View style={styles.inputWithIcon}>
            <TextInput 
              style={styles.inputField} 
              placeholder="Crea un PIN de 4 dígitos"
              keyboardType="numeric" 
              maxLength={4}
              secureTextEntry={!showPin}
              placeholderTextColor={theme.colors.textSecondary}
              value={pin}
              onChangeText={setPin}
            />
            <TouchableOpacity onPress={() => setShowPin(!showPin)} style={{ padding: 4 }}>
              <MaterialCommunityIcons 
                name={showPin ? "eye" : "eye-off"} 
                size={22} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          {/* FUM */}
          <TouchableOpacity style={styles.inputWithIcon} onPress={() => setShowDatePicker(true)}>
            <TextInput 
              style={[styles.inputField, { color: dateSelected ? theme.colors.textPrimary : theme.colors.textSecondary }]} 
              placeholder={t('registro.fum')}
              placeholderTextColor={theme.colors.textSecondary} 
              value={formattedDate}
              editable={false} 
              pointerEvents="none"
            />
            <MaterialCommunityIcons name="calendar-blank" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <DatePickerModal
            visible={showDatePicker}
            value={fum}
            mode="date"
            maximumDate={new Date()}
            onConfirm={handleDateChange}
            onCancel={() => setShowDatePicker(false)}
          />

          {/* UBIGEO */}
          <View style={styles.sectionTitle}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
            <AppText variant="body2" color={theme.colors.primary} style={{ fontWeight: '600' }}>Ubicación</AppText>
          </View>

          <TextInput 
            style={[styles.input, { backgroundColor: '#f5f5f5' }]} 
            placeholder="Departamento"
            placeholderTextColor={theme.colors.textSecondary} 
            value="Apurímac"
            editable={false}
          />

          {/* Provincia */}
          <TouchableOpacity 
            style={styles.inputWithIcon} 
            onPress={() => openModal('provincia')}
            disabled={loadingProvincias}
          >
            <TextInput 
              style={[styles.inputField, { color: provincia ? theme.colors.textPrimary : theme.colors.textSecondary }]} 
              placeholder={loadingProvincias ? 'Cargando provincias...' : 'Provincia'}
              placeholderTextColor={theme.colors.textSecondary} 
              value={provincia?.nombre || ''}
              editable={false} 
              pointerEvents="none"
            />
            {loadingProvincias ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>

          {provinciasError ? (
            <View style={styles.inlineNotice}>
              <MaterialCommunityIcons name="wifi-alert" size={18} color={theme.colors.terracotta} />
              <AppText variant="caption" color={theme.colors.terracotta} style={styles.inlineNoticeText}>
                {provinciasError}
              </AppText>
              <TouchableOpacity onPress={loadProvincias} disabled={loadingProvincias} style={styles.retryButton}>
                {loadingProvincias ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <AppText variant="caption" color={theme.colors.primary} style={styles.retryText}>Reintentar</AppText>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Distrito */}
          <TouchableOpacity 
            style={[styles.inputWithIcon, !provincia && { opacity: 0.4 }]} 
            onPress={() => provincia && openModal('distrito')}
            disabled={!provincia}
          >
            <TextInput 
              style={[styles.inputField, { color: distrito ? theme.colors.textPrimary : theme.colors.textSecondary }]} 
              placeholder={!provincia ? 'Selecciona una provincia primero' : 'Distrito'}
              placeholderTextColor={theme.colors.textSecondary} 
              value={distrito?.nombre || ''}
              editable={false} 
              pointerEvents="none"
            />
            <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Comunidad / centro poblado - entrada directa */}
          <View style={[styles.inputWithIcon, !distrito && !provinciasError && { opacity: 0.4 }]}>
            <TextInput 
              style={styles.inputField}
              placeholder={!distrito && !provinciasError ? 'Selecciona un distrito primero' : 'Centro poblado / comunidad'}
              placeholderTextColor={theme.colors.textSecondary} 
              value={comunidad}
              onChangeText={setComunidad}
              editable={!!distrito || !!provinciasError}
            />
            <MaterialCommunityIcons name="home-map-marker" size={22} color={theme.colors.primary} />
          </View>

          {/* Centro de Salud - entrada directa */}
          <View style={styles.inputWithIcon}>
            <TextInput 
              style={styles.inputField}
              placeholder="Centro de Salud (escribe el nombre)"
              placeholderTextColor={theme.colors.textSecondary}
              value={centroSaludNombre}
              onChangeText={setCentroSaludNombre}
            />
            <MaterialCommunityIcons name="hospital-building" size={22} color={theme.colors.primary} />
          </View>

          {/* Términos */}
          <View style={styles.termsContainer}>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAceptaTerminos(!aceptaTerminos)}>
              <MaterialCommunityIcons 
                name={aceptaTerminos ? "checkbox-marked" : "checkbox-blank-outline"} 
                size={22} 
                color={aceptaTerminos ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <AppText variant="caption" color={theme.colors.textSecondary} style={styles.termsText}>
                Acepto los términos y condiciones de uso
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAceptaTratamiento(!aceptaTratamiento)}>
              <MaterialCommunityIcons 
                name={aceptaTratamiento ? "checkbox-marked" : "checkbox-blank-outline"} 
                size={22} 
                color={aceptaTratamiento ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <AppText variant="caption" color={theme.colors.textSecondary} style={styles.termsText}>
                Acepto el tratamiento de mis datos personales
              </AppText>
            </TouchableOpacity>
          </View>

          <AppButton 
            title={t('registro.siguiente')}
            onPress={handleRegister}
            loading={registering}
            style={styles.nextButton}
          />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal selector */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">{getModalTitle()}</AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />
            {loadingData ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <AppText variant="body2" color={theme.colors.textSecondary} style={{ marginTop: 12 }}>
                  Cargando...
                </AppText>
              </View>
            ) : (
              <FlatList
                data={getModalData()}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalItem} 
                    onPress={() => selectOption(item)}
                  >
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
                    <AppText variant="body1">{item.nombre}</AppText>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.modalLoading}>
                    <AppText variant="body2" color={theme.colors.textSecondary}>
                      No hay datos disponibles
                    </AppText>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.m },
  backButton: { padding: theme.spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: theme.spacing.l },
  photoContainer: { alignItems: 'center', marginBottom: theme.spacing.xl },
  photoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.primary, borderStyle: 'dashed' },
  form: { gap: theme.spacing.m },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 16 },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 14 },
  inputField: { flex: 1, padding: 14, fontSize: 16 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: theme.spacing.s, marginBottom: theme.spacing.xs },
  termsContainer: { gap: theme.spacing.s, marginTop: theme.spacing.s },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
  termsText: { flex: 1, lineHeight: 20 },
  nextButton: { marginTop: theme.spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalClose: { padding: 4 },
  modalDivider: { height: 1, backgroundColor: '#eee' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, marginHorizontal: 16, marginTop: 8, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4, color: '#333' },
  modalLoading: { padding: 40, alignItems: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  inlineNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF7EF', borderWidth: 1, borderColor: '#F0D3BC', borderRadius: 12, padding: 12 },
  inlineNoticeText: { flex: 1, lineHeight: 18 },
  retryButton: { minWidth: 72, alignItems: 'center', paddingVertical: 4 },
  retryText: { fontWeight: '700' },

});
