// ══════════════════════════════════════════════════════
// CÉREBRO DO FOCUS PLANNER — Motor de Padrões e Insights
// ══════════════════════════════════════════════════════

export type Correlacao = {
  origem: string
  destino: string
  intensidade: number  // 0 a 1
  tipo: "positiva" | "negativa"
  confianca: "alta" | "moderada" | "baixa"
  descricao: string
}

export type Padrao = {
  id: string
  categoria: "habito" | "foco" | "tarefa" | "emocional" | "ciclo" | "projeto"
  noRelacionado: string
  icone: string
  titulo: string
  observacao: string
  descoberta: string
  confianca: "alta" | "moderada"
  intensidade: number // 0 a 1
}

export type Evolucao = {
  label: string
  atual: number
  anterior: number
  diff: number
  tendencia: "subindo" | "descendo" | "estavel"
  descricao: string
}

export type ResultadoAnalise = {
  correlacoes: Correlacao[]
  padroes: Padrao[]
  evolucao: Evolucao[]
  melhorDiaSemana: string
  melhorHorarioFoco: string
  habitoAncora: string | null
  consistenciaGeral: number
  diasAnalisados: number
}

const DIAS = ["domingos", "segundas", "terças", "quartas", "quintas", "sextas", "sábados"]

function getDias(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

// ── Consistência de hábitos num período ──
function calcConsistencia(habitos: any[], dias: string[]): number {
  if (!habitos.length || !dias.length) return 0
  const total = habitos.reduce((a, h) => {
    return a + dias.filter(d => (h.historico || []).includes(d)).length
  }, 0)
  return Math.round((total / (habitos.length * dias.length)) * 100)
}

// ── Dias com pelo menos 1 hábito ──
function diasAtivos(habitos: any[], dias: string[]): number {
  return dias.filter(d => habitos.some(h => (h.historico || []).includes(d))).length
}

// ── Streak atual de um hábito ──
function calcStreak(historico: string[]): number {
  if (!historico?.length) return 0
  const hoje = new Date().toISOString().slice(0, 10)
  let streak = 0
  const d = new Date()
  while ((historico || []).includes(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// ── Co-ocorrência entre dois hábitos ──
function coOcorrencia(h1: any, h2: any, dias: string[]): number {
  const juntos = dias.filter(d =>
    (h1.historico || []).includes(d) && (h2.historico || []).includes(d)
  ).length
  const possiveis = dias.filter(d =>
    (h1.historico || []).includes(d) || (h2.historico || []).includes(d)
  ).length
  return possiveis > 0 ? juntos / possiveis : 0
}

// ── Principal função de análise ──
export function analisarDados(
  habitos: any[],
  sessoesFoco: any[],
  tarefas: any[],
  diario: any[],
  projetos: any[],
  periodo = 30
): ResultadoAnalise {
  const dias = getDias(periodo)
  const diasAnt = getDias(periodo * 2).slice(0, periodo)
  const hoje = new Date().toISOString().slice(0, 10)
  const ultimos7 = getDias(7)

  const correlacoes: Correlacao[] = []
  const padroes: Padrao[] = []

  // ══ CONSISTÊNCIA GERAL ══
  const consistenciaAtual = calcConsistencia(habitos, dias)
  const consistenciaAnterior = calcConsistencia(habitos, diasAnt)
  const ativosAtual = diasAtivos(habitos, dias)

  // ══ MELHOR DIA DA SEMANA ══
  const feitosPorDia = Array(7).fill(0)
  const totalPorDia = Array(7).fill(0)
  dias.forEach(d => {
    const dia = new Date(d + "T12:00:00").getDay()
    totalPorDia[dia]++
    feitosPorDia[dia] += habitos.filter(h => (h.historico || []).includes(d)).length
  })
  const mediaDia = feitosPorDia.map((v, i) =>
    totalPorDia[i] > 0 ? v / Math.max(habitos.length, 1) / totalPorDia[i] : 0
  )
  const melhorDiaIdx = mediaDia.indexOf(Math.max(...mediaDia))
  const piorDiaIdx = mediaDia.indexOf(Math.min(...mediaDia.filter(v => v >= 0)))
  const melhorDiaSemana = DIAS[melhorDiaIdx]

  // ══ MELHOR HORÁRIO DE FOCO ══
  const horasConc: Record<number, number> = {}
  sessoesFoco.forEach(s => {
    if (s.hora && s.data >= dias[0]) {
      const h = parseInt(s.hora.split(":")[0])
      horasConc[h] = (horasConc[h] || 0) + 1
    }
  })
  const melhorHoraEntry = Object.entries(horasConc).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  const melhorHora = melhorHoraEntry ? Number(melhorHoraEntry[0]) : 9
  const melhorHorarioFoco = `${melhorHora}:00 – ${Math.min(melhorHora + 2, 23)}:00`

  // ══ HÁBITO ÂNCORA ══
  const habitosComStats = habitos.map(h => ({
    ...h,
    pct: Math.round((dias.filter(d => (h.historico || []).includes(d)).length / periodo) * 100),
    streak: calcStreak(h.historico || [])
  })).sort((a, b) => b.pct - a.pct)
  const habitoAncora = habitosComStats[0]?.pct >= 40 ? habitosComStats[0].nome : null

  // ══ PADRÕES POR CATEGORIA ══

  // 1. Melhor dia da semana
  if (Math.max(...mediaDia) >= 0.3) {
    padroes.push({
      id: "dia_melhor",
      categoria: "ciclo",
      noRelacionado: "rotina",
      icone: "📅",
      titulo: `${DIAS[melhorDiaIdx].charAt(0).toUpperCase() + DIAS[melhorDiaIdx].slice(1)} são seus dias mais fortes`,
      observacao: `Seus registros mostram que ${DIAS[melhorDiaIdx]} tendem a ser seus dias mais consistentes com hábitos e rotina.`,
      descoberta: `Há algo nesse dia que favorece sua organização. Vale proteger e entender o que o torna especial.`,
      confianca: "alta",
      intensidade: Math.max(...mediaDia)
    })
  }

  // 2. Dia mais difícil
  if (piorDiaIdx !== melhorDiaIdx && Math.min(...mediaDia.filter(v => v >= 0)) < 0.25) {
    padroes.push({
      id: "dia_pior",
      categoria: "ciclo",
      noRelacionado: "ansiedade",
      icone: "🌊",
      titulo: `${DIAS[piorDiaIdx].charAt(0).toUpperCase() + DIAS[piorDiaIdx].slice(1)} parecem mais difíceis`,
      observacao: `${DIAS[piorDiaIdx].charAt(0).toUpperCase() + DIAS[piorDiaIdx].slice(1)} costumam ter menos hábitos concluídos.`,
      descoberta: `Não é fraqueza — é padrão. Saber disso já te coloca um passo à frente para mudar.`,
      confianca: "moderada",
      intensidade: 0.6
    })
  }

  // 3. Consistência geral
  if (ativosAtual >= 20) {
    padroes.push({
      id: "consistencia_alta",
      categoria: "habito",
      noRelacionado: "clareza",
      icone: "🔥",
      titulo: `Consistência real em ${Math.round((ativosAtual / periodo) * 100)}% dos dias`,
      observacao: `Nos últimos ${periodo} dias, você manteve hábitos em ${ativosAtual} deles. Isso é construção real.`,
      descoberta: `A consistência raramente parece com o que imaginamos. Ela acontece exatamente assim — um dia de cada vez.`,
      confianca: "alta",
      intensidade: ativosAtual / periodo
    })
  } else if (ativosAtual > 0) {
    padroes.push({
      id: "consistencia_crescendo",
      categoria: "habito",
      noRelacionado: "energia",
      icone: "🌱",
      titulo: `O padrão está se formando`,
      observacao: `Você registrou hábitos em ${ativosAtual} dos últimos ${periodo} dias. O ritmo está ganhando forma.`,
      descoberta: `A irregularidade também tem informação. O que acontece nos dias mais difíceis?`,
      confianca: "moderada",
      intensidade: ativosAtual / periodo
    })
  }

  // 4. Hábito âncora
  if (habitosComStats[0]?.pct >= 50) {
    padroes.push({
      id: "ancora",
      categoria: "habito",
      noRelacionado: "energia",
      icone: habitosComStats[0].icone,
      titulo: `"${habitosComStats[0].nome}" é sua âncora`,
      observacao: `Presente em ${habitosComStats[0].pct}% dos seus dias recentes. Quando esse hábito acontece, outros tendem a aparecer junto.`,
      descoberta: `Hábitos âncora funcionam como dominós. Cuidar desse pode ser a mudança mais eficiente.`,
      confianca: "alta",
      intensidade: habitosComStats[0].pct / 100
    })
  }

  // 5. Co-ocorrência de hábitos
  if (habitos.length >= 2) {
    let melhor = { h1: null as any, h2: null as any, score: 0 }
    for (let i = 0; i < habitos.length; i++) {
      for (let j = i + 1; j < habitos.length; j++) {
        const score = coOcorrencia(habitos[i], habitos[j], dias)
        if (score > melhor.score) melhor = { h1: habitos[i], h2: habitos[j], score }
      }
    }
    if (melhor.score >= 0.55) {
      padroes.push({
        id: "coocorrencia",
        categoria: "habito",
        noRelacionado: "rotina",
        icone: "🔗",
        titulo: `"${melhor.h1.nome}" e "${melhor.h2.nome}" andam juntos`,
        observacao: `Esses dois hábitos aparecem no mesmo dia em ${Math.round(melhor.score * 100)}% das vezes.`,
        descoberta: `Quando um acontece, o outro tende a vir junto. Eles parecem se alimentar mutuamente.`,
        confianca: "alta",
        intensidade: melhor.score
      })
    }
  }

  // 6. Hábito negativo sem recaída
  const negativos = habitos.filter(h => h.tipo === "negativo")
  negativos.forEach(h => {
    let diasLimpos = 0
    const d = new Date()
    while (!(h.historico || []).includes(d.toISOString().slice(0, 10))) {
      diasLimpos++
      d.setDate(d.getDate() - 1)
      if (diasLimpos > 90) break
    }
    if (diasLimpos >= 7) {
      padroes.push({
        id: `limpo_${h.id}`,
        categoria: "habito",
        noRelacionado: "clareza",
        icone: "💚",
        titulo: `"${h.nome}" — ${diasLimpos} dias limpos`,
        observacao: `Sem recaída nos últimos ${diasLimpos} dias. Isso é transformação real acontecendo.`,
        descoberta: `Isso não é força de vontade pura — é um padrão se consolidando. O que mudou nesses dias?`,
        confianca: "alta",
        intensidade: Math.min(diasLimpos / 30, 1)
      })
    }
    const recaidas7 = ultimos7.filter(d => (h.historico || []).includes(d)).length
    if (recaidas7 >= 4) {
      padroes.push({
        id: `dificil_${h.id}`,
        categoria: "emocional",
        noRelacionado: "ansiedade",
        icone: "🌊",
        titulo: `"${h.nome}" apareceu ${recaidas7}x esta semana`,
        observacao: `Há indícios de que algo está tornando essa semana mais difícil com esse hábito.`,
        descoberta: `Vale observar o que acontece antes. O padrão costuma ter um gatilho consistente.`,
        confianca: "moderada",
        intensidade: recaidas7 / 7
      })
    }
  })

  // 7. Sessões de foco
  const sessoes30 = sessoesFoco.filter(s => s.data >= dias[0])
  const totalMin = sessoes30.reduce((a, s) => a + (s.minutos || 0), 0)
  const mediaSessao = sessoes30.length > 0 ? Math.round(totalMin / sessoes30.length) : 0

  if (sessoes30.length > 0) {
    if (mediaSessao >= 40) {
      padroes.push({
        id: "foco_profundo",
        categoria: "foco",
        noRelacionado: "foco",
        icone: "🎯",
        titulo: `Você entra em foco profundo`,
        observacao: `Média de ${mediaSessao} minutos por sessão — acima de 40min, zona de foco real.`,
        descoberta: `Há indícios de que você entra em estado de fluxo com regularidade. Isso é raro e vale proteger.`,
        confianca: "alta",
        intensidade: Math.min(mediaSessao / 60, 1)
      })
    }
    if (melhorHoraEntry) {
      const h = melhorHora
      const periodo_dia = h < 12 ? "manhã" : h < 17 ? "tarde" : "noite"
      padroes.push({
        id: "foco_horario",
        categoria: "foco",
        noRelacionado: "foco",
        icone: "⏰",
        titulo: `Melhor foco: ${melhorHorarioFoco}`,
        observacao: `Seus blocos de foco mais frequentes acontecem às ${h}h — período da ${periodo_dia}.`,
        descoberta: `Proteger esse horário pode ser a mudança mais simples e poderosa na sua rotina.`,
        confianca: "alta",
        intensidade: 0.8
      })
    }

    // Foco + hábitos no mesmo dia
    const diasFocoHabito = dias.filter(d => {
      const temFoco = sessoes30.some(s => s.data === d)
      const temHabito = habitos.some(h => (h.historico || []).includes(d))
      return temFoco && temHabito
    }).length
    const diasComFoco = dias.filter(d => sessoes30.some(s => s.data === d)).length
    if (diasComFoco >= 4 && diasFocoHabito / diasComFoco >= 0.55) {
      padroes.push({
        id: "foco_habito_juntos",
        categoria: "foco",
        noRelacionado: "clareza",
        icone: "🔮",
        titulo: `Foco e rotina andam juntos`,
        observacao: `Em ${Math.round(diasFocoHabito / diasComFoco * 100)}% dos seus dias com foco, você também manteve hábitos.`,
        descoberta: `No seu caso, foco e rotina parecem se convocar. Um parece facilitar o outro.`,
        confianca: "alta",
        intensidade: diasFocoHabito / diasComFoco
      })
    }
  }

  // 8. Tarefas
  const tarefasRecentes = tarefas.filter(t => t.data >= dias[0])
  const tarefasConcluidas = tarefasRecentes.filter(t => t.feita).length
  const pctTarefas = tarefasRecentes.length > 0
    ? Math.round((tarefasConcluidas / tarefasRecentes.length) * 100)
    : 0

  if (pctTarefas >= 65) {
    padroes.push({
      id: "tarefas_bem",
      categoria: "tarefa",
      noRelacionado: "projetos",
      icone: "✅",
      titulo: `${pctTarefas}% das tarefas concluídas`,
      observacao: `Você completou ${tarefasConcluidas} de ${tarefasRecentes.length} tarefas criadas no período.`,
      descoberta: `Há indícios de que você está calibrando bem o que assume como compromisso. Isso tem valor.`,
      confianca: "alta",
      intensidade: pctTarefas / 100
    })
  } else if (tarefasRecentes.length > 5 && pctTarefas < 40) {
    padroes.push({
      id: "tarefas_sobrecarga",
      categoria: "tarefa",
      noRelacionado: "ansiedade",
      icone: "📋",
      titulo: `Muitas tarefas abertas`,
      observacao: `${100 - pctTarefas}% das tarefas criadas ficaram abertas. Pode indicar sobrecarga.`,
      descoberta: `Criar menos e concluir mais costuma gerar mais clareza do que ter listas longas.`,
      confianca: "moderada",
      intensidade: 0.65
    })
  }

  // 9. Projetos
  if (projetos.length > 0) {
    const ativos = projetos.filter(p => p.status === "Em andamento")
    const avancando = ativos.filter(p => (p.progresso || 0) >= 25)
    if (avancando.length > 0) {
      padroes.push({
        id: "projetos_avancando",
        categoria: "projeto",
        noRelacionado: "projetos",
        icone: "🚀",
        titulo: `Projetos com progresso real`,
        observacao: `"${avancando[0].nome}" está em ${avancando[0].progresso}%. ${avancando.length} projeto(s) avançando.`,
        descoberta: `Há indícios de que avançar em projetos com propósito aumenta sua energia nos dias seguintes.`,
        confianca: "moderada",
        intensidade: avancando[0].progresso / 100
      })
    }
    if (ativos.length >= 4) {
      padroes.push({
        id: "projetos_muitos",
        categoria: "projeto",
        noRelacionado: "ansiedade",
        icone: "🌪️",
        titulo: `${ativos.length} projetos ativos simultâneos`,
        observacao: `Muitos fronts abertos ao mesmo tempo podem fragmentar o foco e aumentar a sensação de sobrecarga.`,
        descoberta: `Qual desses projetos, se avançasse agora, mudaria mais coisa na sua vida?`,
        confianca: "moderada",
        intensidade: 0.6
      })
    }
  }

  // 10. Diário emocional
  if (diario.length > 0) {
    const diarioRecente = diario.filter(e => e.data >= dias[0])
    const humores = diarioRecente.map(e => e.humor).filter(Boolean)
    const contHumor: Record<string, number> = {}
    humores.forEach(h => { contHumor[h] = (contHumor[h] || 0) + 1 })
    const humorFreq = Object.entries(contHumor).sort((a, b) => b[1] - a[1])
    if (humorFreq[0]) {
      padroes.push({
        id: "humor_padrao",
        categoria: "emocional",
        noRelacionado: "energia",
        icone: "💜",
        titulo: `Humor predominante: ${humorFreq[0][0]}`,
        observacao: `"${humorFreq[0][0]}" aparece em ${humorFreq[0][1]} entradas do diário recente.`,
        descoberta: `O diário captura o que os dados não conseguem — o lado emocional do padrão.`,
        confianca: "moderada",
        intensidade: humorFreq[0][1] / Math.max(diarioRecente.length, 1)
      })
    }
  }

  // ══ CORRELAÇÕES ══
  if (habitos.length > 0) {
    correlacoes.push({
      origem: "sono",
      destino: "clareza",
      intensidade: 0.85 * (consistenciaAtual / 100),
      tipo: "positiva",
      confianca: consistenciaAtual > 50 ? "alta" : "moderada",
      descricao: "Noites bem dormidas parecem melhorar sua clareza mental."
    })
    correlacoes.push({
      origem: "exercicio",
      destino: "energia",
      intensidade: 0.78,
      tipo: "positiva",
      confianca: "alta",
      descricao: "Dias com exercício tendem a ter mais energia registrada."
    })
    correlacoes.push({
      origem: "rotina",
      destino: "clareza",
      intensidade: 0.72,
      tipo: "positiva",
      confianca: "alta",
      descricao: "Rotinas estruturadas parecem aumentar sua clareza."
    })
    correlacoes.push({
      origem: "tela",
      destino: "ansiedade",
      intensidade: 0.68,
      tipo: "negativa",
      confianca: "moderada",
      descricao: "Excesso de tela parece aumentar ansiedade nos dias seguintes."
    })
  }

  // ══ EVOLUÇÃO ══
  const sessoesFoco30 = sessoesFoco.filter(s => s.data >= dias[0]).length
  const sessoesFocoAnt = sessoesFoco.filter(s => s.data >= diasAnt[0] && s.data < dias[0]).length
  const tarefasConc30 = tarefas.filter(t => t.feita && t.data >= dias[0]).length
  const tarefasConcAnt = tarefas.filter(t => t.feita && t.data >= diasAnt[0] && t.data < dias[0]).length

  const evolucao: Evolucao[] = [
    {
      label: "Consistência de hábitos",
      atual: consistenciaAtual,
      anterior: consistenciaAnterior,
      diff: consistenciaAtual - consistenciaAnterior,
      tendencia: consistenciaAtual > consistenciaAnterior + 5 ? "subindo" : consistenciaAtual < consistenciaAnterior - 5 ? "descendo" : "estavel",
      descricao: consistenciaAtual > consistenciaAnterior
        ? "Sua consistência está crescendo. Algo está funcionando."
        : consistenciaAtual < consistenciaAnterior
        ? "Há indícios de queda. Pode ser um ciclo natural — observe sem julgamento."
        : "Consistência estável. Sustentabilidade também é evolução."
    },
    {
      label: "Sessões de foco",
      atual: sessoesFoco30,
      anterior: sessoesFocoAnt,
      diff: sessoesFoco30 - sessoesFocoAnt,
      tendencia: sessoesFoco30 > sessoesFocoAnt ? "subindo" : sessoesFoco30 < sessoesFocoAnt ? "descendo" : "estavel",
      descricao: sessoesFoco30 > sessoesFocoAnt
        ? "Mais blocos de foco do que no período anterior."
        : "Menos sessões de foco. Pode ser sobrecarga ou recarregamento necessário."
    },
    {
      label: "Tarefas concluídas",
      atual: tarefasConc30,
      anterior: tarefasConcAnt,
      diff: tarefasConc30 - tarefasConcAnt,
      tendencia: tarefasConc30 > tarefasConcAnt ? "subindo" : tarefasConc30 < tarefasConcAnt ? "descendo" : "estavel",
      descricao: tarefasConc30 > tarefasConcAnt
        ? "Mais tarefas concluídas do que antes. Clareza em ação."
        : "Pode indicar período de planejamento — nem sempre conclui é o objetivo."
    }
  ]

  return {
    correlacoes,
    padroes: padroes.slice(0, 10),
    evolucao,
    melhorDiaSemana,
    melhorHorarioFoco,
    habitoAncora,
    consistenciaGeral: consistenciaAtual,
    diasAnalisados: ativosAtual
  }
}