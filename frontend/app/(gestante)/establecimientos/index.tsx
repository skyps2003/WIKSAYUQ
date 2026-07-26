import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { WebView } from 'react-native-webview';
import { AppText } from '../../../src/components/AppText';
import { useToast } from '../../../src/components/AppToast';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import API_URL from '../../../src/config/api';
import { fetchWithTimeout } from '../../../src/utils/fetchWithTimeout';
import { OfflineDataService, PreferredHealthCenter } from '../../../src/services/offline-data.service';

// Haversine formula to calculate distance between two coordinates
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const buildMapHtml = (location: Location.LocationObject, establecimientos: any[]) => {
  const markers = establecimientos
    .filter((e) => Number.isFinite(parseFloat(e.latitud)) && Number.isFinite(parseFloat(e.longitud)))
    .map((e) => ({
      id: e.id,
      name: e.nombre || 'Centro de salud',
      lat: parseFloat(e.latitud),
      lon: parseFloat(e.longitud),
      dist: typeof e.dist === 'number' ? `${e.dist.toFixed(1)} km` : '',
      type: e.tipo || 'Centro de salud',
    }));
  const safeMarkers = JSON.stringify(markers).replace(/</g, '\\u003c');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; background: #fff5f7; }
          .leaflet-control-attribution { font-size: 9px; }
          .health-marker { width: 34px; height: 34px; border-radius: 17px; background: #e24e77; border: 3px solid #fff; box-shadow: 0 8px 18px rgba(226, 78, 119, 0.35); display: flex; align-items: center; justify-content: center; color: #fff; font: 800 15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
          .user-marker { width: 20px; height: 20px; border-radius: 10px; background: #4A90E2; border: 4px solid #fff; box-shadow: 0 0 0 6px rgba(74, 144, 226, 0.20), 0 8px 18px rgba(74, 144, 226, 0.30); }
          .popup-title { font: 800 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif; color: #33272b; margin-bottom: 3px; }
          .popup-meta { font: 600 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif; color: #8b6f78; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const userLat = ${location.coords.latitude};
          const userLon = ${location.coords.longitude};
          const markers = ${safeMarkers};
          const map = L.map('map', { zoomControl: true }).setView([userLat, userLon], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);

          const userIcon = L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [28, 28], iconAnchor: [14, 14] });
          L.marker([userLat, userLon], { icon: userIcon }).addTo(map).bindPopup('Tu ubicación');

          const bounds = [[userLat, userLon]];
          markers.forEach((center, index) => {
            const label = center.name ? center.name.trim().charAt(0).toUpperCase() : 'H';
            const icon = L.divIcon({ className: '', html: '<div class="health-marker">' + label + '</div>', iconSize: [40, 40], iconAnchor: [20, 38] });
            const popup = '<div class="popup-title">' + center.name + '</div><div class="popup-meta">' + center.type + (center.dist ? ' · ' + center.dist : '') + '</div>';
            L.marker([center.lat, center.lon], { icon }).addTo(map).bindPopup(popup);
            bounds.push([center.lat, center.lon]);
          });

          if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
          }
        </script>
      </body>
    </html>
  `;
};

export default function EstablecimientosScreen() {
  const { t } = useTranslation();
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [establecimientos, setEstablecimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferredCenter, setPreferredCenter] = useState<PreferredHealthCenter | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { showToast } = useToast();
  const nearestThree = establecimientos.slice(0, 3);

  useEffect(() => {
    (async () => {
      const network = await NetInfo.fetch();
      const online = network.isConnected === true && network.isInternetReachable !== false;
      setIsOnline(online);
      setPreferredCenter(await OfflineDataService.getPreferredHealthCenter());

      let currentLocation: Location.LocationObject | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          currentLocation = await Location.getCurrentPositionAsync({});
          setLocation(currentLocation);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }

      let centers = OfflineDataService.getCachedEstablishments();
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const response = await fetchWithTimeout(`${API_URL}/establecimientos`, {
          timeout: 12000,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'No se pudieron cargar los establecimientos');
        }

        centers = data.data || [];
        OfflineDataService.cacheEstablishments(centers);
      } catch (error) {
        console.error('Using cached health centers:', error);
      }

      let list = centers
        .filter((e: any) => e.latitud && e.longitud)
        .map((e: any) => ({
          ...e,
          dist: currentLocation
            ? getDistanceKm(currentLocation.coords.latitude, currentLocation.coords.longitude, parseFloat(e.latitud), parseFloat(e.longitud))
            : Number.POSITIVE_INFINITY,
          source: 'db',
        }));

      if (online && currentLocation) {
        try {
          const nearbyRes = await fetchWithTimeout(
            `${API_URL}/nearby-health-centers?latitude=${currentLocation.coords.latitude}&longitude=${currentLocation.coords.longitude}&radius=5000`,
            { timeout: 12000 }
          );
          const nearbyData = await nearbyRes.json();
          if (nearbyRes.ok && nearbyData.success && nearbyData.data) {
            list = [...list, ...nearbyData.data.map((e: any) => ({
              id: `nearby-${e.id}`,
              nombre: e.name,
              direccion: e.address,
              latitud: String(e.latitude),
              longitud: String(e.longitude),
              telefono: e.phone,
              tipo: e.type,
              dist: e.distance / 1000,
              source: 'osm',
            }))];
          }
        } catch (error) {
          console.error('Error fetching nearby centers:', error);
        }
      }

      setEstablecimientos(list.sort((a, b) => a.dist - b.dist));
      setLoading(false);
    })();
  }, []);

  const handleCall = (phone: string | null) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      showToast({ message: 'No hay número de teléfono registrado.', type: 'error' });
    }
  };

  const openDirections = (latitud: string, longitud: string) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`);
  };

  const openNearbyMap = () => {
    const query = location
      ? `https://www.google.com/maps/search/centros+de+salud/@${location.coords.latitude},${location.coords.longitude},14z`
      : 'https://www.google.com/maps/search/centros+de+salud+cercanos';
    Linking.openURL(query);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('establecimientos.titulo')} showBack={true} />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={{ marginTop: 16 }}>{t('establecimientos.calculando')}</AppText>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.mapContainer}>
            {location && isOnline ? (
              <WebView
                style={styles.map}
                originWhitelist={['*']}
                source={{ html: buildMapHtml(location, establecimientos) }}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.noLocationBox}>
                <MaterialCommunityIcons name={isOnline ? 'map-marker-off' : 'wifi-off'} size={40} color={colors.textSecondary} />
                <AppText style={{ textAlign: 'center', marginTop: 8 }}>
                  {isOnline ? t('establecimientos.permiso_ubicacion') : 'Sin internet: tus centros guardados siguen disponibles abajo.'}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.listContainer}>
            <View style={styles.nearestHeader}>
              <View>
                <AppText style={styles.nearestEyebrow}>CERCA DE TI</AppText>
                <AppText style={styles.nearestTitle}>3 centros más cercanos</AppText>
              </View>
              <View style={styles.nearestBadge}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.primary} />
                <AppText style={styles.nearestBadgeText}>km</AppText>
              </View>
            </View>

            {preferredCenter ? (
              <View style={styles.preferredCard}>
                <View style={styles.preferredIcon}>
                  <MaterialCommunityIcons name="hospital-building" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <AppText variant="caption" color={colors.primary} style={styles.preferredLabel}>TU CENTRO DE SALUD</AppText>
                  <AppText variant="h3" style={styles.cardTitle}>{preferredCenter.nombre}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>Seleccionado durante tu registro</AppText>
                </View>
              </View>
            ) : null}

            {nearestThree.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="hospital-building" size={28} color={colors.primary} />
                <AppText style={styles.emptyText}>No hay centros con ubicación registrada cerca.</AppText>
              </View>
            ) : null}

            {nearestThree.map((e, index) => (
              <View key={e.id} style={styles.card}>
                <View style={styles.rankCircle}>
                  <AppText style={styles.rankText}>{index + 1}</AppText>
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <AppText variant="h3" style={styles.cardTitle} numberOfLines={1}>
                      {e.nombre}
                    </AppText>
                    {e.source === 'osm' && (
                      <View style={styles.osmBadge}>
                        <AppText style={styles.osmBadgeText}>Cercano</AppText>
                      </View>
                    )}
                  </View>
                  {e.tipo && (
                    <AppText variant="body2" color={colors.primary} style={{ marginBottom: 2 }}>
                      {e.tipo}
                    </AppText>
                  )}
                  <AppText variant="body2" color={colors.textSecondary}>
                    {Number.isFinite(e.dist) ? `${e.dist.toFixed(1)} km de tu ubicación` : e.direccion || 'Ubicación disponible al conectarte'}
                  </AppText>
                </View>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => handleCall(e.telefono || e.telefono_emergencia)}
                >
                  <MaterialCommunityIcons name="phone" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.directionsButton, !Number.isFinite(e.dist) && { opacity: 0.4 }]}
                  onPress={() => openDirections(e.latitud, e.longitud)}
                  disabled={!Number.isFinite(e.dist)}
                >
                  <MaterialCommunityIcons name="directions" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.verTodosButton} onPress={openNearbyMap}>
              <AppText variant="body1" color={colors.primary} style={{ fontWeight: '600' }}>
                {t('establecimientos.ver_todos')}
              </AppText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    margin: 16,
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  map: {
    width: '100%',
    height: '100%',
  },
  noLocationBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  nearestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  nearestEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  nearestTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  nearestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundSoft,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  nearestBadgeText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 78, 119, 0.12)',
    marginBottom: 12,
  },
  emptyText: {
    marginTop: 8,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  preferredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  preferredIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSoft,
  },
  preferredLabel: {
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 78, 119, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  rankCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  osmBadge: {
    backgroundColor: colors.roseLight || '#F8DADB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  osmBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  directionsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  verTodosButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
});
