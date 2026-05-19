// ══════════════════════════════════════════════════════
// FORECAST ENGINE — Previsão comportamental
// ══════════════════════════════════════════════════════

import type { ResultadoAnalise } from "./patternEngine"
import type { DecisionState } from "./decisionEngine"
import type { BehavioralMemory } from "./memoryEngine"

export type TendenciaDir = "subindo" | "estavel" | "caindo"
export type EstabilidadeNivel = "baixa" | "moderada" | "alta"

export type ForecastState = {
  riscoSobrecarga:     number        // 0–100
  riscoRecaida:        number        // 0–100
  riscoAbandono:       number        // 0–100
  tendenciaClareza:    TendenciaDir
  tendenciaEnergia:    TendenciaDir
  estabilidadePrevista: EstabilidadeNivel
  mensagemPrevisiva:   string
  sinaisDetectados:    string[]
}

export type ForecastInput = {
  diario:      any[]
  habitos:     any[]
  tarefas:     any[]
  sessoesFoco: any[]
  analise:     ResultadoAnalise
  decisao:     DecisionState
  memorias:    BehavioralMemory[]
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
  const vals = entradas
    .map(e => e?.checkin?.[campo])
    .filter(v => v !== undefined && v !== null)
  if (!vals.length) return fallback
  return vals.reduce((a: number, b: number) => a + b, 0) / vals.length
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

function tendencia(recente: number, anterior: number, limiar = 0.8): TendenciaDir {
  if (recente - anterior >  limiar) return "subindo"
  if (anterior - recente >  limiar) return "caindo"
  return "estavel"
}

// ── Motor principal ───────────────────────────────────

export function generateForecast(input: ForecastInput): ForecastState {
  const { diario, habitos, tarefas, sessoesFoco, analise, decisao, memorias } = input

  const sinais: string[] = []

  const dias7  = getDias(7)
  const dias3  = getDias(3)
  const dias14 = getDias(14)

  const d7  = diario.filter(e => dias7.includes(e.data))
  const d3  = diario.filter(e => dias3.includes(e.data))
  const d14 = diario.filter(e => dias14.includes(e.data))

  // ── Médias recentes ──────────────────────────────
  const ans7   = mediaCheckin(d7,  "ansiedade", 5)
  const ans3   = mediaCheckin(d3,  "ansiedade", 5)
  const cla7   = mediaCheckin(d7,  "clareza",   5)
  const cla3   = mediaCheckin(d3,  "clareza",   5)
  const ene7   = mediaCheckin(d7,  "energia",   5)
  const ene3   = mediaCheckin(d3,  "energia",   5)
  const sono7  = mediaCheckin(d7,  "sono",      6)
  const sono3  = mediaCheckin(d3,  "sono",      6)
  const est7   = mediaCheckin(d7,  "estresse",  5)
  const est3   = mediaCheckin(d3,  "estresse",  5)

  const sessoes7 = sessoesFoco.filter(s => dias7.includes(s.data)).length
  const sessoes3 = sessoesFoco.filter(s => dias3.includes(s.data)).length

  // ── RISCO DE SOBRECARGA ──────────────────────────
  let sobrecarga = decisao.sobrecargaScore * 0.4  // base do presente

  // Tendência de ansiedade subindo
  if (ans3 > ans7 + 1)   { sobrecarga += 15; sinais.push("Ansiedade aumentando nos últimos 3 dias.") }
  if (est3 > est7 + 1)   { sobrecarga += 12; sinais.push("Estresse em tendência de alta.") }
  if (sono3 < sono7 - 0.8){ sobrecarga += 12; sinais.push("Sono piorando nos dias recentes.") }
  if (sessoes3 === 0 && sessoes7 >= 2) { sobrecarga += 10; sinais.push("Foco caindo em relação à semana.") }

  const tarefasAbertas = tarefas.filter(t => !t.feita).length
  const tarefasAtr     = tarefas.filter(t => !t.feita && t.data && t.data < new Date().toISOString().slice(0, 10)).length
  if (tarefasAbertas > 10) { sobrecarga += 15; sinais.push(`${tarefasAbertas} tarefas abertas acumuladas.`) }
  if (tarefasAtr > 2)      { sobrecarga += 10; sinais.push(`${tarefasAtr} tarefa(s) atrasada(s).`) }

  // Memórias de ciclo de sobrecarga aumentam previsão
  const temCicloSobrecarga = memorias.some(m => m.tipo === "ciclo" && m.impacto === "alto")
  if (temCicloSobrecarga)  { sobrecarga += 10; sinais.push("Padrão de sobrecarga já foi detectado antes.") }

  const riscoSobrecarga = clamp(Math.round(sobrecarga))

  // ── RISCO DE RECAÍDA ─────────────────────────────
  let recaida = 0

  const negativos = habitos.filter(h => h.tipo === "negativo")
  negativos.forEach(h => {
    const recaidasRecentes = dias7.filter(d => (h.historico || []).includes(d)).length
    const recaidas3 = dias3.filter(d => (h.historico || []).includes(d)).length
    if (recaidasRecentes >= 2) { recaida += 20; sinais.push(`"${h.nome}" reapareceu ${recaidasRecentes}x esta semana.`) }
    else if (recaidas3 >= 1)   { recaida += 12 }
  })

  // Hábitos reguladores abandonados aumentam risco
  const reguladores = memorias.filter(m => m.tipo === "regulador")
  reguladores.forEach(mem => {
    const nomeHabito = mem.relacionadoA.find(r => r !== "energia" && r !== "humor")
    if (!nomeHabito) return
    const habito = habitos.find(h => h.nome.toLowerCase().includes(nomeHabito))
    if (!habito) return
    const feitoRecente = dias7.some(d => (habito.historico || []).includes(d))
    if (!feitoRecente) { recaida += 15; sinais.push(`"${habito.nome}" (regulador) não aparece nos últimos 7 dias.`) }
  })

  if (ans3 > 7)  { recaida += 12; sinais.push("Ansiedade alta pode aumentar risco de recaída.") }
  if (sono3 < 5) { recaida += 10 }

  const riscoRecaida = clamp(Math.round(recaida))

  // ── RISCO DE ABANDONO ────────────────────────────
  let abandono = 0

  // Hábitos positivos abandonados
  const habitosPositivos = habitos.filter(h => h.tipo !== "negativo")
  let habitosAbandonados = 0
  habitosPositivos.forEach(h => {
    const feitoSemana = dias7.filter(d => (h.historico || []).includes(d)).length
    if (feitoSemana === 0 && (h.historico || []).length > 5) {
      habitosAbandonados++
      sinais.push(`"${h.nome}" não aparece nos últimos 7 dias.`)
    }
  })
  if (habitosAbandonados >= 2) abandono += 25
  else if (habitosAbandonados === 1) abandono += 12

  // Queda de consistência geral
  if (analise.consistenciaGeral < 30 && habitosPositivos.length > 0) {
    abandono += 15
  }

  // Foco zerado
  if (sessoes7 === 0 && tarefasAbertas > 5) {
    abandono += 15; sinais.push("Nenhuma sessão de foco na semana.")
  }

  // Pouco diário
  const diasSemDiario = dias7.filter(d => !diario.some(e => e.data === d)).length
  if (diasSemDiario >= 5) abandono += 10

  const riscoAbandono = clamp(Math.round(abandono))

  // ── TENDÊNCIA DE CLAREZA ─────────────────────────
  const tendClareza = tendencia(cla3, cla7)
  if (tendClareza === "caindo" && !sinais.some(s => s.includes("clareza"))) {
    sinais.push("Clareza mental em tendência de queda.")
  }
  if (tendClareza === "subindo") {
    sinais.push("Clareza mental mostrando tendência de melhora.")
  }

  // ── TENDÊNCIA DE ENERGIA ─────────────────────────
  const tendEnergia = tendencia(ene3, ene7)
  if (tendEnergia === "caindo") {
    sinais.push("Energia mostrando leve queda nos registros recentes.")
  }

  // ── ESTABILIDADE PREVISTA ────────────────────────
  const scoreEstab =
    (100 - riscoSobrecarga) * 0.35 +
    (100 - riscoRecaida)    * 0.25 +
    (100 - riscoAbandono)   * 0.20 +
    analise.consistenciaGeral * 0.20

  const estabilidadePrevista: EstabilidadeNivel =
    scoreEstab >= 65 ? "alta" :
    scoreEstab >= 40 ? "moderada" : "baixa"

  // ── MENSAGEM PREVISIVA ───────────────────────────
  let mensagemPrevisiva = ""

  if (riscoSobrecarga >= 60) {
    mensagemPrevisiva = "Seus registros sugerem aumento gradual de sobrecarga. Pode valer reduzir o que está em aberto antes de assumir mais."
  } else if (riscoRecaida >= 50) {
    mensagemPrevisiva = "Há sinais de que alguns padrões difíceis podem estar voltando. Observar sem julgamento já ajuda."
  } else if (riscoAbandono >= 50) {
    mensagemPrevisiva = "Alguns hábitos parecem estar sendo deixados de lado. Voltar para o básico costuma ser o caminho."
  } else if (tendClareza === "subindo" && tendEnergia === "subindo") {
    mensagemPrevisiva = "Há sinais de melhora consistente na sua clareza e energia. Seus registros sugerem uma fase positiva se aproximando."
  } else if (estabilidadePrevista === "alta") {
    mensagemPrevisiva = "Seus registros sugerem estabilidade para os próximos dias. Continue protegendo o básico."
  } else if (tendClareza === "caindo") {
    mensagemPrevisiva = "Há tendência de queda na clareza mental. Pode ser um sinal para desacelerar e reorganizar o básico."
  } else {
    mensagemPrevisiva = "Seu sistema parece em transição. Observar os próximos dias pode revelar padrões importantes."
  }

  return {
    riscoSobrecarga,
    riscoRecaida,
    riscoAbandono,
    tendenciaClareza:     tendClareza,
    tendenciaEnergia:     tendEnergia,
    estabilidadePrevista,
    mensagemPrevisiva,
    sinaisDetectados: sinais.slice(0, 5),
  }
}