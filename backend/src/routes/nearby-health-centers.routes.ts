import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const radius = Number(req.query.radius || 5000);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      res.status(400).json({
        success: false,
        message: 'La latitud y longitud son obligatorias',
      });
      return;
    }

    if (radius < 100 || radius > 50000) {
      res.status(400).json({
        success: false,
        message: 'El radio debe estar entre 100 y 50000 metros',
      });
      return;
    }

    // Overpass API (OpenStreetMap) - gratuito, sin token
    const query = `
      [out:json][timeout:15];
      (
        nwr(around:${radius},${latitude},${longitude})["amenity"~"hospital|clinic|doctors"];
        nwr(around:${radius},${latitude},${longitude})["healthcare"~"hospital|clinic|doctor|pharmacy"];
      );
      out center tags;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.warn(`Overpass API unavailable: ${response.status} ${response.statusText}`);
      res.status(200).json({
        success: true,
        total: 0,
        data: [],
        source: 'overpass-unavailable',
      });
      return;
    }

    const data = await response.json();
    const elements = data.elements || [];

    const centers = elements.map((el: any) => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      const tags = el.tags || {};

      // Calcular distancia aproximada
      const R = 6371000; // Radio de la Tierra en metros
      const dLat = ((lat - latitude) * Math.PI) / 180;
      const dLon = ((lon - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latitude * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = Math.round(R * c);

      const type = tags.healthcare || tags.amenity || 'centro_salud';
      const typeLabels: Record<string, string> = {
        hospital: 'Hospital',
        clinic: 'Clínica',
        doctors: 'Consultorio',
        pharmacy: 'Farmacia',
        health_center: 'Centro de Salud',
        medical_center: 'Centro Médico',
      };

      return {
        id: String(el.id),
        name: tags.name || tags['name:es'] || tags['name:es_419'] || 'Centro de salud',
        address: tags['addr:street']
          ? `${tags['addr:street']}${tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''}`
          : tags.description || '',
        latitude: lat,
        longitude: lon,
        type: typeLabels[type] || type,
        phone: tags.phone || tags['contact:phone'] || null,
        distance,
      };
    });

    // Ordenar por distancia
    centers.sort((a: any, b: any) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      total: centers.length,
      data: centers,
    });
  } catch (error) {
    console.error('Error fetching nearby health centers:', error);
    res.status(200).json({
      success: true,
      total: 0,
      data: [],
      source: 'overpass-unavailable',
    });
  }
});

export default router;
