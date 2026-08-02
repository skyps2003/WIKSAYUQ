export type UbigeoOption = {
  id: string;
  codigo_ubigeo: string;
  nombre: string;
};

export const APURIMAC_DEPARTMENT_ID = '00000000-0000-0000-0000-000000000003';

const provinceNames: Array<[string, string]> = [
  ['0301', 'Abancay'],
  ['0302', 'Andahuaylas'],
  ['0303', 'Antabamba'],
  ['0304', 'Aymaraes'],
  ['0305', 'Cotabambas'],
  ['0306', 'Chincheros'],
  ['0307', 'Grau'],
];

const districtNames: Record<string, string[]> = {
  '0301': ['Abancay', 'Chacoche', 'Circa', 'Curahuasi', 'Huanipaca', 'Lambrama', 'Pichirhua', 'San Pedro de Cachora', 'Tamburco'],
  '0302': ['Andahuaylas', 'Andarapa', 'Chiara', 'Huancarama', 'Huancaray', 'Huayana', 'Kishuara', 'Pacobamba', 'Pacucha', 'Pampachiri', 'Pomacocha', 'San Antonio de Cachi', 'San Jerónimo', 'San Miguel de Chaccrampa', 'Santa María de Chicmo', 'Talavera', 'Tumay Huaraca', 'Turpo', 'Kaquiabamba', 'José María Arguedas'],
  '0303': ['Antabamba', 'El Oro', 'Huaquirca', 'Juan Espinoza Medrano', 'Oropesa', 'Pachaconas', 'Sabaino'],
  '0304': ['Chalhuanca', 'Capaya', 'Caraybamba', 'Chapimarca', 'Colcabamba', 'Cotaruse', 'Huayllo', 'Justo Apu Sahuaraura', 'Lucre', 'Pocohuanca', 'San Juan de Chacña', 'Sañayca', 'Soraya', 'Tapairihua', 'Tintay', 'Toraya', 'Yanaca'],
  '0305': ['Tambobamba', 'Cotabambas', 'Coyllurqui', 'Haquira', 'Mara', 'Challhuahuacho'],
  '0306': ['Chincheros', 'Anco-Huallo', 'Cocharcas', 'Huaccana', 'Ocobamba', 'Ongoy', 'Uranmarca', 'Ranracancha', 'Rocchacc', 'El Porvenir', 'Los Chankas'],
  '0307': ['Chuquibambilla', 'Curpahuasi', 'Gamarra', 'Huayllati', 'Mamara', 'Micaela Bastidas', 'Pataypampa', 'Progreso', 'San Antonio', 'Santa Rosa', 'Turpay', 'Vilcabamba', 'Virundo', 'Curasco'],
};

const provinceId = (code: string) => `00000000-0000-0000-0000-00000000${code}`;
const districtId = (code: string) => `00000000-0000-0000-0000-000000${code}`;

export const APURIMAC_PROVINCES: UbigeoOption[] = provinceNames.map(([code, name]) => ({
  id: provinceId(code),
  codigo_ubigeo: code,
  nombre: name,
}));

export const getApurimacDistricts = (selectedProvinceId: string): UbigeoOption[] => {
  const provinceCode = selectedProvinceId.slice(-4);
  return (districtNames[provinceCode] || []).map((name, index) => {
    const code = `${provinceCode}${String(index + 1).padStart(2, '0')}`;
    return { id: districtId(code), codigo_ubigeo: code, nombre: name };
  });
};
