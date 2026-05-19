// ══════════════════════════════════════════════════════
// UI STATE ENGINE — Interface emocional adaptativa
// ══════════════════════════════════════════════════════

import type { DecisionState } from "./decisionEngine"
import type { ForecastState } from "./forecastEngine"
import type { IntelligenceSummary } from "./intelligenceOrchestrator"
import type { PersonalProfile } from "./personalProfileEngine"

export type UIModo = "leve" | "expansao" | "protecao" | "oscilacao"
export type UIAtmosfera = "calma" | "expansiva" | "contemplativa" | "minimalista"
export type UIAnimacoes = "suaves" | "normais" | "reduzidas"
export type UIInfoNivel = "baixo" | "medio" | "alto"

export type UIState = {
  modo:                    UIModo
  intensidadeGlow:         number        // 0.3 – 1.0
  nivelInformacao:         UIInfoNivel
  animacoes:               UIAnimacoes
  mostrarBlocosSecundarios: boolean
  atmosfera:               UIAtmosfera
  mensagemAtmosferica:     string
  corPrimaria:             string
  corSecundaria:           string
  opacidadeBackground:     number        // 0.5 – 1.0
  espacoVazio:             "compacto" | "normal" | "amplo"
  destaquePrincipal:       "progresso" | "estabilidade" | "descanso" | "foco"
}

export type UIStateInput = {
  decisao:    DecisionState
  previsao:   ForecastState
  inteligencia: IntelligenceSummary
  perfil:     PersonalProfile
}

// ── Motor principal ───────────────────────────────────

export function generateUIState(input: UIStateInput): UIState {
  const { decisao, previsao, inteligencia, perfil } = input

  const sobrecarga  = decisao.sobrecargaScore
  const clareza     = decisao.clarezaScore
  const energia     = decisao.energiaScore
  const estabilidade = decisao.estabilidadeScore
  const modoProtecao = inteligencia.mostrarModoProtecao
  const estadoGeral  = inteligencia.estadoGeral

  // ── 1. MODO ───────────────────────────────────────
  let modo: UIModo

  if (modoProtecao || sobrecarga >= 65) {
    modo = "protecao"
  } else if (
    previsao.estabilidadePrevista !== "alta" &&
    (previsao.tendenciaClareza === "caindo" || previsao.tendenciaEnergia === "caindo") &&
    estabilidade < 55
  ) {
    modo = "oscilacao"
  } else if (
    estadoGeral === "leve" &&
    clareza >= 60 &&
    energia >= 55 &&
    previsao.estabilidadePrevista === "alta"
  ) {
    modo = "expansao"
  } else {
    modo = "leve"
  }

  // ── 2. ATMOSFERA ──────────────────────────────────
  let atmosfera: UIAtmosfera

  if (modo === "protecao") {
    atmosfera = "minimalista"
  } else if (modo === "expansao") {
    atmosfera = "expansiva"
  } else if (modo === "oscilacao") {
    atmosfera = "contemplativa"
  } else {
    atmosfera = "calma"
  }

  // ── 3. INTENSIDADE DO GLOW ────────────────────────
  // Protecao = menos brilho, expansao = mais brilho
  let intensidadeGlow: number

  switch (modo) {
    case "protecao":  intensidadeGlow = 0.35; break
    case "oscilacao": intensidadeGlow = 0.50; break
    case "leve":      intensidadeGlow = 0.65; break
    case "expansao":  intensidadeGlow = 0.90; break
  }

  // Ajuste fino pela clareza
  intensidadeGlow = Math.min(1.0, intensidadeGlow + (clareza - 50) / 300)
  intensidadeGlow = Math.max(0.3, intensidadeGlow)

  // ── 4. NÍVEL DE INFORMAÇÃO ────────────────────────
  let nivelInformacao: UIInfoNivel

  if (modo === "protecao") {
    nivelInformacao = "baixo"
  } else if (modo === "expansao") {
    nivelInformacao = "alto"
  } else if (modo === "oscilacao") {
    nivelInformacao = "baixo"
  } else {
    nivelInformacao = "medio"
  }

  // ── 5. ANIMAÇÕES ──────────────────────────────────
  let animacoes: UIAnimacoes

  if (modo === "protecao" || sobrecarga >= 60) {
    animacoes = "reduzidas"
  } else if (modo === "expansao") {
    animacoes = "normais"
  } else {
    animacoes = "suaves"
  }

  // ── 6. BLOCOS SECUNDÁRIOS ─────────────────────────
  const mostrarBlocosSecundarios =
    modo !== "protecao" &&
    modo !== "oscilacao" &&
    nivelInformacao !== "baixo"

  // ── 7. CORES ──────────────────────────────────────
  let corPrimaria: string
  let corSecundaria: string

  switch (modo) {
    case "protecao":
      corPrimaria   = "#fb923c"
      corSecundaria = "#f59e0b"
      break
    case "oscilacao":
      corPrimaria   = "#818cf8"
      corSecundaria = "#6366f1"
      break
    case "expansao":
      corPrimaria   = "#10b981"
      corSecundaria = "#34d399"
      break
    case "leve":
    default:
      corPrimaria   = "#7c3aed"
      corSecundaria = "#a855f7"
      break
  }

  // ── 8. OPACIDADE DO BACKGROUND ────────────────────
  // Protecao = mais sóbrio, expansao = levemente mais rico
  const opacidadeBackground =
    modo === "protecao" ? 0.6 :
    modo === "oscilacao" ? 0.7 :
    modo === "expansao" ? 0.95 : 0.85

  // ── 9. ESPAÇO VAZIO ───────────────────────────────
  const espacoVazio =
    modo === "protecao" ? "amplo" :
    modo === "expansao" ? "compacto" : "normal"

  // ── 10. DESTAQUE PRINCIPAL ────────────────────────
  let destaquePrincipal: UIState["destaquePrincipal"]

  if (modo === "protecao") {
    destaquePrincipal = "descanso"
  } else if (modo === "oscilacao") {
    destaquePrincipal = "estabilidade"
  } else if (modo === "expansao") {
    destaquePrincipal = "progresso"
  } else {
    destaquePrincipal = "foco"
  }

  // ── 11. MENSAGEM ATMOSFÉRICA ──────────────────────
  const mensagens: Record<UIModo, string[]> = {
    protecao: [
      "Hoje talvez seja melhor desacelerar.",
      "Menos é mais agora. Uma coisa de cada vez.",
      "Proteja sua energia. O resto pode esperar.",
    ],
    oscilacao: [
      "Talvez seja um bom momento para voltar ao básico.",
      "Períodos instáveis também passam. Observe com calma.",
      "Pequenas âncoras ajudam quando o ritmo oscila.",
    ],
    expansao: [
      "Seu sistema parece ter espaço para avançar.",
      "Há clareza. Aproveite para dar um passo real.",
      "Esse parece um bom momento para crescer.",
    ],
    leve: [
      "Continue no ritmo. O básico está funcionando.",
      "Consistência silenciosa é evolução real.",
      "Seu sistema parece estável. Proteja isso.",
    ],
  }

  const lista = mensagens[modo]
  const idx = new Date().getDate() % lista.length
  const mensagemAtmosferica = lista[idx]

  return {
    modo,
    intensidadeGlow,
    nivelInformacao,
    animacoes,
    mostrarBlocosSecundarios,
    atmosfera,
    mensagemAtmosferica,
    corPrimaria,
    corSecundaria,
    opacidadeBackground,
    espacoVazio,
    destaquePrincipal,
  }
}