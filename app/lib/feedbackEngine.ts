// ══════════════════════════════════════════════════════
// FEEDBACK ENGINE — Aprendizado com feedback do usuário
// ══════════════════════════════════════════════════════

export type FeedbackResposta =
  | "fez_sentido"
  | "nao_fez_sentido"
  | "ajudou"
  | "nao_ajudou"

export type FeedbackTargetType =
  | "insight"
  | "intervention"
  | "decision"
  | "forecast"
  | "memory"
  | "profile"

export type UserFeedback = {
  id: string
  targetId: string
  targetType: FeedbackTargetType
  resposta: FeedbackResposta
  comentario?: string
  data: string
}

export type FeedbackSummary = {
  totalFeedbacks: number
  acertos: number
  erros: number
  taxaAcerto: number
  sugestoesMaisUteis: string[]
  sugestoesMenosUteis: string[]
  confiancaDoSistema: "baixa" | "moderada" | "alta"
  mensagem: string
}

// ── Chave de storage ──────────────────────────────────
const STORAGE_KEY = "focus-feedbacks-v1"

// ── Salvar feedback ───────────────────────────────────
export function salvarFeedback(feedback: Omit<UserFeedback, "id" | "data">): UserFeedback {
  const novo: UserFeedback = {
    ...feedback,
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    data: new Date().toISOString().slice(0, 10),
  }

  try {
    const existentes = carregarFeedbacks()
    // Evita duplicata no mesmo dia para o mesmo target
    const semDuplicata = existentes.filter(
      f => !(f.targetId === novo.targetId && f.data === novo.data)
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...semDuplicata, novo]))
  } catch {
    // silencia erros de storage
  }

  return novo
}

// ── Carregar feedbacks ────────────────────────────────
export function carregarFeedbacks(): UserFeedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as UserFeedback[]
  } catch {
    return []
  }
}

// ── Verificar se já deu feedback hoje ────────────────
export function jaFeedbackHoje(targetId: string): UserFeedback | null {
  const hoje = new Date().toISOString().slice(0, 10)
  const feedbacks = carregarFeedbacks()
  return feedbacks.find(f => f.targetId === targetId && f.data === hoje) || null
}

// ── Resumo do sistema de feedback ────────────────────
export function generateFeedbackSummary(feedbacks: UserFeedback[]): FeedbackSummary {
  const total = feedbacks.length

  if (total === 0) {
    return {
      totalFeedbacks: 0,
      acertos: 0,
      erros: 0,
      taxaAcerto: 0,
      sugestoesMaisUteis: [],
      sugestoesMenosUteis: [],
      confiancaDoSistema: "baixa",
      mensagem: "Ainda sem feedbacks. Responda às sugestões para o sistema aprender.",
    }
  }

  const positivos = feedbacks.filter(
    f => f.resposta === "fez_sentido" || f.resposta === "ajudou"
  )
  const negativos = feedbacks.filter(
    f => f.resposta === "nao_fez_sentido" || f.resposta === "nao_ajudou"
  )

  const acertos = positivos.length
  const erros   = negativos.length
  const taxaAcerto = Math.round((acertos / total) * 100)

  // Sugestões mais úteis (targetIds com mais positivos)
  const scorePorTarget: Record<string, number> = {}
  feedbacks.forEach(f => {
    if (!scorePorTarget[f.targetId]) scorePorTarget[f.targetId] = 0
    scorePorTarget[f.targetId] += (f.resposta === "fez_sentido" || f.resposta === "ajudou") ? 1 : -1
  })

  const sorted = Object.entries(scorePorTarget).sort((a, b) => b[1] - a[1])
  const sugestoesMaisUteis  = sorted.filter(([_, s]) => s > 0).map(([id]) => id).slice(0, 3)
  const sugestoesMenosUteis = sorted.filter(([_, s]) => s < 0).map(([id]) => id).slice(0, 3)

  // Confiança do sistema
  const confiancaDoSistema: "baixa" | "moderada" | "alta" =
    total < 5   ? "baixa" :
    taxaAcerto >= 70 ? "alta" :
    taxaAcerto >= 45 ? "moderada" : "baixa"

  // Mensagem
  let mensagem = ""
  if (taxaAcerto >= 75) {
    mensagem = "O sistema está acertando bem. Continue respondendo para refinar ainda mais."
  } else if (taxaAcerto >= 50) {
    mensagem = "O sistema está aprendendo. Seus feedbacks ajudam a calibrar as sugestões."
  } else if (total < 5) {
    mensagem = "Poucas respostas ainda. Quanto mais você responde, mais preciso o sistema fica."
  } else {
    mensagem = "O sistema ainda está calibrando. Seus feedbacks negativos são muito valiosos."
  }

  return {
    totalFeedbacks: total,
    acertos,
    erros,
    taxaAcerto,
    sugestoesMaisUteis,
    sugestoesMenosUteis,
    confiancaDoSistema,
    mensagem,
  }
}

// ── Componente de feedback (lógica pura) ──────────────
// Usado pelas páginas para renderizar o botão de feedback

export function getFeedbackState(targetId: string): "sim" | "nao" | null {
  const fb = jaFeedbackHoje(targetId)
  if (!fb) return null
  return (fb.resposta === "fez_sentido" || fb.resposta === "ajudou") ? "sim" : "nao"
}