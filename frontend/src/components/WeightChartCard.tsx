import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { AppText } from './AppText';
import { getItemAsync, setItemAsync } from '../utils/webStorage';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import API_URL from '../config/api';

interface PesoRegistro {
  peso_kg: number;
  semana_gestacion: number;
  fecha_control: string;
}

const CHART_HEIGHT = 160;
const DOT_SIZE = 12;
const MAX_VISIBLE_POINTS = 6;

const formatShortDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

const formatLongDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const WeightChartCard: React.FC<{ refreshKey?: number }> = ({ refreshKey = 0 }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<PesoRegistro[]>([]);
  const [lastPeso, setLastPeso] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

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
  const chartValues = visibleData.map((d) => d.peso_kg);
  const rawMax = chartValues.length > 0 ? Math.max(...chartValues) : 70;
  const rawMin = chartValues.length > 0 ? Math.min(...chartValues) : 55;
  const padding = Math.max(2, (rawMax - rawMin) * 0.2);
  const maxVal = Math.ceil(rawMax + padding);
  const minVal = Math.max(0, Math.floor(rawMin - padding));
  const range = maxVal - minVal || 1;

  const getY = (val: number) => 12 + ((maxVal - val) / range) * (CHART_HEIGHT - 30);

  const handleChartLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  const getPointPositions = () => {
    const sidePadding = 16;
    const usableWidth = Math.max(chartWidth - sidePadding * 2, 0);

    return visibleData.map((d, i) => ({
      x: visibleData.length > 1 ? sidePadding + (i / (visibleData.length - 1)) * usableWidth : chartWidth / 2,
      y: getY(d.peso_kg),
      semana: d.semana_gestacion,
      peso: d.peso_kg,
      fecha: d.fecha_control,
    }));
  };

  const points = chartWidth > 0 ? getPointPositions() : [];
  const lastFecha = data.length > 0 ? formatLongDate(data[data.length - 1].fecha_control) : '';

  const renderLines = () => {
    if (points.length < 2) return null;
    const lines = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      lines.push(
        <View
          key={`line-${i}`}
          style={[
            styles.chartLine,
            {
              left: p1.x,
              top: p1.y,
              width: length,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 0',
            },
          ]}
        />
      );
    }
    return lines;
  };

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

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="scale-bathroom" size={28} color={colors.primary} />
          <AppText variant="caption" color={colors.textSecondary} align="center" style={styles.emptyText}>
            {t('perfil.sin_peso')}
          </AppText>
        </View>
      ) : (
        <>
          <View style={styles.chartArea}>
            <View style={styles.yAxis}>
              <AppText variant="caption" color={colors.textSecondary}>{Math.round(maxVal)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{Math.round((maxVal + minVal) / 2)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{Math.round(minVal)}</AppText>
            </View>
            <View style={styles.chart} onLayout={handleChartLayout}>
              <View style={styles.chartGlow} />
              <View style={styles.gridLines}>
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
              </View>

              {renderLines()}

              {points.map((p, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === points.length - 1 && styles.dotCurrent,
                    {
                      left: p.x,
                      top: p.y,
                    },
                  ]}
                >
                  <View style={[styles.dotInner, i === points.length - 1 && styles.dotInnerCurrent]} />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.xAxis}>
            {points.map((p, i) => (
              <AppText
                key={`${p.fecha}-${i}`}
                variant="caption"
                color={colors.textSecondary}
                style={styles.xAxisLabel}
              >
                {formatShortDate(p.fecha)}
              </AppText>
            ))}
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
    marginBottom: spacing.m,
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
  },
  emptyText: {
    marginTop: 8,
    lineHeight: 18,
  },
  chartArea: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
    marginBottom: 8,
  },
  yAxis: {
    width: 34,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingVertical: 8,
  },
  chart: {
    flex: 1,
    position: 'relative',
    borderRadius: 18,
    backgroundColor: '#FFF7F9',
    overflow: 'hidden',
    paddingHorizontal: 0,
  },
  chartGlow: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(226, 78, 119, 0.10)',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginLeft: -(DOT_SIZE / 2),
    marginTop: -(DOT_SIZE / 2),
    zIndex: 3,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F3B5C5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  dotCurrent: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -9,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  dotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F3B5C5',
  },
  dotInnerCurrent: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  chartLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: colors.primary,
    opacity: 0.35,
    zIndex: 1,
    borderRadius: 4,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#EFD9DF',
    opacity: 0.7,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 34,
    marginBottom: spacing.s,
  },
  xAxisLabel: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: '#F1DCE2',
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
