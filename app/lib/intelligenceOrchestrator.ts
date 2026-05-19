// ══════════════════════════════════════════════════════
// INTELLIGENCE ORCHESTRATOR — Decide o que mostrar
// ══════════════════════════════════════════════════════

import type { ResultadoAnalise } from "./patternEngine"
import type { DecisionState } from "./decisionEngine"
import type { BehavioralMemory } from "./memoryEngine"
import type { ForecastState } from "./forecastEngine"
import type { Intervention } from "./interventionEngine"
import type { PersonalProfile } from "./personalProfileEngine"
import type { FeedbackSummary } from "./feedbackEngine"

export type EstadoGeral = "leve" | "estavel" | "atencao" | "protecao"

export type IntelligenceSummary = {
  mensagemCentral:        string
  prioridadeAtual:        string
  insightPrincipal:       string
  intervencaoPrincipal?:  string
  estadoGeral:            EstadoGeral
  mostrarModoProtecao:    boolean
  blocosPrioritarios:     string[]
  blocosOcultos:          string[]
  motivos:                string[]
  alertaSuave?:           string
  acaoDestacada?:         string
}

export type OrchestratorInput = {
  analise:         ResultadoAnalise
  decisao:         DecisionState
  memorias:        BehavioralMemory[]
  previsao:        ForecastState
  intervencoes:    Intervention[]
  perfil:          PersonalProfile
  feedbackSummary: FeedbackSummary
}

// ── Motor principal ───────────────────────────────────

export function generateIntelligenceSummary(input: OrchestratorInput): IntelligenceSummary {
  const { analise, decisao, memorias, previsao, intervencoes, perfil, feedbackSummary } = input

  const motivos: string[] = []

  // ── 1. ESTADO GERAL ───────────────────────────────
  let estadoGeral: EstadoGeral

  if (decisao.estadoAtual === "critico") {
    estadoGeral = "protecao"
  } else if (decisao.estadoAtual === "sobrecarregado" || previsao.riscoSobrecarga >= 65) {
    estadoGeral = "atencao"
  } else if (decisao.estadoAtual === "leve" && previsao.estabilidadePrevista === "alta") {
    estadoGeral = "leve"
  } else {
    estadoGeral = "estavel"
  }

  const mostrarModoProtecao = estadoGeral === "protecao" || estadoGeral === "atencao"

  // ── 2. MENSAGEM CENTRAL ───────────────────────────
  // Escolhe a mensagem mais relevante baseada no estado
  let mensagemCentral = decisao.mensagemPrincipal

  if (estadoGeral === "protecao") {
    mensagemCentral = "Hoje talvez seja melhor desacelerar e atravessar o dia com menos ruído."
  } else if (estadoGeral === "atencao") {
    mensagemCentral = previsao.mensagemPrevisiva || decisao.mensagemPrincipal
  } else if (estadoGeral === "leve") {
    mensagemCentral = memorias.find(m => m.tipo === "fase_positiva")?.descricao
      || "Seus registros mostram um bom momento. Há espaço para avançar com calma."
  } else {
    // Prioriza feedback: se sistema está acertando, usa mensagem do decisao
    // Se não, usa mensagem mais genérica e segura
    if (feedbackSummary.taxaAcerto < 40 && feedbackSummary.totalFeedbacks >= 5) {
      mensagemCentral = "Continue registrando. O sistema está calibrando para entender melhor seu funcionamento."
    } else {
      mensagemCentral = decisao.mensagemPrincipal
    }
  }

  // ── 3. PRIORIDADE ATUAL ───────────────────────────
  let prioridadeAtual = decisao.prioridadeDoDia

  if (estadoGeral === "protecao") {
    prioridadeAtual = "Escolher apenas uma ação e proteger sua energia."
  } else if (estadoGeral === "atencao" && previsao.riscoAbandono >= 50) {
    prioridadeAtual = "Voltar para o básico — um hábito, uma tarefa, um passo."
  } else if (estadoGeral === "leve" && perfil.melhorHorarioFoco !== "—") {
    prioridadeAtual = `Aproveitar o período da ${perfil.melhorHorarioFoco} para avançar no que mais importa.`
  }

  // ── 4. INSIGHT PRINCIPAL ──────────────────────────
  // Filtra insights não úteis baseado no feedback
  const tiposNaoUteis = feedbackSummary.sugestoesMenosUteis

  let insightPrincipal = ""

  // Primeiro tenta memórias positivas
  const memoriaPositiva = memorias.find(
    m => (m.tipo === "fase_positiva" || m.tipo === "regulador") &&
    !tiposNaoUteis.includes(m.id)
  )
  if (memoriaPositiva) {
    insightPrincipal = memoriaPositiva.descricao
  }

  // Depois tenta padrões do patternEngine
  if (!insightPrincipal && analise.padroes.length > 0) {
    const padrao = analise.padroes.find(p => !tiposNaoUteis.includes(p.id))
    if (padrao) insightPrincipal = padrao.observacao
  }

  // Fallback
  if (!insightPrincipal) {
    insightPrincipal = perfil.resumoHumano ||
      "Continue registrando seus dados para que insights personalizados apareçam aqui."
  }

  // ── 5. INTERVENÇÃO PRINCIPAL ──────────────────────
  // Filtra intervenções não úteis baseado no feedback
  const intervencaoFiltrada = intervencoes.find(
    i => !tiposNaoUteis.includes(i.id)
  )
  const intervencaoPrincipal = intervencaoFiltrada?.descricao

  // Ação destacada
  const acaoDestacada = intervencaoFiltrada?.acaoPrincipal

  if (intervencaoFiltrada) {
    motivos.push(`Intervenção: ${intervencaoFiltrada.tipo} — ${intervencaoFiltrada.motivo}`)
  }

  // ── 6. BLOCOS PRIORITÁRIOS E OCULTOS ─────────────
  const blocosPrioritarios: string[] = []
  const blocosOcultos: string[] = []

  if (estadoGeral === "protecao") {
    // Modo proteção: mostra só o essencial
    blocosPrioritarios.push("acao_imediata", "sobrecarga", "habitos")
    blocosOcultos.push("metas", "projetos", "evolucao", "insights_secundarios")
    motivos.push("Modo proteção ativo — exibindo apenas o essencial.")
  } else if (estadoGeral === "atencao") {
    blocosPrioritarios.push("acao_imediata", "sobrecarga", "agenda", "habitos")
    blocosOcultos.push("evolucao_detalhada", "insights_secundarios")
    motivos.push("Estado de atenção — reduzindo informações secundárias.")
  } else if (estadoGeral === "leve") {
    // Dia leve: libera blocos de progresso e expansão
    blocosPrioritarios.push("projetos", "metas", "evolucao", "insights", "foco")
    blocosOcultos.push("sobrecarga_detalhada")
    motivos.push("Momento positivo — liberando blocos de avanço.")
  } else {
    // Estável: equilíbrio
    blocosPrioritarios.push("acao_imediata", "agenda", "habitos", "projetos")
    if (analise.padroes.length > 0) blocosPrioritarios.push("insights")
    if (previsao.riscoSobrecarga > 30) blocosOcultos.push("projetos_novos")
    motivos.push("Estado estável — exibição balanceada.")
  }

  // Feedback influencia visibilidade
  if (feedbackSummary.totalFeedbacks >= 5) {
    if (feedbackSummary.taxaAcerto < 40) {
      // Sistema errando muito: mostra menos sugestões automáticas
      blocosOcultos.push("sugestoes_automaticas")
      motivos.push("Feedback indica que sugestões precisam de calibração.")
    } else if (feedbackSummary.taxaAcerto >= 75) {
      // Sistema acertando: libera mais insights
      if (!blocosPrioritarios.includes("insights")) blocosPrioritarios.push("insights")
      motivos.push("Feedback positivo — sistema liberando mais insights.")
    }
  }

  // ── 7. ALERTA SUAVE ───────────────────────────────
  let alertaSuave: string | undefined

  if (previsao.riscoSobrecarga >= 60 && estadoGeral !== "protecao") {
    alertaSuave = "Seus registros sugerem tendência de sobrecarga nos próximos dias."
  } else if (previsao.riscoRecaida >= 55) {
    alertaSuave = "Há sinais de que alguns padrões difíceis podem estar voltando."
  } else if (previsao.riscoAbandono >= 55) {
    alertaSuave = "Alguns hábitos parecem estar perdendo consistência."
  } else if (previsao.tendenciaClareza === "subindo" && decisao.energiaScore >= 60) {
    alertaSuave = "Seus registros mostram tendência positiva de clareza e energia."
  }

  // ── 8. MOTIVOS FINAIS ─────────────────────────────
  if (decisao.motivos.length > 0) {
    motivos.push(...decisao.motivos.slice(0, 2))
  }
  if (previsao.sinaisDetectados.length > 0) {
    motivos.push(...previsao.sinaisDetectados.slice(0, 1))
  }

  return {
    mensagemCentral,
    prioridadeAtual,
    insightPrincipal,
    intervencaoPrincipal,
    estadoGeral,
    mostrarModoProtecao,
    blocosPrioritarios: [...new Set(blocosPrioritarios)],
    blocosOcultos:      [...new Set(blocosOcultos)],
    motivos:            [...new Set(motivos)].slice(0, 4),
    alertaSuave,
    acaoDestacada,
  }
}