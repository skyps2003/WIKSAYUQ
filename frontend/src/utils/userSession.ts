import { deleteItemAsync } from './webStorage';

const USER_SESSION_KEYS = [
  'userToken',
  'isLoggedIn',
  'userName',
  'userFullName',
  'userDni',
  'userRole',
  'userPhoto',
  'userAge',
  'userApellidoPaterno',
  'userApellidoMaterno',
  'userSexo',
  'userTelefono',
  'userDireccion',
  'userIdioma',
  'userComunidadId',
  'userComunidad',
  'userCentroSaludId',
  'userCentroSalud',
  'userWeeks',
  'userTrimester',
  'userFum',
];

export async function clearUserSessionData() {
  await Promise.all(
    USER_SESSION_KEYS.map((key) => deleteItemAsync(key).catch(() => undefined))
  );
}
