import type { ChecklistItemDef, ChecklistSectionDef, ChecklistTemplate } from "./types";

// ---------------------------------------------------------------------------
// OPERACIONAL 5.000 KM (motorista) — mantém as três respostas OK / Atenção / NC
// ---------------------------------------------------------------------------

export const template5kOperacional: ChecklistTemplate = {
  id: "tpl-5k-op",
  nome: "Checklist Operacional 5.000 km",
  km: 5000,
  tipo: "operacional",
  mode: "operacional",
  subtitulo: "Inspeção do motorista",
  sections: [
    {
      id: "pneus",
      title: "Pneus e Rodagem",
      items: [
        {
          id: "pneu-pressao",
          label: "Pressão visual e aspecto geral dos pneus",
          criterio: "Sem pneu murcho, deformado ou aquecendo anormalmente.",
          critico: true,
        },
        {
          id: "pneu-sulco",
          label: "Sulcos e desgaste",
          criterio: "Sem desgaste irregular, lona aparente ou sulco crítico.",
          critico: true,
        },
        {
          id: "pneu-cortes",
          label: "Cortes, bolhas e objetos presos",
          criterio: "Sem cortes profundos, bolhas, arames ou objetos perfurantes.",
          critico: true,
        },
        {
          id: "pneu-rodas",
          label: "Rodas e porcas",
          criterio: "Sem porcas aparentando folga, trincas ou marcas de deslocamento.",
        },
      ],
    },
    {
      id: "iluminacao",
      title: "Iluminação e Sinalização",
      items: [
        {
          id: "ilum-farois",
          label: "Faróis, lanternas e luzes de freio",
          criterio: "Todas acendem e não há lentes quebradas.",
        },
        {
          id: "ilum-setas",
          label: "Setas, luz de ré e luz de placa",
          criterio: "Funcionamento normal dos dois lados.",
        },
        {
          id: "ilum-buzina",
          label: "Buzina e alarme de ré",
          criterio: "Som audível e funcionamento regular.",
        },
      ],
    },
    {
      id: "vazamentos",
      title: "Vazamentos e Sistemas",
      items: [
        {
          id: "vaz-visiveis",
          label: "Vazamentos visíveis",
          criterio: "Sem óleo, diesel, água, fluido ou ar vazando sob o veículo.",
          critico: true,
        },
        {
          id: "vaz-mangueiras",
          label: "Mangueiras, chicotes e conexões visíveis",
          criterio: "Sem partes soltas, rompidas, queimadas ou raspando.",
        },
        {
          id: "vaz-prefiltro",
          label: "Pré-filtro / separador de água do diesel",
          criterio: "Drenado quando necessário e sem excesso de água ou impureza.",
        },
        {
          id: "vaz-reservatorio",
          label: "Reservatórios de ar",
          criterio: "Drenados e sem excesso de água ou óleo.",
        },
      ],
    },
    {
      id: "seguranca",
      title: "Segurança e Visibilidade",
      items: [
        {
          id: "seg-cinto",
          label: "Cinto de segurança",
          criterio: "Trava, recolhe e não apresenta cortes.",
          critico: true,
        },
        {
          id: "seg-extintor",
          label: "Extintor, triângulo e itens obrigatórios",
          criterio: "Presentes, acessíveis e dentro da validade quando aplicável.",
          critico: true,
        },
        {
          id: "seg-espelhos",
          label: "Espelhos, câmera e para-brisa",
          criterio: "Boa visibilidade e sem quebra que comprometa a condução.",
        },
        {
          id: "seg-limpadores",
          label: "Limpadores e esguicho",
          criterio: "Funcionam e limpam adequadamente.",
        },
      ],
    },
    {
      id: "painel",
      title: "Painel e Funcionamento",
      items: [
        {
          id: "pai-luzes",
          label: "Luzes e alertas do painel",
          criterio: "Sem alerta crítico aceso após a partida.",
          critico: true,
        },
        {
          id: "pai-freios",
          label: "Freios e direção durante manobra",
          criterio: "Sem ruído, puxada, folga ou resposta anormal.",
          critico: true,
        },
        {
          id: "pai-ruidos",
          label: "Ruídos, vibrações ou cheiro anormal",
          criterio: "Nenhuma alteração percebida em relação ao uso normal.",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// PREVENTIVO — modo OK / TROCAR (mecânico). Estrutura cumulativa 5→100k.
// ---------------------------------------------------------------------------

const item = (id: string, label: string, critico = false): ChecklistItemDef => ({
  id,
  label,
  critico,
});

const sec = (id: string, title: string, items: ChecklistItemDef[]): ChecklistSectionDef => ({
  id,
  title,
  items,
});

/** 5.000 km — segurança, pneus e anomalias visíveis. */
const preventivo5kSections: ChecklistSectionDef[] = [
  sec("p-pneus", "Pneus", [
    item("p5-pneu-calib", "Calibragem por eixo e aplicação", true),
    item("p5-pneu-sulco", "Sulco, cortes, bolhas e desgaste irregular", true),
  ]),
  sec("p-eletrica", "Elétrica", [
    item("p5-eletrica-luzes", "Luzes, setas, freio, reversa, chicote aparente"),
  ]),
  sec("p-rodas", "Rodas", [item("p5-rodas-porcas", "Porcas, rodas e sinais de folga", true)]),
  sec("p-combustivel", "Combustível", [item("p5-comb-agua", "Separador de água do diesel")]),
  sec("p-painel", "Painel", [item("p5-painel-alertas", "Alertas ativos e temperatura", true)]),
  sec("p-freios", "Freios", [item("p5-freios-dreno", "Dreno de reservatórios pneumáticos", true)]),
  sec("p-motor", "Motor", [
    item("p5-motor-vaz", "Vazamentos aparentes de óleo, diesel, arrefecimento e direção", true),
  ]),
  sec("p-seguranca", "Segurança", [
    item("p5-seg-extintor", "Extintor, triângulo, limpadores, espelhos e buzina", true),
  ]),
];

/** 10.000 km — adiciona freios, direção, suspensão e lubrificação. */
const preventivo10kExtras: ChecklistSectionDef[] = [
  sec("p10-freios", "Freios (10k)", [
    item("p10-freios-lonas", "Lonas / pastilhas e assentamento", true),
    item("p10-freios-vazamentos", "Vazamentos, válvulas, linhas e perda de pressão", true),
  ]),
  sec("p10-bateria", "Bateria", [item("p10-bat-terminais", "Terminais, fixação e tensão")]),
  sec("p10-direcao", "Direção", [
    item("p10-dir-folgas", "Folgas, terminais, barras, caixa e foles", true),
  ]),
  sec("p10-chassi", "Chassi", [
    item("p10-chassi-lub", "Lubrificação de chassi, cruzetas e pontos graxeiros"),
  ]),
  sec("p10-reapertos", "Reapertos", [
    item(
      "p10-reapertos-fix",
      "Fixações críticas de carroceria, tanque, suportes e para-lamas",
      true,
    ),
  ]),
  sec("p10-suspensao", "Suspensão", [
    item("p10-susp-molas", "Molas, bolsas, buchas, amortecedores e suportes"),
  ]),
  sec("p10-alinhamento", "Alinhamento", [
    item("p10-alin-visual", "Desgaste de pneus e alinhamento visual"),
  ]),
];

/** 20.000 km — sistemas funcionais e diagnóstico. */
const preventivo20kExtras: ChecklistSectionDef[] = [
  sec("p20-motor-ar", "Motor (20k)", [item("p20-motor-filtro-ar", "Filtro de ar do motor")]),
  sec("p20-injecao", "Injeção", [item("p20-injecao-retorno", "Retorno de diesel e estanqueidade")]),
  sec("p20-freios-discos", "Freios (Discos)", [
    item("p20-freios-discos", "Discos / tambores, empeno, trinca e ovalização", true),
  ]),
  sec("p20-transmissao", "Transmissão", [
    item("p20-trans-carda", "Cardã, cruzetas e luva deslizante"),
  ]),
  sec("p20-ac", "A/C", [item("p20-ac-filtro", "Filtro de cabine, fluxo de ar e funcionamento")]),
  sec("p20-arref", "Arrefecimento", [
    item("p20-arref-radiador", "Radiador, mangueiras, abraçadeiras, tampa e nível"),
  ]),
  sec("p20-embreagem", "Embreagem", [
    item("p20-embr-curso", "Curso, ponto de engate, atuador e vazamentos"),
  ]),
  sec("p20-alin-inst", "Alinhamento (Instrumental)", [
    item("p20-alin-inst", "Alinhamento instrumental quando houver desgaste irregular"),
  ]),
];

/** 50.000 km — revisão maior. */
const preventivo50kExtras: ChecklistSectionDef[] = [
  sec("p50-motor-oleo", "Motor (Óleo)", [item("p50-motor-oleo", "Óleo do motor e filtro de óleo")]),
  sec("p50-eletrica", "Elétrica (ampliada)", [
    item("p50-eletrica-ampl", "Revisão elétrica ampliada"),
  ]),
  sec("p50-historico", "Histórico", [
    item("p50-hist-falhas", "Revisão de falhas recorrentes por placa"),
  ]),
  sec("p50-comb-filtros", "Combustível (Filtros)", [
    item("p50-comb-filtros", "Filtros de combustível"),
  ]),
  sec("p50-estrutura", "Estrutura", [item("p50-estr-chassi", "Inspeção de chassi e carroceria")]),
  sec("p50-freios-secador", "Freios (Secador)", [
    item("p50-freios-secador", "Cartucho do secador de ar"),
  ]),
  sec("p50-direcao-fluido", "Direção (Fluido)", [
    item("p50-dir-fluido", "Fluido / sistema de direção e vazamentos"),
  ]),
];

/** 100.000 km — revisão profunda. */
const preventivo100kExtras: ChecklistSectionDef[] = [
  sec("p100-cubos", "Cubos", [item("p100-cubos", "Cubos, rolamentos e retentores", true)]),
  sec("p100-arref-fluido", "Arrefecimento (Fluido)", [
    item("p100-arref-fluido", "Fluido de arrefecimento"),
  ]),
  sec("p100-trans-oleo", "Transmissão (Óleo)", [item("p100-trans-oleo", "Óleo da caixa")]),
  sec("p100-diferencial", "Diferencial", [item("p100-dif-oleo", "Óleo do diferencial")]),
  sec("p100-motor-valvulas", "Motor (Válvulas)", [
    item("p100-motor-valvulas", "Ajuste de válvulas"),
  ]),
  sec("p100-embr-conjunto", "Embreagem (Conjunto)", [
    item("p100-embr-conjunto", "Conjunto, rolamento, volante e atuação"),
  ]),
  sec("p100-gestao", "Gestão", [item("p100-gestao-hist", "Auditoria de histórico e custo por km")]),
];

function makePreventivo(
  id: string,
  km: number,
  nome: string,
  subtitulo: string,
  inheritsFrom: string[],
  ownSections: ChecklistSectionDef[],
): ChecklistTemplate {
  return {
    id,
    nome,
    km,
    tipo: "preventivo",
    mode: "preventivo",
    subtitulo,
    inheritsFrom,
    sections: ownSections,
  };
}

export const template5kPreventivo = makePreventivo(
  "tpl-5k-prev",
  5000,
  "Checklist Preventivo 5.000 km",
  "Segurança, pneus e anomalias visíveis",
  [],
  preventivo5kSections,
);

export const template10k = makePreventivo(
  "tpl-10k",
  10000,
  "Checklist Preventivo 10.000 km",
  "Freios, direção, suspensão e lubrificação",
  ["tpl-5k-prev"],
  preventivo10kExtras,
);

export const template20k = makePreventivo(
  "tpl-20k",
  20000,
  "Checklist Preventivo 20.000 km",
  "Sistemas funcionais e diagnóstico",
  ["tpl-5k-prev", "tpl-10k"],
  preventivo20kExtras,
);

export const template50k = makePreventivo(
  "tpl-50k",
  50000,
  "Checklist Preventivo 50.000 km",
  "Revisão maior",
  ["tpl-5k-prev", "tpl-10k", "tpl-20k"],
  preventivo50kExtras,
);

export const template100k = makePreventivo(
  "tpl-100k",
  100000,
  "Checklist Preventivo 100.000 km",
  "Revisão profunda",
  ["tpl-5k-prev", "tpl-10k", "tpl-20k", "tpl-50k"],
  preventivo100kExtras,
);

/** Todos os templates cadastrados (operacional + preventivos). */
export const templates: ChecklistTemplate[] = [
  template5kOperacional,
  template5kPreventivo,
  template10k,
  template20k,
  template50k,
  template100k,
];

/** Apenas preventivos, do menor para o maior. */
export const preventivoTemplates: ChecklistTemplate[] = [
  template5kPreventivo,
  template10k,
  template20k,
  template50k,
  template100k,
];

function findRawTemplate(id: string): ChecklistTemplate | undefined {
  return templates.find((t) => t.id === id);
}

/**
 * Retorna o template com todas as seções herdadas dos níveis inferiores já
 * compostas (para preventivos). Operacional é retornado como está.
 */
export function getTemplate(id: string): ChecklistTemplate | undefined {
  const base = findRawTemplate(id);
  if (!base) return undefined;
  if (base.mode === "operacional") return base;

  const chain: ChecklistTemplate[] = [];
  for (const parentId of base.inheritsFrom ?? []) {
    const parent = findRawTemplate(parentId);
    if (parent) chain.push(parent);
  }
  chain.push(base);

  const seenItemIds = new Set<string>();
  const composedSections: ChecklistSectionDef[] = [];
  for (const tpl of chain) {
    for (const section of tpl.sections) {
      const items = section.items.filter((i) => {
        if (seenItemIds.has(i.id)) return false;
        seenItemIds.add(i.id);
        return true;
      });
      if (items.length === 0) continue;
      composedSections.push({ ...section, items });
    }
  }

  return { ...base, sections: composedSections };
}

// ---------------------------------------------------------------------------
// COMPLEMENTAR — itens específicos por placa, executados junto ao preventivo.
// ---------------------------------------------------------------------------

interface ComplementarItem extends ChecklistItemDef {
  /** Periodicidade em km (5.000 / 10.000 / 20.000). */
  periodicidade: number;
}

const complementarByPlaca: Record<string, ComplementarItem[]> = {
  BYA2H92: [
    {
      id: "c-bya-mang",
      label: "Mangueiras, borrachas e abraçadeiras ressecadas",
      periodicidade: 10000,
    },
    {
      id: "c-bya-chicotes",
      label: "Chicotes, aterramentos e conexões antigas",
      periodicidade: 10000,
    },
    {
      id: "c-bya-freio-dir",
      label: "Freio e direção com margem conservadora",
      periodicidade: 10000,
      critico: true,
    },
  ],
  AWJ4B28: [
    { id: "c-awj-geom", label: "Geometria, alinhamento e desgaste de pneus", periodicidade: 10000 },
    {
      id: "c-awj-trincas",
      label: "Trincas, soldas, longarinas e pontos de fixação",
      periodicidade: 20000,
      critico: true,
    },
    {
      id: "c-awj-fixacoes",
      label: "Fixações de carroceria e cabine estendida",
      periodicidade: 10000,
    },
  ],
  ATN9E66: [
    {
      id: "c-atn66-eixo",
      label: "Eixo direcional: folgas, buchas, terminais e convergência",
      periodicidade: 10000,
      critico: true,
    },
    {
      id: "c-atn66-chassi",
      label: "Chassi alongado: suportes, trincas, soldas e fixações",
      periodicidade: 10000,
      critico: true,
    },
    {
      id: "c-atn66-tanque",
      label: "Tanque suplementar: suportes, cintas, vazamento e distribuição de carga",
      periodicidade: 10000,
    },
    {
      id: "c-atn66-radiador",
      label: "Radiador, intercooler, linhas de combustível e sensores de pressão",
      periodicidade: 20000,
    },
  ],
  ATN9118: [
    {
      id: "c-atn18-hist",
      label:
        "Usar histórico para repetir atenção em injeção, radiador/intercooler, caixa, embreagem e A/C",
      periodicidade: 20000,
    },
  ],
  HHK5I52: [
    {
      id: "c-hhk-buchas",
      label: "Buchas, molas, amortecedores, foles e vazamentos",
      periodicidade: 10000,
    },
  ],
};

/**
 * Retorna a seção complementar aplicável a um veículo (por placa) para o
 * template preventivo de nível `km`. Só inclui itens cuja periodicidade é
 * múltiplo do intervalo do template atual.
 */
export function getComplementarySection(
  placa: string | undefined,
  templateKm: number,
): ChecklistSectionDef | null {
  if (!placa) return null;
  const list = complementarByPlaca[placa.toUpperCase().replace(/-/g, "")];
  if (!list || list.length === 0) return null;
  const items = list.filter(
    (c) => templateKm >= c.periodicidade && templateKm % c.periodicidade === 0,
  );
  if (items.length === 0) return null;
  return {
    id: `complementar-${placa}`,
    title: `Complementar · ${placa}`,
    items: items.map(({ periodicidade, ...rest }) => ({
      ...rest,
      criterio: `Item específico deste veículo · aplicar a cada ${periodicidade.toLocaleString("pt-BR")} km`,
    })),
  };
}

/**
 * Seções efetivas de uma execução: base herdada + seção complementar por placa
 * (quando o template é preventivo e há itens aplicáveis).
 */
export function getExecutionSections(templateId: string, placa?: string): ChecklistSectionDef[] {
  const tpl = getTemplate(templateId);
  if (!tpl) return [];
  if (tpl.mode !== "preventivo") return tpl.sections;
  const compl = getComplementarySection(placa, tpl.km);
  return compl ? [...tpl.sections, compl] : tpl.sections;
}

/** Nomes curtos por nível, usados em resumos e chips. */
export function templateShortLabel(id: string): string {
  const t = findRawTemplate(id);
  if (!t) return id;
  const kmLabel = t.km >= 1000 ? `${t.km / 1000}.000 km` : `${t.km} km`;
  return t.mode === "operacional" ? `${kmLabel} (Operacional)` : kmLabel;
}

/** Lista de níveis (do menor para o maior) incluídos por um template. */
export function includedLevels(id: string): ChecklistTemplate[] {
  const t = findRawTemplate(id);
  if (!t) return [];
  const parents = (t.inheritsFrom ?? [])
    .map(findRawTemplate)
    .filter((x): x is ChecklistTemplate => Boolean(x));
  return [...parents, t];
}

/**
 * Recomenda um template preventivo com base na próxima revisão prevista.
 * Regra: maior múltiplo do intervalo que divide a próxima revisão.
 * Ex.: 190.000 → 10k · 200.000 → 20k · 250.000 → 50k · 300.000 → 100k.
 */
export function recommendPreventivo(proximaRevisaoKm: number): ChecklistTemplate {
  const ordered = [template100k, template50k, template20k, template10k];
  for (const tpl of ordered) {
    if (proximaRevisaoKm > 0 && proximaRevisaoKm % tpl.km === 0) return tpl;
  }
  return template5kPreventivo;
}

/**
 * Recomenda o template inicial de acordo com o perfil:
 * motorista → operacional 5k; mecânico/gestor → preventivo por próxima revisão.
 */
export function recommendTemplateForRole(
  role: "motorista" | "mecanico" | "gestor",
  proximaRevisaoKm: number,
): ChecklistTemplate {
  if (role === "motorista") return template5kOperacional;
  return recommendPreventivo(proximaRevisaoKm);
}
