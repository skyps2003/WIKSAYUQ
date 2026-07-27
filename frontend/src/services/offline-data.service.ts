import { getItemAsync, setItemAsync } from '../utils/webStorage';
import { getCachedData, saveCachedData } from '../database';

export type PreferredHealthCenter = {
  id: string;
  nombre: string;
};

const CONTACTS_CACHE_PREFIX = 'contactos:';
const ESTABLISHMENTS_CACHE_KEY = 'establecimientos';
const preferredCenterKey = (dni: string) => `centro-salud-${dni}`;

const getUserScope = async () => (await getItemAsync('userDni')) || 'anonimo';

export class OfflineDataService {
  static async cacheContacts(contactos: any[]) {
    saveCachedData(`${CONTACTS_CACHE_PREFIX}${await getUserScope()}`, contactos);
  }

  static async getCachedContacts() {
    return getCachedData<any[]>(`${CONTACTS_CACHE_PREFIX}${await getUserScope()}`, []);
  }

  static async replaceCachedContact(localId: string, contacto: any) {
    const contactos = await this.getCachedContacts();
    await this.cacheContacts(contactos.map((item) => item.id === localId ? contacto : item));
  }

  static cacheEstablishments(establecimientos: any[]) {
    saveCachedData(ESTABLISHMENTS_CACHE_KEY, establecimientos);
  }

  static getCachedEstablishments() {
    return getCachedData<any[]>(ESTABLISHMENTS_CACHE_KEY, []);
  }

  static async savePreferredHealthCenter(center: PreferredHealthCenter, dni?: string) {
    const scope = dni || await getUserScope();
    await setItemAsync(preferredCenterKey(scope), JSON.stringify(center));
  }

  static async getPreferredHealthCenter(dni?: string): Promise<PreferredHealthCenter | null> {
    const scope = dni || await getUserScope();
    const value = await getItemAsync(preferredCenterKey(scope));

    if (value) {
      try {
        return JSON.parse(value) as PreferredHealthCenter;
      } catch {
        return null;
      }
    }

    // Migrate the center kept by older APK versions for the same signed-in user.
    const sessionDni = await getItemAsync('userDni');
    const id = await getItemAsync('userCentroSaludId');
    const nombre = await getItemAsync('userCentroSalud');
    if (sessionDni === scope && id && nombre) {
      const center = { id, nombre };
      await this.savePreferredHealthCenter(center, scope);
      return center;
    }

    return null;
  }
}
