import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../src/utils/webStorage';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { AppText } from '../../../src/components/AppText';
import { AppButton } from '../../../src/components/AppButton';
import { Card } from '../../../src/components/Card';
import { useToast } from '../../../src/components/AppToast';
import { colors } from '../../../src/theme/colors';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { DatePickerModal } from '../../../src/components/DatePickerModal';
import { useKeyboardHeight } from '../../../src/hooks/useKeyboardHeight';
import { SyncService } from '../../../src/services/sync/sync.service';
import API_URL from '../../../src/config/api';
import { fetchWithTimeout } from '../../../src/utils/fetchWithTimeout';
import { OfflineDataService } from '../../../src/services/offline-data.service';

type FormFieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

type NearestCentersCardProps = {
  centers: any[];
  loading: boolean;
  selectedValue: string;
  onSelect: (id: string) => void;
};

function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldHeader}>
        <AppText style={styles.fieldLabel}>{label}</AppText>
        {hint ? <AppText style={styles.fieldHint}>{hint}</AppText> : null}
      </View>
      {children}
    </View>
  );
}

function NearestCentersCard({ centers, loading, selectedValue, onSelect }: NearestCentersCardProps) {
  if (loading) return (
    <View style={styles.nearbyLoading}><ActivityIndicator size="small" color={colors.primary} /><AppText style={styles.nearbyLoadingText}>Ubicando centros cercanos...</AppText></View>
  );
  if (centers.length === 0) return null;
  return (
    <View style={styles.nearbySection}>
      <AppText style={styles.nearbyTitle}>
        <MaterialCommunityIcons name="map-marker-radius" size={14} color={colors.primary} /> Centros más cercanos
      </AppText>
      {centers.map((c) => {
        const selected = selectedValue === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            style={[styles.nearbyCard, selected && styles.nearbyCardSelected]}
            onPress={() => onSelect(c.id)}
          >
            <View style={{ flex: 1 }}>
              <AppText style={[styles.nearbyName, selected && styles.nearbyNameSelected]}>{c.nombre}</AppText>
              <AppText style={styles.nearbyDist}>
                <MaterialCommunityIcons name="map-marker-distance" size={12} color={colors.textSecondary} /> {c.distancia_km} km
                {c.direccion ? ` · ${c.direccion}` : ''}
              </AppText>
            </View>
            <View style={[styles.nearbyRadio, selected && styles.nearbyRadioSelected]}>
              {selected && <View style={styles.nearbyRadioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ControlesRegistroScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const keyboardHeight = useKeyboardHeight();
  const [activeTab, setActiveTab] = useState<'control' | 'cita' | 'vacuna'>('control');

  const [establecimientos, setEstablecimientos] = useState<any[]>([]);
  const [userCentroSaludId, setUserCentroSaludId] = useState('');
  const [userCentroSaludName, setUserCentroSaludName] = useState('');

  const [dateControl, setDateControl] = useState(new Date());
  const [peso, setPeso] = useState('');
  const [paSis, setPaSis] = useState('');
  const [paDia, setPaDia] = useState('');
  const [estControl, setEstControl] = useState('');

  const [dateCita, setDateCita] = useState(new Date());
  const [timeCita, setTimeCita] = useState(new Date());
  const [motivo, setMotivo] = useState('');
  const [estCita, setEstCita] = useState('');

  const [dateVacuna, setDateVacuna] = useState(new Date());
  const [estVacuna, setEstVacuna] = useState('');
  const [nombreVacuna, setNombreVacuna] = useState('');
  const [descripcionVacuna, setDescripcionVacuna] = useState('');
  const [vacunaEstado, setVacunaEstado] = useState<'APLICADA' | 'PENDIENTE'>('APLICADA');
  const [hasMoreDosis, setHasMoreDosis] = useState(false);

  const [nearestCenters, setNearestCenters] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(true);

  const [showPicker, setShowPicker] = useState<{ show: boolean, mode: 'date' | 'time', target: string }>({ show: false, mode: 'date', target: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchMasterData();
  }, []);

  const loadUserData = async () => {
    const centroId = await getItemAsync('userCentroSaludId');
    const centroName = await getItemAsync('userCentroSalud');
    if (centroId) {
      setUserCentroSaludId(centroId);
      setUserCentroSaludName(centroName || '');
      setEstControl(centroId);
      setEstCita(centroId);
      setEstVacuna(centroId);
    }
  };

  const haversineKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  const findNearestCenters = useCallback(async (centers: any[]) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const withDist = centers
        .filter(c => c.latitud != null && c.longitud != null)
        .map(c => ({
          ...c,
          distancia_km: Math.round(haversineKm(loc.coords.latitude, loc.coords.longitude, Number(c.latitud), Number(c.longitud)) * 10) / 10
        }))
        .sort((a, b) => a.distancia_km - b.distancia_km);
      setNearestCenters(withDist.slice(0, 2));
    } catch { /* silently fail */ }
    setLocationLoading(false);
  }, [haversineKm]);

  useEffect(() => {
    if (establecimientos.length > 0) findNearestCenters(establecimientos);
  }, [establecimientos, findNearestCenters]);

  const fetchMasterData = async () => {
    let list = OfflineDataService.getCachedEstablishments();

    try {
      const token = await getItemAsync('userToken');
      const resEst = await fetchWithTimeout(`${API_URL}/establecimientos`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 12000,
      });
      const dataEst = await resEst.json();
      if (!resEst.ok || !dataEst.success) {
        throw new Error(dataEst.message || 'No se pudieron cargar los establecimientos');
      }

      list = dataEst.data || [];
      OfflineDataService.cacheEstablishments(list);
    } catch (e) {
      console.error('Using cached health centers:', e);
    }

    const centroId = await getItemAsync('userCentroSaludId');
    const centroName = await getItemAsync('userCentroSalud');
    if (centroId === 'custom' && centroName && !list.some((e: any) => e.id === 'custom')) {
      list = [{ id: 'custom', nombre: centroName }, ...list];
    }
    setEstablecimientos(list);
  };

  const handleSaveControl = async () => {
    if (!peso || !paSis || !paDia || !estControl) {
      showToast({ message: t('controles.error_campos'), type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const fum = await getItemAsync('userFum');
      const data = await SyncService.saveOrQueue({
        tableName: 'controles',
        data: { fecha_control: dateControl.toISOString(), establecimiento_id: estControl === 'custom' ? null : estControl, peso_kg: peso, presion_sistolica: paSis, presion_diastolica: paDia, fum }
      });
      if (data.success) {
        showToast({ message: data.queued ? 'Control guardado sin internet. Se sincronizará luego.' : `Control ${t('controles.exito_guardar')}`, type: 'success' });
        setPeso(''); setPaSis(''); setPaDia('');
      } else {
        showToast({ message: data.message || 'No se pudo guardar el control prenatal', type: 'error' });
      }
    } catch {
      showToast({ message: t('controles.error_conexion'), type: 'error' });
    }
    setLoading(false);
  };

  const handleSaveCita = async () => {
    if (!motivo || !estCita) {
      showToast({ message: t('controles.error_campos'), type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const fum = await getItemAsync('userFum');
      const combinedDate = new Date(dateCita);
      combinedDate.setHours(timeCita.getHours());
      combinedDate.setMinutes(timeCita.getMinutes());
      const data = await SyncService.saveOrQueue({
        tableName: 'citas',
        data: { fecha_programada: combinedDate.toISOString(), establecimiento_id: estCita === 'custom' ? null : estCita, motivo, tipo: 'OTRO', fum }
      });
      if (data.success) {
        showToast({ message: data.queued ? 'Cita guardada sin internet. Se sincronizará luego.' : `Cita ${t('controles.exito_guardar')}`, type: 'success' });
        setMotivo('');
      } else {
        showToast({ message: data.message, type: 'error' });
      }
    } catch {
      showToast({ message: t('controles.error_conexion'), type: 'error' });
    }
    setLoading(false);
  };

  const handleSaveVacuna = async () => {
    if (!nombreVacuna || !estVacuna) {
      showToast({ message: t('controles.error_campos'), type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const fum = await getItemAsync('userFum');
      const body: any = { nombre_vacuna: nombreVacuna, descripcion_vacuna: descripcionVacuna || null, establecimiento_id: estVacuna === 'custom' ? null : estVacuna, estado: vacunaEstado, fum };
      if (vacunaEstado === 'APLICADA') {
        body.fecha_aplicacion = dateVacuna.toISOString();
      } else {
        body.fecha_programada = dateVacuna.toISOString();
      }
      const data = await SyncService.saveOrQueue({ tableName: 'vacunas', data: body });
      if (data.success) {
        showToast({ message: data.queued ? 'Vacuna guardada sin internet. Se sincronizará luego.' : `Vacuna ${t('controles.exito_guardar')}`, type: 'success' });
        setNombreVacuna(''); setDescripcionVacuna(''); setVacunaEstado('APLICADA'); setHasMoreDosis(false);
      } else {
        showToast({ message: data.message, type: 'error' });
      }
    } catch {
      showToast({ message: t('controles.error_conexion'), type: 'error' });
    }
    setLoading(false);
  };

  const handleValueChange = (selectedDate: Date) => {
    const target = showPicker.target;
    if (target === 'controlDate') setDateControl(selectedDate);
    if (target === 'citaDate') setDateCita(selectedDate);
    if (target === 'citaTime') setTimeCita(selectedDate);
    if (target === 'vacunaDate') setDateVacuna(selectedDate);
    setShowPicker({ show: false, mode: 'date', target: '' });
  };

  const handleDismiss = () => {
    setShowPicker({ show: false, mode: 'date', target: '' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScreenHeader title={t('controles.titulo')} showBack={true} />

      <View style={styles.tabs}>
        {(['control', 'cita', 'vacuna'] as const).map(tab => {
          const icon = tab === 'control' ? 'heart-pulse' : tab === 'cita' ? 'calendar-text' : 'needle';
          return (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
              <MaterialCommunityIcons name={icon} size={20} color={activeTab === tab ? colors.primary : colors.textSecondary} />
              <AppText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{t(`controles.tab_${tab}`)}</AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 140 : 120 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'control' && (
          <View style={styles.form}>
            <Card>
              <FormField label={t('controles.control_label_fecha')}>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker({ show: true, mode: 'date', target: 'controlDate' })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
                    <AppText>{dateControl.toLocaleDateString()}</AppText>
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </FormField>

              <FormField label={t('controles.control_label_centro')} hint={userCentroSaludName ? `Por defecto: ${userCentroSaludName}` : undefined}>
                <NearestCentersCard centers={nearestCenters} loading={locationLoading} selectedValue={estControl} onSelect={setEstControl} />
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={estControl} onValueChange={(v) => setEstControl(v)}>
                    <Picker.Item label={t('controles.picker_placeholder')} value="" color={colors.textSecondary} />
                    {establecimientos.map((e, idx) => <Picker.Item key={`ctrl-${idx}`} label={e.nombre} value={e.id} />)}
                  </Picker>
                </View>
              </FormField>

              <FormField label={t('controles.control_label_peso')}>
                <TextInput style={styles.input} placeholder={t('controles.control_peso_ph')} keyboardType="numeric" value={peso} onChangeText={(v) => setPeso(v.replace(/[^0-9.]/g, ''))} />
              </FormField>

              <FormField label={t('controles.control_label_pa')}>
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('controles.control_pa_sis_ph')} keyboardType="numeric" value={paSis} onChangeText={(v) => setPaSis(v.replace(/[^0-9]/g, ''))} />
                  <AppText style={{ marginHorizontal: 10, color: colors.textSecondary }}>/</AppText>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('controles.control_pa_dia_ph')} keyboardType="numeric" value={paDia} onChangeText={(v) => setPaDia(v.replace(/[^0-9]/g, ''))} />
                </View>
              </FormField>
            </Card>

            <AppButton title={`${t('controles.control_guardar')}`} onPress={handleSaveControl} loading={loading} />
          </View>
        )}

        {activeTab === 'cita' && (
          <View style={styles.form}>
            <Card>
              <FormField label={t('controles.cita_label_motivo')}>
                <TextInput style={styles.input} placeholder={t('controles.cita_motivo_ph')} value={motivo} onChangeText={setMotivo} />
              </FormField>

              <FormField label={t('controles.cita_label_fecha')}>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker({ show: true, mode: 'date', target: 'citaDate' })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
                    <AppText>{dateCita.toLocaleDateString()}</AppText>
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </FormField>

              <FormField label={t('controles.cita_label_hora')}>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker({ show: true, mode: 'time', target: 'citaTime' })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
                    <AppText>{timeCita.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</AppText>
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </FormField>

              <FormField label={t('controles.cita_label_centro')} hint={userCentroSaludName ? `Por defecto: ${userCentroSaludName}` : undefined}>
                <NearestCentersCard centers={nearestCenters} loading={locationLoading} selectedValue={estCita} onSelect={setEstCita} />
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={estCita} onValueChange={(v) => setEstCita(v)}>
                    <Picker.Item label={t('controles.picker_placeholder')} value="" color={colors.textSecondary} />
                    {establecimientos.map((e, idx) => <Picker.Item key={`cita-${idx}`} label={e.nombre} value={e.id} />)}
                  </Picker>
                </View>
              </FormField>
            </Card>

            <AppButton title={`${t('controles.cita_guardar')}`} onPress={handleSaveCita} loading={loading} />
          </View>
        )}

        {activeTab === 'vacuna' && (
          <View style={styles.form}>
            <Card>
              <FormField label={t('controles.vacuna_label_nombre')}>
                <TextInput style={styles.input} placeholder={t('controles.vacuna_nombre_ph')} value={nombreVacuna} onChangeText={setNombreVacuna} />
              </FormField>

              <FormField label={t('controles.vacuna_label_descripcion')}>
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder={t('controles.vacuna_descripcion_ph')} value={descripcionVacuna} onChangeText={setDescripcionVacuna} multiline />
              </FormField>

              <View style={styles.switchRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name={vacunaEstado === 'APLICADA' ? 'check-circle' : 'calendar-clock'} size={18} color={colors.primary} />
                  <AppText style={styles.switchLabel}>{vacunaEstado === 'APLICADA' ? 'Aplicada' : 'Programada'}</AppText>
                </View>
                <Switch
                  value={vacunaEstado === 'PENDIENTE'}
                  onValueChange={(v) => setVacunaEstado(v ? 'PENDIENTE' : 'APLICADA')}
                  trackColor={{ false: '#DDD', true: colors.roseLight }}
                  thumbColor={vacunaEstado === 'PENDIENTE' ? colors.primary : '#CCC'}
                />
              </View>

              <FormField label={vacunaEstado === 'APLICADA' ? 'Fecha de aplicación' : 'Fecha programada'}>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker({ show: true, mode: 'date', target: 'vacunaDate' })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
                    <AppText>{dateVacuna.toLocaleDateString()}</AppText>
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </FormField>

              <FormField label={t('controles.vacuna_label_centro')} hint={userCentroSaludName ? `Por defecto: ${userCentroSaludName}` : undefined}>
                <NearestCentersCard centers={nearestCenters} loading={locationLoading} selectedValue={estVacuna} onSelect={setEstVacuna} />
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={estVacuna} onValueChange={(v) => setEstVacuna(v)}>
                    <Picker.Item label={t('controles.picker_placeholder')} value="" color={colors.textSecondary} />
                    {establecimientos.map((e, idx) => <Picker.Item key={`vac-${idx}`} label={e.nombre} value={e.id} />)}
                  </Picker>
                </View>
              </FormField>

              <View style={styles.switchRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="needle" size={18} color={colors.primary} />
                  <AppText style={styles.switchLabel}>{t('controles.vacuna_label_mas_dosis')}</AppText>
                </View>
                <Switch value={hasMoreDosis} onValueChange={setHasMoreDosis} trackColor={{ false: '#DDD', true: colors.roseLight }} thumbColor={hasMoreDosis ? colors.primary : '#CCC'} />
              </View>
            </Card>

            <AppButton title={`${t('controles.vacuna_guardar')}`} onPress={handleSaveVacuna} loading={loading} />
          </View>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showPicker.show}
        value={
          showPicker.target === 'controlDate' ? dateControl :
          showPicker.target === 'citaDate' ? dateCita :
          showPicker.target === 'citaTime' ? timeCita :
          showPicker.target === 'vacunaDate' ? dateVacuna :
          new Date()
        }
        mode={showPicker.mode}
        maximumDate={showPicker.target === 'controlDate' ? new Date() : undefined}
        minimumDate={showPicker.target === 'citaDate' ? new Date() : undefined}
        onConfirm={handleValueChange}
        onCancel={handleDismiss}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#EEE' },
  activeTab: { backgroundColor: colors.backgroundSoft, borderColor: colors.primary, borderWidth: 1.5 },
  tabText: { color: colors.textSecondary, fontWeight: '500', fontSize: 13 },
  activeTabText: { color: colors.primary, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  contentContainer: { paddingBottom: 120 },
  form: {},
  fieldGroup: { marginBottom: 14 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { marginBottom: 6, fontWeight: '600', color: colors.textPrimary, fontSize: 14 },
  fieldHint: { fontSize: 12, color: colors.primary, fontWeight: '500', fontStyle: 'italic' },
  input: {
    backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: '#EEE', fontSize: 15
  },
  dateInput: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: '#EEE'
  },
  pickerContainer: {
    backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden'
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: '#EEE'
  },
  switchLabel: { fontWeight: '600', color: colors.textPrimary, fontSize: 14 },
  nearbyLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  nearbyLoadingText: { marginLeft: 8, color: colors.textSecondary, fontSize: 13 },
  nearbySection: { marginBottom: 10 },
  nearbyTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  nearbyCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#EEE', marginBottom: 8,
  },
  nearbyCardSelected: { borderColor: colors.primary, backgroundColor: colors.roseLight },
  nearbyName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  nearbyNameSelected: { color: colors.primary, fontWeight: '700' },
  nearbyDist: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  nearbyRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CCC',
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },
  nearbyRadioSelected: { borderColor: colors.primary },
  nearbyRadioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
});
