// ══════════════════════════════════════════════════════
// MEMORY ENGINE — Memória comportamental do Focus Planner
// ══════════════════════════════════════════════════════

import type { ResultadoAnalise } from "./patternEngine"
import type { DecisionState } from "./decisionEngine"

export type MemoryType =
  | "ciclo"
  | "gatilho_recorrente"
  | "regulador"
  | "queda"
  | "recuperacao"
  | "fase_positiva"

export type BehavioralMemory = {
  id: string
  tipo: MemoryType
  titulo: string
  descricao: string
  recorrencias: number
  impacto: "baixo" | "moderado" | "alto"
  confianca: "baixa" | "moderada" | "alta"
  ultimaOcorrencia: string
  evidencias: string[]
  relacionadoA: string[]
}

export type MemoryInput = {
  diario: any[]
  habitos: any[]
  sessoesFoco: any[]
  tarefas: any[]
  projetos: any[]
  analise: ResultadoAnalise
  decisao: DecisionState
}

// ── Helpers ──────────────────────────────────────────

function getDias(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

function mediaCheckin(entradas: any[], campo: string, fallback = 5): number {
  const vals = entradas.map(e => e?.checkin?.[campo]).filter(v => v !== undefined)
  if (!vals.length) return fallback
  return vals.reduce((a: number, b: number) => a + b, 0) / vals.length
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Motor principal ───────────────────────────────────

export function generateMemories(input: MemoryInput): BehavioralMemory[] {
  const { diario, habitos, sessoesFoco, tarefas, analise, decisao } = input
  const memorias: BehavioralMemory[] = []

  const dias30 = getDias(30)
  const dias14 = getDias(14)
  const dias7  = getDias(7)

  const diario30 = diario.filter(e => dias30.includes(e.data))
  const diario14 = diario.filter(e => dias14.includes(e.data))
  const diario7  = diario.filter(e => dias7.includes(e.data))

  // ── 1. CICLO DE SOBRECARGA ────────────────────────
  const tarefasAbertas   = tarefas.filter(t => !t.feita).length
  const estresseMedio7   = mediaCheckin(diario7, "estresse", 5)
  const sonoMedio7       = mediaCheckin(diario7, "sono", 6)
  const sessoesFoco7     = sessoesFoco.filter(s => dias7.includes(s.data)).length

  if (tarefasAbertas > 8 && estresseMedio7 > 6 && sonoMedio7 < 6) {
    const evidencias = []
    if (tarefasAbertas > 8) evidencias.push(`${tarefasAbertas} tarefas abertas acumuladas`)
    if (estresseMedio7 > 6) evidencias.push(`Estresse médio de ${Math.round(estresseMedio7 * 10) / 10} nos últimos 7 dias`)
    if (sonoMedio7 < 6)    evidencias.push(`Sono abaixo de 6h nos registros recentes`)
    if (sessoesFoco7 < 2)  evidencias.push(`Apenas ${sessoesFoco7} sessão(ões) de foco na semana`)

    memorias.push({
      id: "mem-ciclo-sobrecarga",
      tipo: "ciclo",
      titulo: "Ciclo de sobrecarga parece se repetir",
      descricao: "Seus registros sugerem que você costuma entrar em sobrecarga quando acumula muitas tarefas abertas e dorme pouco ao mesmo tempo.",
      recorrencias: Math.min(Math.floor(tarefasAbertas / 4), 5),
      impacto: "alto",
      confianca: estresseMedio7 > 7 ? "alta" : "moderada",
      ultimaOcorrencia: hoje(),
      evidencias,
      relacionadoA: ["sobrecarga", "sono", "foco", "estresse"]
    })
  }

  // ── 2. GATILHOS RECORRENTES ───────────────────────
  const contagemGatilhos: Record<string, { total: number; comAnsiedade: number }> = {}

  diario30.forEach(e => {
    const ansiedade = e.checkin?.ansiedade || 0
    ;(e.gatilhos || []).forEach((g: string) => {
      if (!contagemGatilhos[g]) contagemGatilhos[g] = { total: 0, comAnsiedade: 0 }
      contagemGatilhos[g].total++
      if (ansiedade >= 6) contagemGatilhos[g].comAnsiedade++
    })
  })

  Object.entries(contagemGatilhos)
    .filter(([_, v]) => v.total >= 3 && v.comAnsiedade >= 2)
    .sort((a, b) => b[1].comAnsiedade - a[1].comAnsiedade)
    .slice(0, 2)
    .forEach(([gatilho, dados]) => {
      const pct = Math.round((dados.comAnsiedade / dados.total) * 100)
      memorias.push({
        id: `mem-gatilho-${gatilho.toLowerCase().replace(/\s/g, "-")}`,
        tipo: "gatilho_recorrente",
        titulo: `"${gatilho}" parece anteceder ansiedade`,
        descricao: `Seus registros sugerem que "${gatilho}" costuma aparecer nos dias em que sua ansiedade está mais elevada — em ${pct}% das ocorrências.`,
        recorrencias: dados.total,
        impacto: dados.comAnsiedade >= 4 ? "alto" : "moderado",
        confianca: dados.total >= 5 ? "alta" : "moderada",
        ultimaOcorrencia: hoje(),
        evidencias: [
          `"${gatilho}" apareceu ${dados.total} vezes nos últimos 30 dias`,
          `Em ${dados.comAnsiedade} dessas vezes, ansiedade estava acima de 6`,
        ],
        relacionadoA: ["ansiedade", "gatilhos", gatilho.toLowerCase()]
      })
    })

  // ── 3. REGULADORES EMOCIONAIS ─────────────────────
  const diasComHabito: Record<string, string[]> = {}
  habitos.filter(h => h.tipo !== "negativo").forEach(h => {
    diasComHabito[h.nome] = (h.historico || []).filter((d: string) => dias30.includes(d))
  })

  habitos.filter(h => h.tipo !== "negativo").forEach(h => {
    const diasFeitos = diasComHabito[h.nome] || []
    if (diasFeitos.length < 5) return

    const entradasComHabito    = diario30.filter(e => diasFeitos.includes(e.data))
    const entradasSemHabito    = diario30.filter(e => !diasFeitos.includes(e.data))
    if (entradasComHabito.length < 3 || entradasSemHabito.length < 3) return

    const energiaComHabito = mediaCheckin(entradasComHabito, "energia", 5)
    const energiaSemHabito = mediaCheckin(entradasSemHabito, "energia", 5)
    const humorComHabito   = mediaCheckin(entradasComHabito, "humor",   5)
    const humorSemHabito   = mediaCheckin(entradasSemHabito, "humor",   5)

    const diffEnergia = energiaComHabito - energiaSemHabito
    const diffHumor   = humorComHabito   - humorSemHabito

    if (diffEnergia >= 1.2 || diffHumor >= 1.2) {
      memorias.push({
        id: `mem-regulador-${h.id}`,
        tipo: "regulador",
        titulo: `"${h.nome}" parece regular sua energia`,
        descricao: `Há indícios de que nos dias em que você faz "${h.nome}", sua energia e humor tendem a ser maiores do que nos dias sem esse hábito.`,
        recorrencias: diasFeitos.length,
        impacto: diffEnergia >= 2 || diffHumor >= 2 ? "alto" : "moderado",
        confianca: diasFeitos.length >= 10 ? "alta" : "moderada",
        ultimaOcorrencia: diasFeitos[diasFeitos.length - 1] || hoje(),
        evidencias: [
          `Energia média com "${h.nome}": ${Math.round(energiaComHabito * 10) / 10}/10`,
          `Energia média sem "${h.nome}": ${Math.round(energiaSemHabito * 10) / 10}/10`,
          `"${h.nome}" presente em ${diasFeitos.length} dos últimos 30 dias`,
        ],
        relacionadoA: ["energia", "humor", h.nome.toLowerCase()]
      })
    }
  })

  // ── 4. RECUPERAÇÃO ───────────────────────────────
  if (diario14.length >= 6) {
    const primeira = diario14.slice(0, Math.floor(diario14.length / 2))
    const segunda  = diario14.slice(Math.floor(diario14.length / 2))

    const ansP = mediaCheckin(primeira, "ansiedade", 5)
    const ansS = mediaCheckin(segunda,  "ansiedade", 5)
    const claP = mediaCheckin(primeira, "clareza",   5)
    const claS = mediaCheckin(segunda,  "clareza",   5)

    if (ansP >= 6.5 && ansS < ansP - 1 && claS > claP) {
      const habitosRecuperacao = habitos
        .filter(h => {
          const diasRecente = (h.historico || []).filter((d: string) => segunda.some(e => e.data === d))
          return diasRecente.length >= Math.floor(segunda.length * 0.4)
        })
        .map(h => h.nome)
        .slice(0, 2)

      memorias.push({
        id: "mem-recuperacao",
        tipo: "recuperacao",
        titulo: "Você parece estar se recuperando",
        descricao: habitosRecuperacao.length > 0
          ? `Seus registros sugerem que você costuma voltar ao equilíbrio quando mantém ${habitosRecuperacao.join(" e ")}. Esse padrão parece se repetir.`
          : "Há indícios de que sua clareza e estabilidade estão melhorando após um período mais difícil.",
        recorrencias: 1,
        impacto: "moderado",
        confianca: "moderada",
        ultimaOcorrencia: hoje(),
        evidencias: [
          `Ansiedade caiu de ${Math.round(ansP * 10) / 10} para ${Math.round(ansS * 10) / 10} na segunda metade do período`,
          `Clareza subiu de ${Math.round(claP * 10) / 10} para ${Math.round(claS * 10) / 10}`,
          ...(habitosRecuperacao.length > 0 ? [`Hábitos presentes na recuperação: ${habitosRecuperacao.join(", ")}`] : [])
        ],
        relacionadoA: ["recuperacao", "ansiedade", "clareza", ...habitosRecuperacao.map(h => h.toLowerCase())]
      })
    }
  }

  // ── 5. FASE POSITIVA ──────────────────────────────
  if (diario7.length >= 4) {
    const clarezaMedia7 = mediaCheckin(diario7, "clareza",   5)
    const humorMedio7   = mediaCheckin(diario7, "humor",     5)
    const estresseBaixo = mediaCheckin(diario7, "estresse",  5)
    const habitosAtivos7 = habitos.filter(h =>
      (h.historico || []).filter((d: string) => dias7.includes(d)).length >= 4
    ).length

    if (clarezaMedia7 >= 6.5 && humorMedio7 >= 6.5 && estresseBaixo < 5 && habitosAtivos7 >= 2) {
      memorias.push({
        id: "mem-fase-positiva",
        tipo: "fase_positiva",
        titulo: "Você está em uma fase positiva",
        descricao: "Seus registros desta semana mostram mais clareza, humor estável e menos estresse. Há indícios de que algo está funcionando bem — vale notar o que foi diferente.",
        recorrencias: diario7.length,
        impacto: "alto",
        confianca: clarezaMedia7 >= 7.5 ? "alta" : "moderada",
        ultimaOcorrencia: hoje(),
        evidencias: [
          `Clareza média de ${Math.round(clarezaMedia7 * 10) / 10}/10 nos últimos 7 dias`,
          `Humor médio de ${Math.round(humorMedio7 * 10) / 10}/10`,
          `Estresse abaixo de 5`,
          `${habitosAtivos7} hábito(s) com alta frequência esta semana`,
        ],
        relacionadoA: ["clareza", "humor", "estresse", "fase_positiva"]
      })
    }
  }

  // ── 6. QUEDA DE CLAREZA ───────────────────────────
  if (diario14.length >= 6) {
    const metade1 = diario14.slice(0, Math.floor(diario14.length / 2))
    const metade2 = diario14.slice(Math.floor(diario14.length / 2))
    const cla1 = mediaCheckin(metade1, "clareza", 5)
    const cla2 = mediaCheckin(metade2, "clareza", 5)
    const ans2 = mediaCheckin(metade2, "ansiedade", 5)

    if (cla1 - cla2 >= 1.5 && ans2 >= 6) {
      const gatilhoFreq = Object.entries(contagemGatilhos)
        .sort((a, b) => b[1].total - a[1].total)[0]

      memorias.push({
        id: "mem-queda-clareza",
        tipo: "queda",
        titulo: "Clareza mental parece ter caído recentemente",
        descricao: gatilhoFreq
          ? `Seus registros sugerem queda na clareza mental na segunda metade do período. "${gatilhoFreq[0]}" pode estar relacionado a esse padrão.`
          : "Há indícios de queda na clareza mental nos últimos dias. Pode valer observar o que mudou na rotina.",
        recorrencias: Math.round(cla1 - cla2),
        impacto: cla1 - cla2 >= 2.5 ? "alto" : "moderado",
        confianca: "moderada",
        ultimaOcorrencia: hoje(),
        evidencias: [
          `Clareza caiu de ${Math.round(cla1 * 10) / 10} para ${Math.round(cla2 * 10) / 10}`,
          `Ansiedade subiu para ${Math.round(ans2 * 10) / 10}/10`,
          ...(gatilhoFreq ? [`"${gatilhoFreq[0]}" apareceu ${gatilhoFreq[1].total} vezes no período`] : [])
        ],
        relacionadoA: ["clareza", "ansiedade", "queda"]
      })
    }
  }

  // ── 7. PADRÃO DO patternEngine ────────────────────
  if (analise.habitoAncora) {
    memorias.push({
      id: "mem-ancora",
      tipo: "regulador",
      titulo: `"${analise.habitoAncora}" é seu hábito âncora`,
      descricao: `Seus registros mostram que "${analise.habitoAncora}" é o hábito mais consistente. Quando ele acontece, outros padrões positivos tendem a seguir.`,
      recorrencias: Math.round(analise.consistenciaGeral / 10),
      impacto: "alto",
      confianca: analise.consistenciaGeral > 60 ? "alta" : "moderada",
      ultimaOcorrencia: hoje(),
      evidencias: [
        `Consistência geral de ${analise.consistenciaGeral}%`,
        `"${analise.habitoAncora}" aparece como o mais frequente nos registros`,
      ],
      relacionadoA: ["habitos", "ancora", "consistencia"]
    })
  }

  // Limita e ordena por impacto
  const ordem = { alto: 0, moderado: 1, baixo: 2 }
  return memorias
    .sort((a, b) => ordem[a.impacto] - ordem[b.impacto])
    .slice(0, 6)
}