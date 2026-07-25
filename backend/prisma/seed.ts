import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Apurímac Ubigeo data...');

  const idDep = '00000000-0000-0000-0000-000000000003';
  // 1. Departamento
  const dep = await prisma.departamentos.upsert({
    where: { codigo_ubigeo: '03' },
    update: {},
    create: {
      id: idDep,
      codigo_ubigeo: '03',
      nombre: 'Apurímac',
    },
  });

  // 2. Provincias (Apurímac tiene 7 provincias)
  const provincias = [
    { id: '00000000-0000-0000-0000-000000000301', codigo_ubigeo: '0301', nombre: 'Abancay', id_departamento: idDep },
    { id: '00000000-0000-0000-0000-000000000302', codigo_ubigeo: '0302', nombre: 'Andahuaylas', id_departamento: idDep },
    { id: '00000000-0000-0000-0000-000000000303', codigo_ubigeo: '0303', nombre: 'Antabamba', id_departamento: idDep },
    { id: '00000000-0000-0000-0000-000000000304', codigo_ubigeo: '0304', nombre: 'Aymaraes', id_departamento: idDep },
    { id: '00000000-0000-0000-0000-000000000305', codigo_ubigeo: '0305', nombre: 'Cotabambas', id_departamento: idDep },
    { id: '00000000-0000-0000-0000-000000000306', codigo_ubigeo: '0306', nombre: 'Chincheros', id_departamento: idDep },
    { id: '00000000-0000-0000-0000-000000000307', codigo_ubigeo: '0307', nombre: 'Grau', id_departamento: idDep },
  ];

  await prisma.provincias.createMany({
    data: provincias.map((p) => ({
      id: p.id,
      codigo_ubigeo: p.codigo_ubigeo,
      nombre: p.nombre,
      departamento_id: p.id_departamento,
    })),
    skipDuplicates: true,
  });
  await Promise.all(provincias.map((p) => prisma.provincias.update({
    where: { codigo_ubigeo: p.codigo_ubigeo },
    data: { nombre: p.nombre, departamento_id: p.id_departamento },
  })));

  // 3. Distritos oficiales de Apurímac
  const distritos = [
    { id: '00000000-0000-0000-0000-000000030101', codigo_ubigeo: '030101', nombre: 'Abancay', id_provincia: '00000000-0000-0000-0000-000000000301' },
    { id: '00000000-0000-0000-0000-000000030102', codigo_ubigeo: '030102', nombre: 'Chacoche', id_provincia: '00000000-0000-0000-0000-000000000301' },
    { id: '00000000-0000-0000-0000-000000030103', codigo_ubigeo: '030103', nombre: 'Circa', id_provincia: '00000000-0000-0000-0000-000000000301' },
    { id: '00000000-0000-0000-0000-000000030104', codigo_ubigeo: '030104', nombre: 'Curahuasi', id_provincia: '00000000-0000-0000-0000-000000000301' },
    { id: '00000000-0000-0000-0000-000000030105', codigo_ubigeo: '030105', nombre: 'Huanipaca', id_provincia: '00000000-0000-0000-0000-000000000301' },
    { id: '00000000-0000-0000-0000-000000030106', codigo_ubigeo: '030106', nombre: 'Lambrama', id_provincia: '00000000-0000-0000-0000-000000000301' },
    { id: '00000000-0000-0000-0000-000000030107', codigo_ubigeo: '030107', nombre: 'Pichirhua', id_provincia: '00000000-0000-0000-0000-000000000301' },
    { id: '00000000-0000-0000-0000-000000030108', codigo_ubigeo: '030108', nombre: 'San Pedro de Cachora', id_provincia: '00000000-0000-0000-0000-000000000301' },
    { id: '00000000-0000-0000-0000-000000030109', codigo_ubigeo: '030109', nombre: 'Tamburco', id_provincia: '00000000-0000-0000-0000-000000000301' },
    { id: '00000000-0000-0000-0000-000000030201', codigo_ubigeo: '030201', nombre: 'Andahuaylas', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030202', codigo_ubigeo: '030202', nombre: 'Andarapa', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030203', codigo_ubigeo: '030203', nombre: 'Chiara', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030204', codigo_ubigeo: '030204', nombre: 'Huancarama', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030205', codigo_ubigeo: '030205', nombre: 'Huancaray', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030206', codigo_ubigeo: '030206', nombre: 'Huayana', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030207', codigo_ubigeo: '030207', nombre: 'Kishuara', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030208', codigo_ubigeo: '030208', nombre: 'Pacobamba', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030209', codigo_ubigeo: '030209', nombre: 'Pacucha', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030210', codigo_ubigeo: '030210', nombre: 'Pampachiri', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030211', codigo_ubigeo: '030211', nombre: 'Pomacocha', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030212', codigo_ubigeo: '030212', nombre: 'San Antonio de Cachi', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030213', codigo_ubigeo: '030213', nombre: 'San Jerónimo', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030214', codigo_ubigeo: '030214', nombre: 'San Miguel de Chaccrampa', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030215', codigo_ubigeo: '030215', nombre: 'Santa María de Chicmo', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030216', codigo_ubigeo: '030216', nombre: 'Talavera', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030217', codigo_ubigeo: '030217', nombre: 'Tumay Huaraca', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030218', codigo_ubigeo: '030218', nombre: 'Turpo', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030219', codigo_ubigeo: '030219', nombre: 'Kaquiabamba', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030220', codigo_ubigeo: '030220', nombre: 'José María Arguedas', id_provincia: '00000000-0000-0000-0000-000000000302' },
    { id: '00000000-0000-0000-0000-000000030301', codigo_ubigeo: '030301', nombre: 'Antabamba', id_provincia: '00000000-0000-0000-0000-000000000303' },
    { id: '00000000-0000-0000-0000-000000030302', codigo_ubigeo: '030302', nombre: 'El Oro', id_provincia: '00000000-0000-0000-0000-000000000303' },
    { id: '00000000-0000-0000-0000-000000030303', codigo_ubigeo: '030303', nombre: 'Huaquirca', id_provincia: '00000000-0000-0000-0000-000000000303' },
    { id: '00000000-0000-0000-0000-000000030304', codigo_ubigeo: '030304', nombre: 'Juan Espinoza Medrano', id_provincia: '00000000-0000-0000-0000-000000000303' },
    { id: '00000000-0000-0000-0000-000000030305', codigo_ubigeo: '030305', nombre: 'Oropesa', id_provincia: '00000000-0000-0000-0000-000000000303' },
    { id: '00000000-0000-0000-0000-000000030306', codigo_ubigeo: '030306', nombre: 'Pachaconas', id_provincia: '00000000-0000-0000-0000-000000000303' },
    { id: '00000000-0000-0000-0000-000000030307', codigo_ubigeo: '030307', nombre: 'Sabaino', id_provincia: '00000000-0000-0000-0000-000000000303' },
    { id: '00000000-0000-0000-0000-000000030401', codigo_ubigeo: '030401', nombre: 'Chalhuanca', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030402', codigo_ubigeo: '030402', nombre: 'Capaya', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030403', codigo_ubigeo: '030403', nombre: 'Caraybamba', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030404', codigo_ubigeo: '030404', nombre: 'Chapimarca', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030405', codigo_ubigeo: '030405', nombre: 'Colcabamba', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030406', codigo_ubigeo: '030406', nombre: 'Cotaruse', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030407', codigo_ubigeo: '030407', nombre: 'Huayllo', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030408', codigo_ubigeo: '030408', nombre: 'Justo Apu Sahuaraura', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030409', codigo_ubigeo: '030409', nombre: 'Lucre', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030410', codigo_ubigeo: '030410', nombre: 'Pocohuanca', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030411', codigo_ubigeo: '030411', nombre: 'San Juan de Chacña', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030412', codigo_ubigeo: '030412', nombre: 'Sañayca', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030413', codigo_ubigeo: '030413', nombre: 'Soraya', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030414', codigo_ubigeo: '030414', nombre: 'Tapairihua', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030415', codigo_ubigeo: '030415', nombre: 'Tintay', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030416', codigo_ubigeo: '030416', nombre: 'Toraya', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030417', codigo_ubigeo: '030417', nombre: 'Yanaca', id_provincia: '00000000-0000-0000-0000-000000000304' },
    { id: '00000000-0000-0000-0000-000000030501', codigo_ubigeo: '030501', nombre: 'Tambobamba', id_provincia: '00000000-0000-0000-0000-000000000305' },
    { id: '00000000-0000-0000-0000-000000030502', codigo_ubigeo: '030502', nombre: 'Cotabambas', id_provincia: '00000000-0000-0000-0000-000000000305' },
    { id: '00000000-0000-0000-0000-000000030503', codigo_ubigeo: '030503', nombre: 'Coyllurqui', id_provincia: '00000000-0000-0000-0000-000000000305' },
    { id: '00000000-0000-0000-0000-000000030504', codigo_ubigeo: '030504', nombre: 'Haquira', id_provincia: '00000000-0000-0000-0000-000000000305' },
    { id: '00000000-0000-0000-0000-000000030505', codigo_ubigeo: '030505', nombre: 'Mara', id_provincia: '00000000-0000-0000-0000-000000000305' },
    { id: '00000000-0000-0000-0000-000000030506', codigo_ubigeo: '030506', nombre: 'Challhuahuacho', id_provincia: '00000000-0000-0000-0000-000000000305' },
    { id: '00000000-0000-0000-0000-000000030601', codigo_ubigeo: '030601', nombre: 'Chincheros', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030602', codigo_ubigeo: '030602', nombre: 'Anco-Huallo', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030603', codigo_ubigeo: '030603', nombre: 'Cocharcas', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030604', codigo_ubigeo: '030604', nombre: 'Huaccana', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030605', codigo_ubigeo: '030605', nombre: 'Ocobamba', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030606', codigo_ubigeo: '030606', nombre: 'Ongoy', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030607', codigo_ubigeo: '030607', nombre: 'Uranmarca', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030608', codigo_ubigeo: '030608', nombre: 'Ranracancha', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030609', codigo_ubigeo: '030609', nombre: 'Rocchacc', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030610', codigo_ubigeo: '030610', nombre: 'El Porvenir', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030611', codigo_ubigeo: '030611', nombre: 'Los Chankas', id_provincia: '00000000-0000-0000-0000-000000000306' },
    { id: '00000000-0000-0000-0000-000000030701', codigo_ubigeo: '030701', nombre: 'Chuquibambilla', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030702', codigo_ubigeo: '030702', nombre: 'Curpahuasi', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030703', codigo_ubigeo: '030703', nombre: 'Gamarra', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030704', codigo_ubigeo: '030704', nombre: 'Huayllati', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030705', codigo_ubigeo: '030705', nombre: 'Mamara', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030706', codigo_ubigeo: '030706', nombre: 'Micaela Bastidas', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030707', codigo_ubigeo: '030707', nombre: 'Pataypampa', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030708', codigo_ubigeo: '030708', nombre: 'Progreso', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030709', codigo_ubigeo: '030709', nombre: 'San Antonio', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030710', codigo_ubigeo: '030710', nombre: 'Santa Rosa', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030711', codigo_ubigeo: '030711', nombre: 'Turpay', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030712', codigo_ubigeo: '030712', nombre: 'Vilcabamba', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030713', codigo_ubigeo: '030713', nombre: 'Virundo', id_provincia: '00000000-0000-0000-0000-000000000307' },
    { id: '00000000-0000-0000-0000-000000030714', codigo_ubigeo: '030714', nombre: 'Curasco', id_provincia: '00000000-0000-0000-0000-000000000307' },
  ];

  await prisma.distritos.createMany({
    data: distritos.map((d) => ({
      id: d.id,
      codigo_ubigeo: d.codigo_ubigeo,
      nombre: d.nombre,
      provincia_id: d.id_provincia,
    })),
    skipDuplicates: true,
  });
  await Promise.all(distritos.map((d) => prisma.distritos.update({
    where: { codigo_ubigeo: d.codigo_ubigeo },
    data: { nombre: d.nombre, provincia_id: d.id_provincia },
  })));

  // 4. Comunidades base: una comunidad Centro por cada distrito.
  const comunidades = [
    ...distritos.map((d) => ({
      id: `00000000-0000-0000-0000-000${d.codigo_ubigeo}001`,
      nombre: `${d.nombre} Centro`,
      id_distrito: d.id,
    })),
    { id: '00000000-0000-0000-0000-000030101002', nombre: 'Las Arenas', id_distrito: '00000000-0000-0000-0000-000000030101' },
  ];

  await prisma.comunidades.createMany({
    data: comunidades.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      distrito_id: c.id_distrito,
    })),
    skipDuplicates: true,
  });
  await Promise.all(comunidades.map((c) => prisma.comunidades.update({
    where: { id: c.id },
    data: { nombre: c.nombre, distrito_id: c.id_distrito },
  })));

  // 5. Centros de Salud (Establecimientos de salud)
  const centros = [
    { codigo_renipress: '1001', nombre: 'Hospital Regional Guillermo Díaz de la Vega', tipo: 'HOSPITAL' as const, categoria: 'II-2', direccion: 'Av. Daniel Alcides Carrión S/N', id_comunidad: '00000000-0000-0000-0000-000030101001' },
    { codigo_renipress: '1002', nombre: 'Centro de Salud Las Arenas', tipo: 'CENTRO_SALUD' as const, categoria: 'I-3', direccion: 'Jr. Lima', id_comunidad: '00000000-0000-0000-0000-000030101002' },
    { codigo_renipress: '1003', nombre: 'Centro de Salud Tamburco', tipo: 'CENTRO_SALUD' as const, categoria: 'I-3', direccion: 'Jr. Mariano Melgar S/N', id_comunidad: '00000000-0000-0000-0000-000030109001' },
    { codigo_renipress: '1004', nombre: 'Hospital Sub Regional Andahuaylas', tipo: 'HOSPITAL' as const, categoria: 'II-1', direccion: 'Av. Hugo Pesce S/N', id_comunidad: '00000000-0000-0000-0000-000030201001' },
    { codigo_renipress: '1005', nombre: 'Centro de Salud San Jerónimo', tipo: 'CENTRO_SALUD' as const, categoria: 'I-4', direccion: 'Jr. Comercio', id_comunidad: '00000000-0000-0000-0000-000030213001' },
    { codigo_renipress: '1006', nombre: 'Puesto de Salud Talavera', tipo: 'PUESTO_SALUD' as const, categoria: 'I-3', direccion: 'Av. Ayacucho', id_comunidad: '00000000-0000-0000-0000-000030216001' },
  ];

  for (const c of centros) {
    const existing = await prisma.establecimientos_salud.findFirst({
      where: { codigo_renipress: c.codigo_renipress }
    });
    if (!existing) {
      await prisma.establecimientos_salud.create({
        data: {
          codigo_renipress: c.codigo_renipress,
          nombre: c.nombre,
          tipo: c.tipo,
          categoria: c.categoria,
          direccion: c.direccion,
          comunidades: { connect: { id: c.id_comunidad } }
        }
      });
    }
  }

  console.log('Seed de Apurímac completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
