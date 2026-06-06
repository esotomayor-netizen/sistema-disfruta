export type Caracter = 'FIJA' | 'VARIABLE'

export interface ProductoPrograma {
  caracter: Caracter
  tratamiento: string
  producto: string
  ingredienteActivo: string
  concentracion: string
  mojamiento: string
  dosisHa: string
  alternativas?: string
  observaciones?: string
}

export interface Etapa {
  id: string
  etapa: string
  fecha: string
  productos: ProductoPrograma[]
}

export const ETAPAS: Etapa[] = [
  {
    id: 'caida-inicio',
    etapa: 'Inicio caída de hojas',
    fecha: 'Mayo',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Cáncer Bacterial (preventivo)', producto: 'Oxicup 50 WG', ingredienteActivo: 'Oxicloruro de Cobre', concentracion: '500 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '7,5 kg', observaciones: 'Repetir aplicaciones o adelantarlas cuando existan eventos de lluvias ≥ 40 mm y con heladas mayores a -3 °C. Agregar Mancozeb o alternativa para control de hongos de la madera (cytospora u otro) cuando exista el caso.' },
    ],
  },
  {
    id: 'caida-20-30',
    etapa: '20-30% caída de hojas',
    fecha: 'Mayo',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Cáncer Bacterial (preventivo)', producto: 'Oxicup 50 WG', ingredienteActivo: 'Oxicloruro de Cobre', concentracion: '500 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '7,5 kg' },
    ],
  },
  {
    id: 'caida-50-70',
    etapa: '50-70% caída de hojas',
    fecha: 'Junio',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Cáncer Bacterial (preventivo)', producto: 'Cupro bordolés 25 WP', ingredienteActivo: 'Caldo Bordelés 85,5%', concentracion: '750 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '11,25 kg' },
    ],
  },
  {
    id: 'caida-100',
    etapa: '100% caída de hojas',
    fecha: 'Julio',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Cáncer Bacterial (preventivo)', producto: 'Oxicup 50 WG', ingredienteActivo: 'Oxicloruro de Cobre', concentracion: '500 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '7,5 kg' },
    ],
  },
  {
    id: 'receso-invernal',
    etapa: 'Receso invernal',
    fecha: 'Julio – Agosto',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Cáncer Bacterial (preventivo)', producto: 'Oxicup 50 WG', ingredienteActivo: 'Oxicloruro de Cobre', concentracion: '500 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '7,5 kg', observaciones: 'DETENER aplicaciones con estado fenológico de yema hinchada.' },
      { caracter: 'FIJA', tratamiento: 'Herbicidas residuales y control de malezas', producto: 'Alion 500 SC', ingredienteActivo: 'Indaziflam', concentracion: '—', mojamiento: '200 l/ha', dosisHa: '0,2 l', observaciones: 'Aplicar Alion 500 SC + Roundup después de lluvia > 10 mm y justo antes de la siguiente. Si no hay lluvias aplicar Roundup para desmanchar.' },
      { caracter: 'FIJA', tratamiento: 'Herbicidas residuales y control de malezas', producto: 'Roundup Controlmax', ingredienteActivo: 'Glifosato', concentracion: '—', mojamiento: '200 l/ha', dosisHa: '3 kg' },
      { caracter: 'FIJA', tratamiento: 'Adelantar y uniformar cosecha', producto: 'Dormex', ingredienteActivo: 'Cianamida Hidrogenada', concentracion: 'Dosis por variedad', mojamiento: '1000 l/ha', dosisHa: 'Según variedad', alternativas: 'Cianamida 500 SL, Cyanamida 50%', observaciones: 'DOSIS DE DORMEX ES POR VARIEDAD. APLICAR ERGER y NITRATO DE CALCIO 5 DÍAS DESPUÉS DEL DORMEX. Aplicar con temperaturas mayores a 7°C.' },
      { caracter: 'FIJA', tratamiento: 'Adelantar y uniformar cosecha', producto: 'Erger + Nitrato de Calcio', ingredienteActivo: 'Nitrógeno / Nitrato de calcio', concentracion: '5% / 6%', mojamiento: '1000 l/ha', dosisHa: '50 l / 60 kg' },
      { caracter: 'FIJA', tratamiento: 'Control escama San José', producto: 'Admiral 10 EC', ingredienteActivo: 'Piriproxifeno', concentracion: '60 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '1,2 l', alternativas: 'Piriproxifen 100 EC, Galactic, Polisul 35', observaciones: 'Aplicar en función del movimiento de la escama según zona. En caso de alta presión aplicar 70 cc/100 l y subir mojamiento a 2000 l/ha.' },
    ],
  },
  {
    id: 'yema-hinchada',
    etapa: 'Yema hinchada',
    fecha: 'Fines Julio – 1ª quincena Agosto',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Control cáncer bacterial', producto: 'Oxicup 50 WG', ingredienteActivo: 'Oxicloruro de Cobre', concentracion: '500 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '7,5 kg', alternativas: 'Amilo-x WG, Nacillus, Comet, Consul 65 WP, Nordox', observaciones: 'El último cobre de este tipo debe ser en yema hinchada. Si hubo presencia de hongos de la madera, agregar Benomylo.' },
      { caracter: 'VARIABLE', tratamiento: 'Control hongos de la madera', producto: 'Manzate 200', ingredienteActivo: 'Mancozeb', concentracion: '240 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '3,6 kg', alternativas: 'Mancozeb 80% WP', observaciones: 'Es incompatible con productos alcalinos.' },
    ],
  },
  {
    id: 'yema-ramillete',
    etapa: 'Yema hinchada a ramillete',
    fecha: '1ª semana Septiembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Control huevos de arañita', producto: 'Citroliv', ingredienteActivo: 'Aceite Emulsible', concentracion: '2 l/100 l', mojamiento: '1500 l/ha', dosisHa: '30 l', alternativas: 'Winspray, Elf pure spray 15E', observaciones: 'Citroliv aplicar como máximo hasta ramillete (BBCH 55).' },
      { caracter: 'FIJA', tratamiento: 'Control huevos de arañita', producto: 'Acramite 480 SC', ingredienteActivo: 'Bifenazato', concentracion: '50 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,75 l', observaciones: 'No aplicar en plena floración, solo una aplicación al año.' },
    ],
  },
  {
    id: 'ramillete-boton',
    etapa: 'Ramillete a botón blanco',
    fecha: 'Agosto – Septiembre',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Control preventivo cáncer bacterial', producto: 'Agrocopper SP', ingredienteActivo: 'Sulfato de Cobre Pentahidratado', concentracion: '80 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '1,2 kg', alternativas: 'Amilo-x WG, Cuproforte, Nacillus', observaciones: 'Aplicar solo en huertos con alta presión o condiciones favorables.' },
    ],
  },
  {
    id: 'flor-10-30',
    etapa: '10% a 30% flor',
    fecha: 'Septiembre',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Control preventivo Botrytis', producto: 'Atlas 43 SC', ingredienteActivo: 'Tebuconazole', concentracion: '40 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,6 l', alternativas: 'Amilo-x WG, Tebuconazol 430 SC, Vertice 43 SC, T-buzol 430 SC', observaciones: 'Aplicar con condiciones favorables.' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Boro', producto: 'Nutriboro', ingredienteActivo: 'Boro', concentracion: '67 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '1 l', alternativas: 'Basfoliar Boro SL, Bioelicitor Boro' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Calcio', producto: 'Nutri Ca', ingredienteActivo: 'Calcio', concentracion: '133 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '2 l', alternativas: 'Basfoliar Ca SL, Bioelicitor Calcio' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Zinc', producto: 'Nutri Zn', ingredienteActivo: 'Zinc', concentracion: '33 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,5 l', alternativas: 'Basfoliar Zn Flo, Bioelicitor Zinc' },
      { caracter: 'FIJA', tratamiento: 'Mejorar cuaja', producto: 'Kelpak', ingredienteActivo: 'Ecklonia Máxima', concentracion: '300 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '4,5 l', alternativas: 'Ecklomar', observaciones: 'Estimula mejor desarrollo, mejora cuaja, resistencia a estrés.' },
    ],
  },
  {
    id: 'flor-30-70',
    etapa: '30% a 70% flor',
    fecha: 'Septiembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Fertilización con Calcio', producto: 'Nutri Ca', ingredienteActivo: 'Calcio', concentracion: '133 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '2 l', alternativas: 'Basfoliar Ca SL, Bioelicitor Calcio' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Zinc', producto: 'Nutri Zn', ingredienteActivo: 'Zinc', concentracion: '33 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,5 l', alternativas: 'Basfoliar Zn Flo, Bioelicitor Zinc' },
    ],
  },
  {
    id: 'plena-flor',
    etapa: 'Plena flor',
    fecha: 'Septiembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Aumento calibre', producto: 'Biozyme', ingredienteActivo: 'Extractos vegetales y fitohormonas', concentracion: '—', mojamiento: '1500 l/ha', dosisHa: '1-2 l/ha', observaciones: 'Dosis de acuerdo a potencial productivo del huerto.' },
      { caracter: 'FIJA', tratamiento: 'Mejorar cuaja', producto: 'Kelpak', ingredienteActivo: 'Ecklonia Máxima', concentracion: '300 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '4,5 l', alternativas: 'Ecklomar' },
    ],
  },
  {
    id: 'flor-70-100',
    etapa: '70% a 100% flor',
    fecha: 'Septiembre',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Control Botrytis / Monilinia', producto: 'Amistar Top', ingredienteActivo: 'Azoxystrobin + Difenoconazole', concentracion: '40 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,6 l', observaciones: 'Aplicar con condiciones favorables.' },
      { caracter: 'VARIABLE', tratamiento: 'Control curativo cáncer bacterial', producto: 'Agrygent Plus', ingredienteActivo: 'Sulfato de Gentamicida + Clorhidrato de Oxitetraciclina', concentracion: '80 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '1,2 kg', alternativas: 'Nacillus, Amylo-x, Pilot', observaciones: 'Aplicar solo en caso de ser necesario.' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Boro', producto: 'Nutriboro', ingredienteActivo: 'Boro', concentracion: '67 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '1 l', alternativas: 'Basfoliar Boro SL, Bioelicitor Boro' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Zinc', producto: 'Nutri Zn', ingredienteActivo: 'Zinc', concentracion: '33 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,5 l', alternativas: 'Basfoliar Zn Flo, Bioelicitor Zinc' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Calcio', producto: 'Nutri Ca', ingredienteActivo: 'Calcio', concentracion: '133 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '2 l', alternativas: 'Basfoliar Ca SL, Bioelicitor Calcio' },
      { caracter: 'VARIABLE', tratamiento: 'Control de Trips de California', producto: 'Success 48', ingredienteActivo: 'Spinosad', concentracion: '12 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,180 l', alternativas: 'Entrust, Stong 480 SC, Element', observaciones: 'Aplicar con presencia de trips (previo monitoreo).' },
      { caracter: 'FIJA', tratamiento: 'Mejorar cuaja', producto: 'Kelpak', ingredienteActivo: 'Ecklonia Máxima', concentracion: '300 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '4,5 l', alternativas: 'Ecklomar' },
    ],
  },
  {
    id: 'post-plena-flor-7',
    etapa: '7 días después de plena flor',
    fecha: 'Septiembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Aumentar firmeza', producto: 'Cloruro de Calcio', ingredienteActivo: 'Cloruro de Calcio', concentracion: '600 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '9 kg', observaciones: 'Aplicar solo.' },
    ],
  },
  {
    id: 'post-plena-flor-7-14',
    etapa: '7 y 14 días después de plena flor',
    fecha: 'Septiembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Aumento calibre', producto: 'Dropper', ingredienteActivo: 'Tidiazurón', concentracion: '10-20 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,225 l', observaciones: 'Aumentar y uniformar calibre. Dos aplicaciones cada 7 días, última aplicación usar la menor concentración.' },
    ],
  },
  {
    id: 'caida-chaquetas',
    etapa: 'Caída de chaquetas',
    fecha: 'Septiembre',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Control Botrytis', producto: 'Bellis', ingredienteActivo: 'Boscalid + Piraclostrobin', concentracion: '66 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '1 kg', alternativas: 'Veldep', observaciones: 'Aplicar con condiciones favorables para desarrollo de alternaria.' },
    ],
  },
  {
    id: 'fruto-cuajado',
    etapa: 'Fruto recién cuajado',
    fecha: 'Septiembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Control de polillas', producto: 'Intrepid SC', ingredienteActivo: 'Metoxifenocide', concentracion: '20 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,3 l', alternativas: 'Metoxifenozid 240 SC', observaciones: 'En zona con presión de Escama Coma, intercambiar esta aplicación por Acetamiprid.' },
      { caracter: 'FIJA', tratamiento: 'Aumentar calibre', producto: 'Biozyme', ingredienteActivo: 'Extractos vegetales y fitohormonas', concentracion: '—', mojamiento: '1500 l/ha', dosisHa: '1-2 l/ha', observaciones: 'Repetir 7 días después.' },
      { caracter: 'FIJA', tratamiento: 'Retención de frutos', producto: 'Stimplex', ingredienteActivo: 'Ascophillium Nodosum', concentracion: '200 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '3 l', alternativas: 'SM6' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Zinc', producto: 'Nutri Zn', ingredienteActivo: 'Zinc', concentracion: '33 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,5 l', alternativas: 'Basfoliar Zn Flo, Bioelicitor Zinc' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Nitrógeno', producto: 'Basfoliar 36 Extra SL', ingredienteActivo: 'Nitrógeno, Magnesio, Boro, Zinc', concentracion: '250 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '3,75 l' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Magnesio', producto: 'Nutri Mg', ingredienteActivo: 'Magnesio', concentracion: '133 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '2 l', alternativas: 'Basfoliar Mg Flo, Bioelicitor Mg' },
    ],
  },
  {
    id: 'cacl2-segunda',
    etapa: '7 días después (2° CaCl₂)',
    fecha: 'Septiembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Aumentar firmeza', producto: 'Cloruro de Calcio', ingredienteActivo: 'Cloruro de Calcio', concentracion: '600 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '9 kg', observaciones: 'Aplicar solo.' },
    ],
  },
  {
    id: 'flush-radical',
    etapa: 'Primer flush de crecimiento radical',
    fecha: 'Octubre',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Enraizantes', producto: 'Pilatus', ingredienteActivo: 'Extractos de origen vegetal', concentracion: '—', mojamiento: '— (riego)', dosisHa: '3 l', observaciones: 'Aplicar vía riego en la etapa final.' },
    ],
  },
  {
    id: 'materia-organica',
    etapa: 'Aporte de materia orgánica y suelo vivo',
    fecha: 'Octubre',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Aumentar microorganismos benéficos', producto: 'Deltabiotic', ingredienteActivo: 'PGPR', concentracion: '—', mojamiento: '— (riego)', dosisHa: '1 l', observaciones: 'Aplicar en un solo riego.' },
      { caracter: 'VARIABLE', tratamiento: 'Aumentar carbono y materia orgánica', producto: 'Kamasol Humic', ingredienteActivo: 'Ácidos fúlvicos y húmicos', concentracion: '—', mojamiento: '— (riego)', dosisHa: '43 l', observaciones: 'Parcializar en 8 aplicaciones de 5 l/ha por riego.' },
    ],
  },
  {
    id: 'post-intrepid-14',
    etapa: '14 días después del Intrepid',
    fecha: 'Quincena de Octubre',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Control burrito', producto: 'Avaunt', ingredienteActivo: 'Indoxacarb', concentracion: '17 gr/100 l', mojamiento: '—', dosisHa: '0,255 kg', observaciones: 'Aplicar solo en caso de presencia o con historial de ataque de burritos.' },
      { caracter: 'FIJA', tratamiento: 'Control de polillas', producto: 'Acetamiprid 20% SP', ingredienteActivo: 'Acetamiprid', concentracion: '50 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '0,75 kg', alternativas: 'Mospilan, Quilate 225 SL, Hurricane 70 WG' },
      { caracter: 'VARIABLE', tratamiento: 'Aumentar calibre / firmeza', producto: 'Progibb 40 SG', ingredienteActivo: 'Ácido Giberélico', concentracion: 'Dosis según variedad', mojamiento: '1500 l/ha', dosisHa: '—', alternativas: 'Biofrut', observaciones: 'La dosis de Giberélico varía según variedad.' },
      { caracter: 'VARIABLE', tratamiento: 'Fertilización con Magnesio', producto: 'Nutri Mg', ingredienteActivo: 'Magnesio', concentracion: '133 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '2 l', alternativas: 'Basfoliar Mg Flo, Bioelicitor Mg' },
      { caracter: 'VARIABLE', tratamiento: 'Fertilización con Zinc', producto: 'Nutri Zn', ingredienteActivo: 'Zinc', concentracion: '33 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,5 l', alternativas: 'Basfoliar Zn Flo, Bioelicitor Zinc' },
      { caracter: 'VARIABLE', tratamiento: 'Apoyo foliar', producto: 'Stimplex', ingredienteActivo: 'Ascophillium Nodosum', concentracion: '200 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '3 l', alternativas: 'SM6' },
      { caracter: 'VARIABLE', tratamiento: 'Fertilización foliar', producto: 'Basfoliar 36 Extra SL', ingredienteActivo: 'Nitrógeno, Magnesio, Boro, Zinc', concentracion: '250 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '3,75 l' },
    ],
  },
  {
    id: 'post-anterior-7',
    etapa: '7 días después de aplicación anterior',
    fecha: 'Octubre',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Fertilización con Magnesio', producto: 'Nutri Mg', ingredienteActivo: 'Magnesio', concentracion: '133 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '2 l', alternativas: 'Basfoliar Mg Flo, Bioelicitor Mg' },
      { caracter: 'VARIABLE', tratamiento: 'Fertilización con Zinc', producto: 'Nutri Zn', ingredienteActivo: 'Zinc', concentracion: '33 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,5 l', alternativas: 'Basfoliar Zn Flo, Bioelicitor Zinc' },
      { caracter: 'VARIABLE', tratamiento: 'Apoyo foliar', producto: 'Stimplex', ingredienteActivo: 'Ascophillium Nodosum', concentracion: '200 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '3 l', alternativas: 'SM6' },
      { caracter: 'VARIABLE', tratamiento: 'Fertilización foliar', producto: 'Basfoliar 36 Extra SL', ingredienteActivo: 'Nitrógeno, Magnesio, Boro, Zinc', concentracion: '250 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '3,75 l' },
    ],
  },
  {
    id: 'fruto-pajizo',
    etapa: 'Frutos en color pajizo',
    fecha: 'Octubre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Aumentar calibre / firmeza', producto: 'Progibb 40 SG', ingredienteActivo: 'Ácido Giberélico', concentracion: 'Dosis según variedad', mojamiento: '1500 l/ha', dosisHa: '—', alternativas: 'Biofrut', observaciones: 'Las dosis del Giberélico varían según variedad.' },
      { caracter: 'VARIABLE', tratamiento: 'Control arañita roja Europea', producto: 'Envidor', ingredienteActivo: 'Espirodiclofen', concentracion: '60 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,9 l', alternativas: 'Springer, Konan 240 SC', observaciones: 'En cuarteles con presión de arañita roja europea APLICACIÓN OBLIGATORIA.' },
    ],
  },
  {
    id: 'post-acetamiprid-14',
    etapa: '14 días después del Acetamiprid 20%',
    fecha: 'Octubre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Control de polillas', producto: 'Zero 5 EC', ingredienteActivo: 'Lambda Cyhalotrina', concentracion: '15 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,225 l', alternativas: 'Karate Zeon, Knockout, Invicto 50 CS' },
      { caracter: 'FIJA', tratamiento: 'Aumentar color', producto: 'Phostin Ca', ingredienteActivo: 'Fósforo 31% + Calcio 5,6% + Nitrógeno 3,9%', concentracion: '666 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '10 l' },
      { caracter: 'FIJA', tratamiento: 'Aumentar color', producto: 'Nutri K', ingredienteActivo: 'Potasio', concentracion: '300 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '4,5 l' },
    ],
  },
  {
    id: 'pinta',
    etapa: 'Pinta (6 días después del Zero 5 EC)',
    fecha: 'Noviembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Control de Trips', producto: 'Turbine', ingredienteActivo: 'Flonicamida', concentracion: '20 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,3 l' },
      { caracter: 'FIJA', tratamiento: 'Aumentar color', producto: 'Phostin Ca', ingredienteActivo: 'Fósforo 31% + Calcio 5,6% + Nitrógeno 3,9%', concentracion: '666 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '10 l' },
      { caracter: 'FIJA', tratamiento: 'Aumentar color', producto: 'Nutri K', ingredienteActivo: 'Potasio', concentracion: '300 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '4,5 l' },
    ],
  },
  {
    id: 'post-turbine',
    etapa: '6 días después del Turbine',
    fecha: 'Noviembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Control D. suzukii', producto: 'Zero 5 EC', ingredienteActivo: 'Lambda Cyhalotrina', concentracion: '20 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,3 l', alternativas: 'Karate Zeon, Knockout, Invicto 50 CS' },
    ],
  },
  {
    id: 'pre-cosecha-10',
    etapa: '10 días antes de cosecha',
    fecha: 'Noviembre',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Control Botrytis / Monilia / Geotrichum', producto: 'Amistar Top', ingredienteActivo: 'Difenoconazole + Azoxistrobina', concentracion: '40 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,6 l', observaciones: 'Aplicar solo en caso de tener condiciones (lluvias y/o partiduras).' },
      { caracter: 'FIJA', tratamiento: 'Control D. suzukii', producto: 'Success 48', ingredienteActivo: 'Spinosad', concentracion: '15 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,225 l', alternativas: 'Entrust, Stong 480 SC, Element' },
      { caracter: 'FIJA', tratamiento: 'Fertilización con Potasio foliar', producto: 'Nutri K', ingredienteActivo: 'Potasio', concentracion: '300 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '4,5 l' },
    ],
  },
  {
    id: 'pre-cosecha-4',
    etapa: '4 días antes de cosecha',
    fecha: 'Noviembre',
    productos: [
      { caracter: 'FIJA', tratamiento: 'Control D. suzukii, Trips y polillas', producto: 'Acetamiprid 20% SP', ingredienteActivo: 'Acetamiprid', concentracion: '50 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '0,75 kg', alternativas: 'Mospilan, Quilate 225 SL, Hurricane 70 WG' },
      { caracter: 'VARIABLE', tratamiento: 'Control de Trips y Suzukii', producto: 'Success 48', ingredienteActivo: 'Spinosad', concentracion: '15 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,225 l', alternativas: 'Entrust, Stong 480 SC, Element' },
      { caracter: 'VARIABLE', tratamiento: 'Control de Botrytis', producto: 'Teldor 500 SC', ingredienteActivo: 'Fenexhamida', concentracion: '80 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '1,2 l', alternativas: 'Altivo 500 SC, Telexamid', observaciones: 'Aplicar con condiciones favorables.' },
    ],
  },
  {
    id: 'postcosecha',
    etapa: 'Postcosecha',
    fecha: 'Diciembre – Abril',
    productos: [
      { caracter: 'VARIABLE', tratamiento: 'Control arañita bimaculada', producto: 'Envidor', ingredienteActivo: 'Spirodiclofen', concentracion: '60 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,9 l', alternativas: 'Konan 240 SC, Springer, Spiridor', observaciones: 'Aplicar en caso de monitoreo positivo.' },
      { caracter: 'VARIABLE', tratamiento: 'Control arañita bimaculada', producto: 'Bifentrina 100 EC', ingredienteActivo: 'Bifentrina', concentracion: '60 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '0,9 l', alternativas: 'Tripp, Talstar 10 EC' },
      { caracter: 'VARIABLE', tratamiento: 'Apoyo foliar', producto: 'Stimplex', ingredienteActivo: 'Ascophillium Nodosum', concentracion: '200 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '3 l', alternativas: 'SM6', observaciones: 'Aplicar en caso de presentar debilidad en el huerto.' },
      { caracter: 'VARIABLE', tratamiento: 'Fertilización foliar', producto: 'Basfoliar 36 Extra SL', ingredienteActivo: 'Nitrógeno, Magnesio, Boro, Zinc', concentracion: '250 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '3,75 l' },
      { caracter: 'VARIABLE', tratamiento: 'Fertilización con Magnesio', producto: 'Nutri Mg', ingredienteActivo: 'Magnesio', concentracion: '133 cc/100 l', mojamiento: '1500 l/ha', dosisHa: '2 l' },
      { caracter: 'VARIABLE', tratamiento: 'Control burritos foliar', producto: 'Orthene 75 SP', ingredienteActivo: 'Acefato', concentracion: '100 gr/100 l', mojamiento: '1500 l/ha', dosisHa: '1,5 l', observaciones: 'En caso de presión de burritos aplicar cada 20 días hasta marzo-abril.' },
      { caracter: 'VARIABLE', tratamiento: 'Control burritos (riego)', producto: 'Diazol', ingredienteActivo: 'Diazinon', concentracion: '—', mojamiento: '— (riego)', dosisHa: '5 l', observaciones: 'Aplicar una sola vez en postcosecha. Inyectar completo en la primera porción del riego.' },
    ],
  },
]
