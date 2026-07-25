import { Request, Response } from 'express';

const dniCache = new Map<string, any>();

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await globalThis.fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const getReniecData = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;

    if (!dni || dni.length !== 8) {
      return res.status(400).json({ success: false, message: 'DNI inválido' });
    }

    if (dniCache.has(dni)) {
      return res.json({ success: true, data: dniCache.get(dni) });
    }

    const apis = [
      `https://api.apis.net.pe/v1/dni?numero=${dni}`,
      `https://dniruc.apiperu.dev/api/dni/${dni}`,
    ];

    for (const url of apis) {
      try {
        const response = await fetchWithTimeout(url, {
          headers: { 'Accept': 'application/json' },
        }, 4000);

        if (response.ok) {
          const data: any = await response.json();
          const apiData = data.data || data;
          const nombres = apiData.nombres || apiData.nombre || '';
          const apPaterno = apiData.apellidoPaterno || apiData.apellido1 || '';
          const apMaterno = apiData.apellidoMaterno || apiData.apellido2 || '';

          if (nombres) {
            const result = {
              dni,
              nombres,
              apellidoPaterno: apPaterno,
              apellidoMaterno: apMaterno,
              edad: 25
            };
            dniCache.set(dni, result);
            return res.json({ success: true, data: result });
          }
        }
      } catch (e) {
        continue;
      }
    }

    return res.json({ success: false, message: 'No se pudo encontrar el DNI. Ingresa los datos manualmente.' });

  } catch (error) {
    console.error('Error in RENIEC:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
