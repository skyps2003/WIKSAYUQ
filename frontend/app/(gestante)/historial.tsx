import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

import { AppText } from '../../src/components/AppText';
import { Card } from '../../src/components/Card';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import API_URL from '../../src/config/api';
import { calculateGestationalWeeks } from '../../src/utils/gestation';
import { db } from '../../src/database';

type TabType = 'controles' | 'vacunas';
type DetailItem = { type: 'control' | 'vacuna'; item: any };

export default function HistorialScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('controles');
  
  const [citas, setCitas] = useState<any[]>([]);
  const [vacunasUsuario, setVacunasUsuario] = useState<any[]>([]);
  const [userCentroSalud, setUserCentroSalud] = useState('');
  const [userCentroSaludId, setUserCentroSaludId] = useState('');
  const [userFum, setUserFum] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<DetailItem | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const storedCentroSalud = await SecureStore.getItemAsync('userCentroSalud');
      const storedCentroSaludId = await SecureStore.getItemAsync('userCentroSaludId');
      const storedFum = await SecureStore.getItemAsync('userFum');
      setUserCentroSalud(storedCentroSalud || '');
      setUserCentroSaludId(storedCentroSaludId || '');
      setUserFum(storedFum || '');
      loadPendingRecords();
      
      const [resCitas, resVacunas] = await Promise.all([
        fetch(`${API_URL}/citas`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/vacunas/mis-vacunas`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const dataCitas = await resCitas.json();
      const dataVac = await resVacunas.json();

      if (dataCitas.success) {
        // Filter only past appointments or those with controles
        const pastCitas = dataCitas.data.filter((c: any) => new Date(c.fecha_programada) <= new Date() || c.controles_prenatales?.length > 0).reverse();
        setCitas([...getPendingControls(), ...pastCitas]);
      }
      if (dataVac.success) setVacunasUsuario([...getPendingVaccines(), ...dataVac.data]);
    } catch (error) {
      console.error(error);
      loadPendingRecords();
    }
  };

  const getPendingRows = () => db.getAllSync<{ id: string; table_name: string; data: string }>(
    'SELECT id, table_name, data FROM sync_queue WHERE status = "PENDING" ORDER BY created_at DESC'
  );

  const getPendingControls = () => getPendingRows()
    .filter((item) => item.table_name === 'controles')
    .map((item) => {
      const data = JSON.parse(item.data);
      return {
        id: item.id,
        fecha_programada: data.fecha_control,
        motivo: 'Control prenatal',
        estado: 'PENDIENTE_SYNC',
        sync_pending: true,
        controles_prenatales: [{
          numero_control: null,
          fecha_control: data.fecha_control,
          semanas_gestacion: null,
          peso_kg: data.peso_kg,
          presion_sistolica: data.presion_sistolica,
          presion_diastolica: data.presion_diastolica,
          nivel_riesgo: null,
          estado: 'PENDIENTE_SYNC',
        }],
      };
    });

  const getPendingVaccines = () => getPendingRows()
    .filter((item) => item.table_name === 'vacunas')
    .map((item) => {
      const data = JSON.parse(item.data);
      return {
        id: item.id,
        sync_pending: true,
        estado: 'PENDIENTE_SYNC',
        nombre_vacuna: data.nombre_vacuna,
        descripcion_vacuna: data.descripcion_vacuna,
        fecha_aplicacion: data.fecha_aplicacion,
        fecha_programada: data.fecha_programada,
        numero_dosis: 1,
      };
    });

  const loadPendingRecords = () => {
    setCitas(getPendingControls());
    setVacunasUsuario(getPendingVaccines());
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    const months = i18n.language === 'qu' 
      ? ['Qul', 'Hat', 'Pau', 'Ayr', 'Aym', 'Int', 'Ant', 'Qha', 'Uma', 'Kan', 'Aya', 'Qha']
      : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getLugar = (item: any) => {
    if (userCentroSaludId === 'custom' && userCentroSalud) return userCentroSalud;
    return item.establecimientos_salud?.nombre || 'Centro de salud';
  };

  const detailValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return String(value);
  };

  const getControlSemana = (control: any, fechaControl: string, fumValue?: string | null) => {
    const fumSource = userFum || fumValue;
    const fum = new Date(fumSource || '');
    const fecha = new Date(fechaControl);

    if (!Number.isNaN(fum.getTime()) && !Number.isNaN(fecha.getTime()) && fecha >= fum) {
      const weeks = calculateGestationalWeeks(fumSource, fecha);
      return weeks !== null ? `${weeks} semanas` : null;
    }

    const controlWeeks = Number(control?.semanas_gestacion);
    if (Number.isFinite(controlWeeks) && controlWeeks > 0) return `${controlWeeks} semanas`;

    return null;
  };

  const renderDetailRow = (label: string, value: any) => (
    <View style={styles.detailRow}>
      <AppText variant="caption" color={colors.textSecondary} style={styles.detailLabel}>{label}</AppText>
      <AppText variant="body2" color={colors.textPrimary} style={styles.detailText}>{detailValue(value)}</AppText>
    </View>
  );

  const renderDetailContent = () => {
    if (!selectedDetail) return null;

    if (selectedDetail.type === 'control') {
      const cita = selectedDetail.item;
      const control = cita.controles_prenatales?.[0];
      const fecha = control?.fecha_control || cita.fecha_realizacion || cita.fecha_programada;
      const pa = control?.presion_sistolica && control?.presion_diastolica
        ? `${control.presion_sistolica}/${control.presion_diastolica}`
        : null;

      return (
        <>
          <View style={styles.detailHeader}>
            <MaterialCommunityIcons name="calendar-heart" size={24} color={colors.primary} />
            <View style={styles.detailHeaderText}>
              <AppText variant="body1" style={styles.detailTitle}>{t('historial.control_titulo')}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>{formatDateLabel(fecha)}</AppText>
            </View>
          </View>
          {cita.sync_pending ? renderDetailRow('Sincronización', 'Pendiente de sincronizar') : null}
          {renderDetailRow('Fecha', formatDateLabel(fecha))}
          {renderDetailRow('Lugar', getLugar(cita))}
          {renderDetailRow('Motivo', cita.motivo)}
          {renderDetailRow('Estado', control?.estado || cita.estado)}
          {renderDetailRow('N° de control', control?.numero_control)}
          {renderDetailRow('Semana de gestación', getControlSemana(control, fecha, cita.embarazos?.fecha_ultima_menstruacion))}
          {renderDetailRow('Peso', control?.peso_kg ? `${control.peso_kg} kg` : null)}
          {renderDetailRow('Presión arterial', pa)}
          {renderDetailRow('Nivel de riesgo', control?.nivel_riesgo)}
        </>
      );
    }

    const vacuna = selectedDetail.item;
    const estadoLabel = vacuna.sync_pending ? 'Pendiente de sincronizar' : vacuna.estado === 'APLICADA' ? t('historial.estado_aplicada') : vacuna.estado === 'PENDIENTE' ? t('historial.estado_pendiente') : vacuna.estado === 'ATRASADA' ? t('historial.estado_atrasada') : vacuna.estado;
    const fecha = vacuna.fecha_aplicacion || vacuna.fecha_programada;
    const totalDosis = vacuna.vacunas?.numero_dosis || 1;

    return (
      <>
        <View style={styles.detailHeader}>
          <MaterialCommunityIcons name="needle" size={24} color={colors.primary} />
          <View style={styles.detailHeaderText}>
            <AppText variant="body1" style={styles.detailTitle}>{vacuna.vacunas?.nombre || vacuna.nombre_vacuna || 'Vacuna'}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>{fecha ? formatDateLabel(fecha) : '—'}</AppText>
          </View>
        </View>
        {vacuna.sync_pending ? renderDetailRow('Sincronización', 'Pendiente de sincronizar') : null}
        {renderDetailRow('Fecha', fecha ? formatDateLabel(fecha) : null)}
        {renderDetailRow('Lugar', getLugar(vacuna))}
        {renderDetailRow('Estado', estadoLabel)}
        {renderDetailRow('Dosis', t('historial.dosis', { num: vacuna.numero_dosis, total: totalDosis }))}
        {renderDetailRow('Descripción', vacuna.vacunas?.descripcion || vacuna.descripcion_vacuna)}
        {renderDetailRow('Fabricante', vacuna.fabricante)}
        {renderDetailRow('Lote', vacuna.lote)}
        {renderDetailRow('Observaciones', vacuna.observaciones)}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('historial.titulo')} showBack={false} />

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'controles' && styles.tabActive]} 
          onPress={() => setActiveTab('controles')}
        >
          <AppText variant="body1" style={activeTab === 'controles' ? styles.tabTextActive : styles.tabText}>
            {t('historial.tab_controles')}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'vacunas' && styles.tabActive]} 
          onPress={() => setActiveTab('vacunas')}
        >
          <AppText variant="body1" style={activeTab === 'vacunas' ? styles.tabTextActive : styles.tabText}>
            {t('historial.tab_vacunas')}
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'controles' && (
          <View style={styles.gridContainer}>
            {citas.map((cita) => {
              // Si hay control asociado
              const control = cita.controles_prenatales && cita.controles_prenatales.length > 0 
                ? cita.controles_prenatales[0] 
                : null;
              
              const peso = control?.peso_kg ? `${control.peso_kg} kg` : '-- kg';
              const pa = control?.presion_sistolica && control?.presion_diastolica 
                ? `${control.presion_sistolica}/${control.presion_diastolica}` 
                : '--/--';
                
              return (
                <TouchableOpacity key={cita.id} style={styles.gridCardWrap} activeOpacity={0.75} onPress={() => setSelectedDetail({ type: 'control', item: cita })}>
                  <Card style={styles.gridCard}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="calendar-month" size={18} color={colors.primary} />
                      <AppText variant="body2" style={{ marginLeft: 6, flex: 1, fontWeight: '600' }}>{formatDateLabel(cita.fecha_programada)}</AppText>
                    </View>
                    <AppText variant="caption" style={{ fontWeight: '500', marginTop: 4 }}>{t('historial.control_titulo')}</AppText>
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                      {t('historial.peso')}: {peso}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 1 }}>
                      {t('historial.pa')}: {pa}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }} numberOfLines={1}>
                      {getLugar(cita)}
                    </AppText>
                  </Card>
                </TouchableOpacity>
              );
            })}
            
            {citas.length === 0 && (
              <AppText style={styles.emptyText}>{t('historial.vacio_controles')}</AppText>
            )}
          </View>
        )}

        {activeTab === 'vacunas' && (
          <View style={styles.gridContainer}>
            {vacunasUsuario.map(vu => {
              const estadoLabel = vu.sync_pending ? 'Pendiente' : vu.estado === 'APLICADA' ? t('historial.estado_aplicada') : vu.estado === 'PENDIENTE' ? t('historial.estado_pendiente') : vu.estado === 'ATRASADA' ? t('historial.estado_atrasada') : vu.estado;
              const estadoColor = vu.sync_pending ? '#C47A00' : vu.estado === 'APLICADA' ? '#2E7D32' : vu.estado === 'PENDIENTE' ? '#1976D2' : vu.estado === 'ATRASADA' ? '#C62828' : colors.textSecondary;
              const displayDate = vu.fecha_aplicacion || vu.fecha_programada;
              const totalDosis = vu.vacunas?.numero_dosis || 1;
              return (
                <TouchableOpacity key={vu.id} style={styles.gridCardWrap} activeOpacity={0.75} onPress={() => setSelectedDetail({ type: 'vacuna', item: vu })}>
                  <Card style={styles.gridCard}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="needle" size={18} color={colors.primary} />
                      <AppText variant="body2" style={{ marginLeft: 6, flex: 1, fontWeight: '600' }}>{displayDate ? formatDateLabel(displayDate) : '—'}</AppText>
                    </View>
                    <AppText variant="caption" style={{ fontWeight: '500', marginTop: 4 }} numberOfLines={1}>{vu.vacunas?.nombre || vu.nombre_vacuna}</AppText>
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                      {t('historial.dosis', { num: vu.numero_dosis, total: totalDosis })}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }} numberOfLines={1}>
                      {getLugar(vu)}
                    </AppText>
                    <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '20', marginTop: 4 }]}> 
                      <AppText style={[styles.estadoBadgeText, { color: estadoColor }]}>{estadoLabel}</AppText>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
            {vacunasUsuario.length === 0 && (
              <AppText style={styles.emptyText}>{t('historial.vacio_vacunas')}</AppText>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedDetail} transparent animationType="fade" onRequestClose={() => setSelectedDetail(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
              {renderDetailContent()}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedDetail(null)} activeOpacity={0.8}>
              <AppText style={styles.closeButtonText}>Cerrar</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5F6',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: spacing.m,
    borderRadius: 25,
    padding: 4,
    marginBottom: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#FFD4DB',
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    padding: spacing.m,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCardWrap: {
    width: '48%',
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  estadoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(40, 24, 29, 0.35)',
    justifyContent: 'center',
    padding: spacing.m,
  },
  modalCard: {
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  modalContent: {
    padding: spacing.l,
    paddingBottom: spacing.m,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#F1DCE2',
    marginBottom: spacing.s,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  detailRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F7E8EC',
  },
  detailLabel: {
    marginBottom: 2,
    fontWeight: '700',
  },
  detailText: {
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '800',
  }
});
