import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-chart-kit';
import { Card } from './Card';
import { AppText } from './AppText';
import { getItemAsync } from '../utils/webStorage';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import API_URL from '../config/api';

interface PesoRegistro {
  peso_kg: number;
  semana_gestacion: number;
  fecha_control: string;
}

const MAX_VISIBLE_POINTS = 6;

const formatLongDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const WeightChartCard: React.FC<{ refreshKey?: number }> = ({ refreshKey = 0 }) => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<PesoRegistro[]>([]);
  const [lastPeso, setLastPeso] = useState<number | null>(null);

  useEffect(() => {
    const fetchPeso = async () => {
      try {
        const token = await getItemAsync('userToken');
        const res = await fetch(`${API_URL}/controles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const conPeso = json.data
            .filter((c: any) => c.peso_kg)
            .map((c: any) => ({
              peso_kg: parseFloat(c.peso_kg),
              semana_gestacion: c.semanas_gestacion || 0,
              fecha_control: c.fecha_control,
            }))
            .filter((c: PesoRegistro) => Number.isFinite(c.peso_kg) && c.peso_kg >= 30 && c.peso_kg <= 200)
            .sort((a: PesoRegistro, b: PesoRegistro) => new Date(a.fecha_control).getTime() - new Date(b.fecha_control).getTime());

          setData(conPeso);
          if (conPeso.length > 0) {
            setLastPeso(conPeso[conPeso.length - 1].peso_kg);
          }
        }
      } catch (e) {
        console.error('Error fetching peso data', e);
      }
    };
    fetchPeso();
  }, [refreshKey]);

  const visibleData = data.slice(-MAX_VISIBLE_POINTS);
  const labels = visibleData.map(d => {
    const date = new Date(d.fecha_control);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  const chartData = visibleData.map(d => d.peso_kg);
  const lastFecha = data.length > 0 ? formatLongDate(data[data.length - 1].fecha_control) : '';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="chart-line-variant" size={18} color={colors.primary} />
          </View>
          <View>
            <AppText variant="body1" color={colors.textPrimary} style={styles.headerTitle}>
              {t('perfil.control_peso')}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>Evolución por control</AppText>
          </View>
        </View>
        {lastPeso !== null ? (
          <View style={styles.weightBadge}>
            <AppText style={styles.weightBadgeValue}>{lastPeso.toFixed(1)}</AppText>
            <AppText style={styles.weightBadgeUnit}>kg</AppText>
          </View>
        ) : null}
      </View>

      {data.length < 2 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="scale-bathroom" size={28} color={colors.primary} />
          <AppText variant="caption" color={colors.textSecondary} align="center" style={styles.emptyText}>
            {data.length === 1 ? 'Se necesitan al menos 2 controles para ver la gráfica.' : t('perfil.sin_peso')}
          </AppText>
        </View>
      ) : (
        <>
          <View style={{ alignItems: 'center', marginVertical: spacing.s }}>
            <LineChart
              data={{
                labels,
                datasets: [{ data: chartData }]
              }}
              width={Dimensions.get('window').width - spacing.m * 2 - 32} // Card padding
              height={180}
              yAxisSuffix="kg"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})`,
                labelColor: (opacity = 1) => colors.textSecondary,
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary }
              }}
              bezier
              style={{
                borderRadius: 16,
              }}
            />
          </View>

          <View style={styles.footer}>
            <View style={styles.footerIcon}>
              <MaterialCommunityIcons name="scale-bathroom" size={14} color={colors.primary} />
            </View>
            <AppText variant="caption" color={colors.textPrimary}>
              {lastFecha ? `${t('perfil.ultimo_peso')} ${lastFecha}` : t('perfil.ultimo_peso')}
            </AppText>
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.s,
    paddingBottom: spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 17,
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 2,
  },
  weightBadgeValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  weightBadgeUnit: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderRadius: 20,
    backgroundColor: colors.backgroundSoft,
    padding: spacing.l,
    marginTop: 8,
  },
  emptyText: {
    marginTop: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: '#F1DCE2',
    marginTop: spacing.s,
  },
  footerIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
